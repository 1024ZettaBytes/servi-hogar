import { connectToDatabase, isConnected } from '../db';
import { Sale } from '../models/Sale';
import { SaleDelivery } from '../models/SaleDelivery';
import { SalePayment } from '../models/SalePayment';
import { SalesMachine } from '../models/SalesMachine';
import { Customer } from '../models/Customer';
import { User } from '../models/User';
import { uploadFile } from '../cloud';
import { getFileExtension, setDateToInitial, setDateToEnd, dateFromString } from '../client/utils';
import { updateResidenceDataFunc } from './Customers';
import { markSalesMachineAsSold, markSalesMachineAsPending, returnSalesMachineAfterRepair } from './SalesMachines';
import { SalePickup } from '../models/SalePickup';
import { SaleRepair } from '../models/SaleRepair';

// Initialize models to ensure Mongoose knows about them
SalesMachine.init();
Customer.init();
User.init();

// Helper function to manually populate machine from either collection
async function populateMachineForSale(sale) {
  if (!sale.machine) return sale;
  
  // Try to find in sales_machines first
  let machine = await SalesMachine.findById(sale.machine)
    .select('machineNum brand capacity cost warranty')
    .lean();
  
  // If not found, try in machines collection (for legacy sales)
  if (!machine) {
    const { Machine } = require('../models/Machine');
    machine = await Machine.findById(sale.machine)
      .select('machineNum brand capacity cost warranty')
      .lean();
  }
  return {
    ...sale,
    machine: machine || null
  };
}

export async function getSalesData() {
  if (!isConnected()) {
    await connectToDatabase();
  }
  
  // Get all sales without populating machine first
  const sales = await Sale.find({})
    .populate([
      {
        path: 'customer',
        select: 'name'
      },
      {
        path: 'createdBy',
        select: 'name'
      }
    ])
    .sort({ saleDate: -1 })
    .lean();

  // For each sale, manually populate machine and get delivery info
  const salesWithDelivery = await Promise.all(
    sales.map(async (sale) => {
      // Manually populate machine from either collection
      const saleWithMachine = await populateMachineForSale(sale);
      
      const delivery = await SaleDelivery.findOne({ sale: sale._id })
        .populate({
          path: 'completedBy',
          select: 'name'
        })
        .lean();

      // Check for pending warranty processes
      const hasPendingPickup = await SalePickup.exists({
        sale: sale._id,
        status: { $in: ['ESPERA', 'ASIGNADA'] }
      });

      const hasPendingRepair = await SaleRepair.exists({
        machine: sale.machine,
        status: 'PENDIENTE'
      });

      const hasPendingRepairDelivery = await SaleDelivery.exists({
        sale: sale._id,
        isRepairReturn: true,
        status: { $in: ['PENDIENTE', 'ASIGNADA'] }
      });

      // Include delivery data if exists, otherwise null
      return {
        ...saleWithMachine,
        delivery: delivery ? {
          _id: delivery._id,
          status: delivery.status,
          completedBy: delivery.completedBy,
          completedAt: delivery.completedAt,
          deliveryDate: delivery.deliveryDate,
          imagesUrl: delivery.imagesUrl,
          cancellationReason: delivery.cancellationReason
        } : null,
        hasWarrantyProcess: !!(hasPendingPickup || hasPendingRepair || hasPendingRepairDelivery)
      };
    })
  );

  salesWithDelivery.sort((a, b) => {
    const isCancelledA = a.status === 'CANCELADA';
    const isCancelledB = b.status === 'CANCELADA';

    if (isCancelledA && !isCancelledB) return 1; 
    if (!isCancelledA && isCancelledB) return -1; 
    return 0; 
  });
  
  return salesWithDelivery;
}

export async function getPendingSalesData() {
  if (!isConnected()) {
    await connectToDatabase();
  }
  
  // Get pending/assigned deliveries with populated sale data (without machine)
  const pendingDeliveries = await SaleDelivery.find({ 
    status: { $in: ['PENDIENTE', 'ASIGNADA'] },
    $or: [
        { type: 'ENTREGA' },
        { type: { $exists: false } } 
    ]
  })
    .populate({
      path: 'sale',
      populate: [
        {
          path: 'customer',
          select: 'name cell lastRent currentResidence',
          populate: {
            path: 'currentResidence',
            select: 'nameRef telRef street suburb residenceRef maps sector city',
            populate: [
              {
                path: 'sector',
                select: 'name'
              },
              {
                path: 'city',
                select: 'name'
              }
            ]
          }
        },
        {
          path: 'createdBy',
          select: 'name'
        }
      ]
    })
    .populate({
      path: 'assignedTo',
      select: 'name'
    })
    .sort({ createdAt: -1 })
    .lean();
  
  // Manually populate machines and map to include delivery info with sale
  const salesWithMachines = await Promise.all(
    pendingDeliveries.map(async (delivery) => {
      const saleWithMachine = await populateMachineForSale(delivery.sale);
      return {
        ...saleWithMachine,
        delivery: {
          _id: delivery._id,
          status: delivery.status,
          assignedTo: delivery.assignedTo,
          deliveryDate: delivery.deliveryDate,
          isRepairReturn: delivery.isRepairReturn || false
        }
      };
    })
  );
  
  return salesWithMachines;
}

export async function getPendingSalesForOperator(operatorId) {
  if (!isConnected()) {
    await connectToDatabase();
  }
  
  const pendingDeliveries = await SaleDelivery.find({ 
    status: 'ASIGNADA',
    assignedTo: operatorId
  })
    .populate({
      path: 'sale',
      populate: [
        {
          path: 'machine',
          select: 'machineNum brand capacity',
          model: 'sales_machines'
        },
        {
          path: 'customer',
          select: 'name cell lastRent currentResidence',
          populate: {
            path: 'currentResidence',
            select: 'nameRef telRef street suburb residenceRef maps sector city',
            populate: [
              {
                path: 'sector',
                select: 'name'
              },
              {
                path: 'city',
                select: 'name'
              }
            ]
          }
        },
        {
          path: 'createdBy',
          select: 'name'
        }
      ]
    })
    .populate({
      path: 'assignedTo',
      select: 'name'
    })
    .sort({ createdAt: -1 })
    .lean();
  
  return pendingDeliveries.map(delivery => ({
    ...delivery.sale,
    delivery: {
      _id: delivery._id,
      status: delivery.status,
      assignedTo: delivery.assignedTo,
      deliveryDate: delivery.deliveryDate,
      isRepairReturn: delivery.isRepairReturn || false
    }
  }));
}

export async function getCompletedSalesForOperator(operatorId) {
  if (!isConnected()) {
    await connectToDatabase();
  }
  
  const completedDeliveries = await SaleDelivery.find({ 
    status: 'COMPLETADA',
    completedBy: operatorId
  })
    .populate({
      path: 'sale',
      populate: [
        {
          path: 'machine',
          select: 'machineNum brand capacity',
          model: 'sales_machines'
        },
        {
          path: 'customer',
          select: 'name cell lastRent currentResidence',
          populate: {
            path: 'currentResidence',
            select: 'nameRef telRef street suburb residenceRef maps sector city',
            populate: [
              {
                path: 'sector',
                select: 'name'
              },
              {
                path: 'city',
                select: 'name'
              }
            ]
          }
        },
        {
          path: 'createdBy',
          select: 'name'
        }
      ]
    })
    .populate({
      path: 'completedBy',
      select: 'name'
    })
    .sort({ completedAt: -1 })
    .lean();
  
  return completedDeliveries.map(delivery => ({
    ...delivery.sale,
    delivery: {
      _id: delivery._id,
      status: delivery.status,
      completedBy: delivery.completedBy,
      completedAt: delivery.completedAt,
      deliveryDate: delivery.deliveryDate,
      imagesUrl: delivery.imagesUrl
    }
  }));
}

export async function assignSaleToOperator({
  saleId,
  operatorId,
  assignedBy
}) {
  const currentDate = new Date();
  let error = new Error();
  error.name = 'Internal';

  if (!saleId || !operatorId) {
    error.message = 'Parámetros incorrectos';
    throw error;
  }

  const conn = await connectToDatabase();
  const session = await conn.startSession();

  try {
    await session.startTransaction();

    const sale = await Sale.findById(saleId);
    if (!sale) {
      error.message = 'La venta no existe';
      throw error;
    }

    // Check if delivery already exists
    // For sales, get the most recent pending/assigned delivery
    let delivery = await SaleDelivery.findOne({ 
      sale: saleId,
      status: { $in: ['PENDIENTE', 'ASIGNADA'] }
    }).sort({ createdAt: -1 });
    
    if (!delivery) {
      error.message = 'No se encontró una entrega pendiente asociada';
      throw error;
    }

    // Verify operator exists and has OPE role
    const operator = await User.findById(operatorId).populate('role');
    if (!operator) {
      error.message = 'El operador seleccionado no existe';
      throw error;
    }

    if (operator.role?.id !== 'OPE') {
      error.message = 'El usuario seleccionado no es un operador';
      throw error;
    }

    delivery.status = 'ASIGNADA';
    delivery.assignedTo = operatorId;
    delivery.assignedBy = assignedBy;
    delivery.assignedAt = currentDate;
    delivery.updatedAt = currentDate;
    delivery.lastUpdatedBy = assignedBy;
    await delivery.save({ session, isNew: false });

    await session.commitTransaction();
    await session.endSession();

    return { success: true };
  } catch (e) {
    console.error(e);
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    await session.endSession();
    if (e.name === 'Internal') throw e;
    else {
      throw new Error('Ocurrió un error al asignar el operador. Intente de nuevo.');
    }
  }
}

export async function getSaleById(saleId) {
  if (!isConnected()) {
    await connectToDatabase();
  }
  
  const sale = await Sale.findById(saleId)
    .populate([
      {
        path: 'machine',
        select: 'machineNum brand capacity cost',
        model: 'sales_machines'
      },
      {
        path: 'customer',
        select: 'name phone residence'
      },
      {
        path: 'createdBy',
        select: 'name'
      },
      {
        path: 'lastUpdatedBy',
        select: 'name'
      }
    ])
    .lean();
  
  return sale;
}

export async function getSaleWithPayments(saleId) {
  if (!isConnected()) {
    await connectToDatabase();
  }
  
  const sale = await Sale.findById(saleId)
    .populate([
      {
        path: 'machine',
        select: 'machineNum brand capacity cost warranty',
        model: 'sales_machines'
      },
      {
        path: 'customer',
        select: 'name phone residence'
      },
      {
        path: 'createdBy',
        select: 'name'
      },
      {
        path: 'lastUpdatedBy',
        select: 'name'
      }
    ])
    .lean();
  
  if (!sale) {
    return null;
  }
  
  // Get payment history
  const payments = await SalePayment.find({ sale: saleId })
    .populate({
      path: 'createdBy',
      select: 'name'
    })
    .sort({ paymentDate: -1 })
    .lean();
  
  const delivery = await SaleDelivery.findOne({ sale: saleId })
    .select('cancellationReason') 
    .lean();

  return {
    ...sale,
    payments,
    delivery: delivery ? {
        cancellationReason: delivery.cancellationReason,
    } : null
  };
}

export async function getSaleForDelivery(saleId) {
  if (!isConnected()) {
    await connectToDatabase();
  }
  
  // Get sale with full customer/residence data for delivery workflow
  const sale = await Sale.findById(saleId)
    .populate([
      {
        path: 'machine',
        select: 'machineNum brand capacity',
        model: 'sales_machines'
      },
      {
        path: 'customer',
        select: 'name cell email lastRent currentResidence',
        populate: {
          path: 'currentResidence',
          select: 'nameRef telRef street suburb residenceRef maps sector city',
          populate: [
            {
              path: 'sector',
              select: 'name'
            },
            {
              path: 'city',
              select: 'name sectors',
              populate: {
                path: 'sectors',
                select: 'name'
              }
            }
          ]
        }
      },
      {
        path: 'createdBy',
        select: 'name'
      }
    ])
    .lean();
  
  if (!sale) {
    return null;
  }
  
  // Get the associated delivery
  const delivery = await SaleDelivery.findOne({ sale: saleId })
    .populate({
      path: 'assignedTo',
      select: 'name'
    })
    .lean();
  
  return {
    ...sale,
    delivery
  };
}

export async function saveSaleData({
  machineId,
  serialNumber,
  customerId,
  saleDate,
  totalAmount,
  initialPayment,
  totalWeeks,
  createdBy
}) {
  const currentDate = new Date();
  const saleDateToUse = saleDate ? new Date(saleDate) : currentDate;
  let error = new Error();
  error.name = 'Internal';

  if (!totalAmount || totalAmount <= 0) {
    error.message = 'El monto total debe ser mayor a 0';
    throw error;
  }

  if (!initialPayment || initialPayment < 0) {
    error.message = 'El pago inicial debe ser mayor o igual a 0';
    throw error;
  }

  if (initialPayment > totalAmount) {
    error.message = 'El pago inicial no puede ser mayor al monto total';
    throw error;
  }

  if (!totalWeeks || totalWeeks <= 0) {
    error.message = 'El número de semanas debe ser mayor a 0';
    throw error;
  }

  if (!machineId && !serialNumber) {
    error.message = 'Debe proporcionar un equipo o número de serie';
    throw error;
  }

  const conn = await connectToDatabase();
  const session = await conn.startSession();

  try {
    await session.startTransaction();

    // Get the next sale number
    const lastSale = await Sale.findOne().sort({ saleNum: -1 }).lean();
    const saleNum = lastSale ? lastSale.saleNum + 1 : 1;

    // Verify machine if provided
    let machine = null;
    if (machineId) {
      machine = await SalesMachine.findById(machineId);
      if (!machine) {
        error.message = 'El equipo seleccionado no existe';
        throw error;
      }
      if (machine.isSold) {
        error.message = 'El equipo seleccionado ya fue vendido';
        throw error;
      }
    }

    // Verify customer if provided
    let customer = null;
    if (customerId) {
      customer = await Customer.findById(customerId);
      if (!customer) {
        error.message = 'El cliente seleccionado no existe';
        throw error;
      }
    }

    // Calculate remaining amount and weekly payment
    const remainingAmount = totalAmount - initialPayment;
    const weeklyPayment = remainingAmount / totalWeeks;

    // Create new sale
    const newSale = new Sale({
      saleNum,
      machine: machineId || null,
      serialNumber: serialNumber || '',
      customer: customerId || null,
      totalAmount,
      initialPayment,
      remainingAmount,
      weeklyPayment,
      totalWeeks,
      paidWeeks: 0,
      accumulatedPayment: 0,
      isPaid: false,
      status: 'ACTIVA',
      saleDate: saleDateToUse,
      lastPaymentDate: null,
      nextPaymentDate: null, // Will be set when delivered
      createdAt: currentDate,
      updatedAt: currentDate,
      createdBy,
      lastUpdatedBy: createdBy
    });

    await newSale.save({ session, isNew: true });

    // Create the sale delivery record
    const newDelivery = new SaleDelivery({
      sale: newSale._id,
      status: 'PENDIENTE',
      deliveryDate: saleDateToUse, // Planned delivery date
      createdAt: currentDate,
      updatedAt: currentDate,
      createdBy,
      lastUpdatedBy: createdBy
    });

    await newDelivery.save({ session, isNew: true });

    // Mark machine as PENDIENTE when sale is created
    if (machineId) {
      await markSalesMachineAsPending({ 
        machineId, 
        lastUpdatedBy: createdBy 
      });
    }

    await session.commitTransaction();
    await session.endSession();

    // Populate the sale with customer and machine data for the format
    const populatedSale = await Sale.findById(newSale._id)
      .populate({
        path: 'customer',
        select: 'name cell lastRent currentResidence',
        populate: {
          path: 'currentResidence',
          select: 'nameRef telRef street suburb residenceRef maps'
        }
      })
      .populate({
        path: 'machine',
        select: 'machineNum brand capacity',
        model: 'sales_machines'
      })
      .lean();

    return populatedSale;
  } catch (e) {
    console.error(e);
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    await session.endSession();
    if (e.name === 'Internal') throw e;
    else {
      throw new Error('Ocurrió un error al guardar la venta. Intente de nuevo.');
    }
  }
}

export async function completeSaleDelivery({ 
  saleId,
  deliveredBy,
  deliveryDate,
  ineImagePath,
  ineImageName,
  frontalImagePath,
  frontalImageName,
  labelImagePath,
  labelImageName,
  boardImagePath,
  boardImageName,
  customerData
}) {
  console.log('=== completeSaleDelivery function called ===');
  console.log('Sale ID:', saleId);
  console.log('Delivered by:', deliveredBy);
  console.log('Delivery date:', deliveryDate);
  console.log('Has INE image:', !!ineImagePath);
  console.log('Has Frontal image:', !!frontalImagePath);
  console.log('Has Label image:', !!labelImagePath);
  console.log('Has Board image:', !!boardImagePath);
  
  const currentDate = new Date();
  const deliveryDateToUse = deliveryDate ? new Date(deliveryDate) : currentDate;
  let error = new Error();
  error.name = 'Internal';

  if (!saleId || !deliveredBy) {
    console.error('❌ Missing saleId or deliveredBy');
    error.message = 'Parámetros incorrectos';
    throw error;
  }

  if (!ineImagePath || !frontalImagePath || !labelImagePath || !boardImagePath) {
    console.error('❌ Missing image paths:', {
      ine: !!ineImagePath,
      frontal: !!frontalImagePath,
      label: !!labelImagePath,
      board: !!boardImagePath
    });
    error.message = 'Faltan imágenes requeridas';
    throw error;
  }

  console.log('Connecting to database...');
  const conn = await connectToDatabase();
  const session = await conn.startSession();

  try {
    console.log('Starting transaction...');
    await session.startTransaction();

    console.log('Finding sale by ID...');
    const sale = await Sale.findById(saleId);
    if (!sale) {
      console.error('❌ Sale not found:', saleId);
      error.message = 'La venta no existe';
      throw error;
    }
    console.log('✅ Sale found:', sale.saleNum);

    // Get the delivery record
    console.log('Finding delivery record...');
    const delivery = await SaleDelivery.findOne({ sale: saleId });
    if (!delivery) {
      console.error('❌ Delivery not found for sale:', saleId);
      error.message = 'No se encontró la entrega asociada';
      throw error;
    }
    console.log('✅ Delivery found, status:', delivery.status);

    if (delivery.status === 'COMPLETADA') {
      console.error('❌ Delivery already completed');
      error.message = 'Esta venta ya fue entregada';
      throw error;
    }

    // Upload images to Google Cloud Storage
    console.log('Preparing to upload images to cloud storage...');
    const timestamp = Date.now();
    const ineExt = getFileExtension(ineImageName);
    const frontalExt = getFileExtension(frontalImageName);
    const labelExt = getFileExtension(labelImageName);
    const boardExt = getFileExtension(boardImageName);
    
    const ineFileName = `sales-deliveries/${saleId}_ine_${timestamp}.${ineExt}`;
    const frontalFileName = `sales-deliveries/${saleId}_frontal_${timestamp}.${frontalExt}`;
    const labelFileName = `sales-deliveries/${saleId}_label_${timestamp}.${labelExt}`;
    const boardFileName = `sales-deliveries/${saleId}_board_${timestamp}.${boardExt}`;
    
    console.log('Uploading 4 images to cloud storage...');

    const [ineUrl, frontalUrl, labelUrl, boardUrl] = await Promise.all([
      uploadFile(ineImagePath, ineFileName),
      uploadFile(frontalImagePath, frontalFileName),
      uploadFile(labelImagePath, labelFileName),
      uploadFile(boardImagePath, boardFileName)
    ]);
    
    console.log('✅ All images uploaded successfully');

    // Update customer data if provided and marked as not okay
    if (customerData) {
      console.log('Processing customer data updates...');
      const isOk = customerData.isOk || { info: true, residence: true };
      
      // Only update if user marked info or residence as not okay
      if (!isOk.info || !isOk.residence) {
        console.log('Customer data needs update:', { infoOk: isOk.info, residenceOk: isOk.residence });
        const customer = await Customer.findById(sale.customer);
        if (customer) {
          
          // Update customer info fields if marked as not okay
          if (!isOk.info) {
            console.log('Updating customer info...');
            if (customerData.name) customer.name = customerData.name;
            if (customerData.cell) customer.cell = customerData.cell;
            if (customerData.email) customer.email = customerData.email;
            
            customer.updatedAt = currentDate;
            customer.lastUpdatedBy = deliveredBy;
            await customer.save({ session, isNew: false });
            console.log('✅ Customer info updated');
          }
          
          // Update residence fields if marked as not okay
          if (!isOk.residence) {
            console.log('Updating residence info...');
            if (customerData.currentResidence) {
              await updateResidenceDataFunc(
                session,
                customerData.currentResidence,
                error
              );
              console.log('✅ Residence info updated');
            }
          }
          
          delivery.customerDataUpdated = true;
          delivery.updatedCustomerData = customerData;
        }
      } else {
        console.log('Customer data marked as OK, no updates needed');
      }
    } else {
      console.log('No customer data provided');
    }

    // Calculate next payment date (7 days from delivery date if not fully paid)
    let nextPaymentDate = null;
    if (sale.initialPayment < sale.totalAmount) {
      nextPaymentDate = new Date(deliveryDateToUse);
      nextPaymentDate.setDate(nextPaymentDate.getDate() + 7);
    }

    // Update delivery record
    delivery.status = 'COMPLETADA';
    delivery.completedAt = currentDate;
    delivery.completedBy = deliveredBy;
    delivery.deliveryDate = deliveryDateToUse;
    delivery.imagesUrl = {
      ine: ineUrl,
      frontal: frontalUrl,
      label: labelUrl,
      board: boardUrl
    };
    delivery.updatedAt = currentDate;
    delivery.lastUpdatedBy = deliveredBy;
    await delivery.save({ session, isNew: false });

    // Update sale with delivery completion
    sale.saleDate = deliveryDateToUse; // Actual sale date is the delivery date
    sale.lastPaymentDate = sale.initialPayment > 0 ? deliveryDateToUse : null;
    sale.nextPaymentDate = nextPaymentDate;
    sale.updatedAt = currentDate;
    sale.lastUpdatedBy = deliveredBy;

    // If initial payment covers everything, mark as paid
    if (sale.initialPayment >= sale.totalAmount) {
      sale.isPaid = true;
      sale.status = 'PAGADA';
      sale.paidWeeks = sale.totalWeeks;
      sale.nextPaymentDate = null;
    }

    console.log('Saving sale updates...');
    await sale.save({ session, isNew: false });
    console.log('✅ Sale saved');

    // If machine is linked, mark it as sold
    if (sale.machine) {
      console.log('Marking machine as sold...');
      await markSalesMachineAsSold({ 
        machineId: sale.machine,
        lastUpdatedBy: deliveredBy,
        session: session,
        deliveryDate: deliveryDateToUse
      });
      console.log('✅ Machine marked as sold');
    }

    console.log('Committing transaction...');
    await session.commitTransaction();
    await session.endSession();
    console.log('✅✅✅ Sale delivery completed successfully! ✅✅✅');

    return { success: true };
  } catch (e) {
    console.error('❌ Error in completeSaleDelivery:');
    console.error('Error name:', e.name);
    console.error('Error message:', e.message);
    console.error('Error stack:', e.stack);
    
    if (session.inTransaction()) {
      console.log('Aborting transaction...');
      await session.abortTransaction();
    }
    await session.endSession();
    
    if (e.name === 'Internal') throw e;
    else {
      throw new Error('Ocurrió un error al completar la entrega. Intente de nuevo.');
    }
  }
}

export async function completeRepairReturnDelivery({
  saleId,
  deliveredBy,
  deliveryDate,
  evidenceImagePath,
  evidenceImageName
}) {
  console.log('=== completeRepairReturnDelivery function called ===');
  console.log('Sale ID:', saleId);
  console.log('Delivered by:', deliveredBy);
  console.log('Delivery date:', deliveryDate);
  console.log('Has evidence image:', !!evidenceImagePath);

  const currentDate = new Date();
  const deliveryDateToUse = deliveryDate ? new Date(deliveryDate) : currentDate;
  let error = new Error();
  error.name = 'Internal';

  if (!saleId || !deliveredBy) {
    console.error('❌ Missing saleId or deliveredBy');
    error.message = 'Parámetros incorrectos';
    throw error;
  }

  if (!evidenceImagePath) {
    console.error('❌ Missing evidence image');
    error.message = 'Se requiere una imagen de evidencia';
    throw error;
  }

  console.log('Connecting to database...');
  const conn = await connectToDatabase();
  const session = await conn.startSession();

  try {
    console.log('Starting transaction...');
    await session.startTransaction();

    console.log('Finding sale by ID...');
    const sale = await Sale.findById(saleId);
    if (!sale) {
      console.error('❌ Sale not found:', saleId);
      error.message = 'La venta no existe';
      throw error;
    }
    console.log('✅ Sale found:', sale.saleNum);

    // Get the delivery record
    console.log('Finding delivery record...');
    const delivery = await SaleDelivery.findOne({ 
      sale: saleId,
      isRepairReturn: true 
    });
    if (!delivery) {
      console.error('❌ Repair return delivery not found for sale:', saleId);
      error.message = 'No se encontró la entrega de reparación asociada';
      throw error;
    }
    console.log('✅ Repair return delivery found, status:', delivery.status);

    if (delivery.status === 'COMPLETADA') {
      console.error('❌ Delivery already completed');
      error.message = 'Esta entrega de reparación ya fue completada';
      throw error;
    }

    // Validate machine is LISTO and in vehicle
    console.log('Validating machine status and location...');
    const machine = await SalesMachine.findById(sale.machine);
    if (!machine) {
      console.error('❌ Machine not found');
      error.message = 'No se encontró la máquina asociada';
      throw error;
    }

    if (machine.status !== 'LISTO') {
      console.error('❌ Machine status is not LISTO:', machine.status);
      error.message = 'La máquina debe estar en estado LISTO para completar la entrega';
      throw error;
    }

    if (!machine.currentVehicle) {
      console.error('❌ Machine is not in a vehicle');
      error.message = 'La máquina debe estar en un vehículo para completar la entrega';
      throw error;
    }
    console.log('✅ Machine validation passed - LISTO and in vehicle');

    // Upload evidence image to Google Cloud Storage
    console.log('Uploading evidence image to cloud storage...');
    const timestamp = Date.now();
    const imageExt = getFileExtension(evidenceImageName);
    const imageFileName = `repair-return-deliveries/${saleId}_evidence_${timestamp}.${imageExt}`;
    const imageUrl = await uploadFile(evidenceImagePath, imageFileName);
    console.log('✅ Evidence image uploaded successfully');

    // Update delivery record
    delivery.status = 'COMPLETADA';
    delivery.completedAt = currentDate;
    delivery.completedBy = deliveredBy;
    delivery.deliveryDate = deliveryDateToUse;
    delivery.evidenceImageUrl = imageUrl;
    delivery.updatedAt = currentDate;
    delivery.lastUpdatedBy = deliveredBy;
    await delivery.save({ session, isNew: false });
    console.log('✅ Delivery record updated');

    // Return machine to VENDIDO status after repair (clears vehicle/warehouse)
    console.log('Returning machine to VENDIDO status...');
    await returnSalesMachineAfterRepair({
      machineId: sale.machine,
      lastUpdatedBy: deliveredBy,
      session
    });
    console.log('✅ Machine returned to VENDIDO status');

    console.log('Committing transaction...');
    await session.commitTransaction();
    await session.endSession();
    console.log('✅✅✅ Repair return delivery completed successfully! ✅✅✅');

    return { success: true };
  } catch (e) {
    console.error('❌ Error in completeRepairReturnDelivery:');
    console.error('Error name:', e.name);
    console.error('Error message:', e.message);
    console.error('Error stack:', e.stack);

    if (session.inTransaction()) {
      console.log('Aborting transaction...');
      await session.abortTransaction();
    }
    await session.endSession();

    if (e.name === 'Internal') throw e;
    else {
      throw new Error('Ocurrió un error al completar la entrega de reparación. Intente de nuevo.');
    }
  }
}

export async function registerSalePayment({
  saleId,
  paymentAmount,
  paymentDate,
  paymentImagePath,
  paymentImageName,
  lastUpdatedBy
}) {
  const currentDate = new Date();
  const paymentDateToUse = paymentDate ? new Date(paymentDate) : currentDate;
  let error = new Error();
  error.name = 'Internal';

  if (!saleId || !paymentAmount || paymentAmount <= 0) {
    error.message = 'Parámetros incorrectos';
    throw error;
  }

  if (!paymentImagePath) {
    error.message = 'Se requiere una foto del comprobante de pago';
    throw error;
  }

  const conn = await connectToDatabase();
  const session = await conn.startSession();

  try {
    await session.startTransaction();

    const sale = await Sale.findById(saleId);
    if (!sale) {
      error.message = 'La venta no existe';
      throw error;
    }

    if (sale.isPaid) {
      error.message = 'Esta venta ya está pagada completamente';
      throw error;
    }

    // Upload payment image to Google Cloud Storage
    const timestamp = Date.now();
    const imageExt = getFileExtension(paymentImageName);
    const imageFileName = `sales-payments/${saleId}_payment_${timestamp}.${imageExt}`;
    const imageUrl = await uploadFile(paymentImagePath, imageFileName);

    // Add payment to accumulated amount
    const totalAccumulated = (sale.accumulatedPayment || 0) + paymentAmount;
    
    // Calculate how many full weeks are covered by the total accumulated payment
    const weeksCovered = Math.floor(totalAccumulated / sale.weeklyPayment);
    
    // Calculate remaining accumulated payment after covering full weeks
    const newAccumulatedPayment = totalAccumulated % sale.weeklyPayment;
    
    // Create payment history record
    const salePayment = new SalePayment({
      sale: saleId,
      amount: paymentAmount,
      paymentDate: paymentDateToUse,
      weeksCovered,
      imageUrl,
      createdBy: lastUpdatedBy,
      createdAt: currentDate
    });
    await salePayment.save({ session, isNew: true });
    
    // Update sale with new values
    sale.paidWeeks += weeksCovered;
    sale.accumulatedPayment = newAccumulatedPayment;
    sale.remainingAmount -= paymentAmount;
    sale.lastPaymentDate = paymentDateToUse;
    sale.updatedAt = currentDate;
    sale.lastUpdatedBy = lastUpdatedBy;

    // Check if sale is now fully paid
    if (sale.paidWeeks >= sale.totalWeeks || sale.remainingAmount <= 0) {
      sale.isPaid = true;
      sale.status = 'PAGADA';
      sale.paidWeeks = sale.totalWeeks;
      sale.remainingAmount = 0;
      sale.accumulatedPayment = 0;
      sale.nextPaymentDate = null;
    } else {
      // Calculate next payment date based on weeks covered
      // If there was a previous nextPaymentDate, add (7 days × weeks covered) to maintain schedule
      // Otherwise, add (7 days × weeks covered) from the payment date
      let nextPaymentDate;
      if (weeksCovered > 0) {
        if (sale.nextPaymentDate) {
          // Maintain the original payment schedule by adding the appropriate number of days
          // based on how many weeks this payment covered
          nextPaymentDate = new Date(sale.nextPaymentDate);
          nextPaymentDate.setDate(nextPaymentDate.getDate() + (7 * weeksCovered));
        } else {
          // First payment after initial, use payment date + (7 days × weeks covered)
          nextPaymentDate = new Date(paymentDateToUse);
          nextPaymentDate.setDate(nextPaymentDate.getDate() + (7 * weeksCovered));
        }
        sale.nextPaymentDate = nextPaymentDate;
      }
      // If weeksCovered is 0, nextPaymentDate stays the same (partial payment towards next week)
    }

    await sale.save({ session, isNew: false });

    await session.commitTransaction();
    await session.endSession();

    return { success: true };
  } catch (e) {
    console.error(e);
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    await session.endSession();
    if (e.name === 'Internal') throw e;
    else {
      throw new Error('Ocurrió un error al registrar el pago. Intente de nuevo.');
    }
  }
}

export async function getOverdueSalesData() {
  if (!isConnected()) {
    await connectToDatabase();
  }
  
  const today = setDateToInitial(new Date());
  
  // Get all active sales with overdue payments
  const overdueSales = await Sale.find({ 
    status: 'ACTIVA',
    nextPaymentDate: { $lt: today }
  })
    .populate([
      {
        path: 'customer',
        select: 'name cell currentResidence',
        populate: {
          path: 'currentResidence',
          select: 'city sector suburb street',
          populate: [
            { path: 'city', select: 'name' },
            { path: 'sector', select: 'name' }
          ]
        }
      },
      {
        path: 'createdBy',
        select: 'name'
      }
    ])
    .sort({ nextPaymentDate: 1 }) // Most overdue first
    .lean();
  
  // Manually populate machines and filter by delivery status
  const salesWithMachinesAndDelivery = await Promise.all(
    overdueSales.map(async (sale) => {
      const saleWithMachine = await populateMachineForSale(sale);
      
      // Get delivery info
      const delivery = await SaleDelivery.findOne({ sale: sale._id })
        .populate({
          path: 'completedBy',
          select: 'name'
        })
        .lean();
      
      // Only include if delivery is completed
      if (!delivery || delivery.status !== 'COMPLETADA') {
        return null;
      }
      
      return {
        ...saleWithMachine,
        delivery: {
          _id: delivery._id,
          status: delivery.status,
          completedBy: delivery.completedBy,
          completedAt: delivery.completedAt,
          deliveryDate: delivery.deliveryDate,
          imagesUrl: delivery.imagesUrl
        }
      };
    })
  );
  
  // Filter out null values (sales without completed delivery)
  return salesWithMachinesAndDelivery.filter(sale => sale !== null);
}

export async function cancelSaleData({ saleId, cancellationReason, lastUpdatedBy }) {
  const currentDate = new Date();
  let error = new Error();
  error.name = 'Internal';
  let session;

  if (!saleId) {
    error.message = 'Parámetros incorrectos';
    throw error;
  }

  const conn = await connectToDatabase();
  session = await conn.startSession();

  try {
    await session.startTransaction();

    if (!saleId || !cancellationReason) {
      error.message = 'Parámetros incorrectos: saleId o motivo de cancelación faltante.';
      throw error;
    }

    const sale = await Sale.findById(saleId);
    if (!sale) {
      error.message = 'La venta no existe';
      throw error;
    }

    sale.status = 'CANCELADA';
    sale.updatedAt = currentDate;
    sale.lastUpdatedBy = lastUpdatedBy;

    await sale.save({ session, isNew: false });

    const delivery = await SaleDelivery.findOne({ sale: saleId }).session(session);
    if (delivery) {
      delivery.status = 'CANCELADA';
      delivery.cancellationReason = cancellationReason;
      delivery.updatedAt = currentDate;
      delivery.lastUpdatedBy = lastUpdatedBy;
      await delivery.save({ session, isNew: false });
    }

    // Reactivate machine if it was linked (unmark as sold and set to DISPONIBLE)
    if (sale.machine) {
      const machine = await SalesMachine.findById(sale.machine);
      if (machine) {
        machine.isSold = false;
        machine.status = 'DISPONIBLE';
        machine.updatedAt = currentDate;
        machine.lastUpdatedBy = lastUpdatedBy;
        await machine.save({ session, isNew: false });
      }
    }

    await session.commitTransaction();
    await session.endSession();

    return { success: true };
  } catch (e) {
    console.error(e);
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    await session.endSession();
    if (e.name === 'Internal') throw e;
    else {
      throw new Error('Ocurrió un error al cancelar la venta. Intente de nuevo.');
    }
  }
}


export async function getPendingCollectionsData(userRole, userId) {
  if (!isConnected()) {
    await connectToDatabase();
  }

  const query = {
    type: 'COBRANZA', 
  };

if (userRole === 'OPE') {
    query.$or = [
      { status: 'PENDIENTE' }, 
      { status: 'ASIGNADA', assignedTo: userId } 
    ];
  } 
  else {
    query.status = { $in: ['PENDIENTE', 'ASIGNADA'] };
  }

  const collections = await SaleDelivery.find(query)
    .populate({
      path: 'sale', 
      select: 'saleNum totalAmount remainingAmount weeklyPayment', 
      populate: {
        path: 'customer', 
        select: 'name cell currentResidence',
        populate: {
          path: 'currentResidence',
          select: 'street suburb maps sector city',
          populate: [
            { path: 'sector', select: 'name' },
            { path: 'city', select: 'name' }
          ]
        }
      }
    })
    .populate('assignedTo', 'name') 
    .sort({ createdAt: 1 }) 
    .lean();

  return collections;
}


export async function scheduleCollectionVisitData({ saleId, lastUpdatedBy }) {
  const currentDate = new Date();
  let error = new Error(); 
  error.name = 'Internal';
  let session;

  const conn = await connectToDatabase();
  session = await conn.startSession();

  try {
    await session.startTransaction();

    const sale = await Sale.findById(saleId).session(session);
    if (!sale) {
      error.message = 'La venta no existe';
      throw error;
    }

    const currentVisits = sale.collectionVisits || [];

    if (currentVisits.length >= 3) {
      error.message = 'Se ha alcanzado el límite de 3 visitas de cobranza.';
      throw error;
    }

    const nextVisitNumber = currentVisits.length + 1;

    const newDelivery = new SaleDelivery({
      sale: saleId,
      type: 'COBRANZA', 
      status: 'PENDIENTE', 
      deliveryDate: currentDate, 
      createdAt: currentDate,
      updatedAt: currentDate,
      createdBy: lastUpdatedBy,
      lastUpdatedBy: lastUpdatedBy
    });
    await newDelivery.save({ session, isNew: true });

    sale.collectionVisits.push({
    visitNumber: nextVisitNumber,
      createdAt: currentDate,
      completed: false,
      outcome: null, 
      deliveryRef: newDelivery._id
    });
    
    sale.updatedAt = currentDate;
    sale.lastUpdatedBy = lastUpdatedBy;
    await sale.save({ session, isNew: false });

    await session.commitTransaction();
    await session.endSession();

    return { success: true, visitNumber: nextVisitNumber };
  } catch (e) {
    console.error(e);
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    await session.endSession();

    if (e.name === 'Internal') throw e;
    else {
      throw new Error(e.message || 'Ocurrió un error al agendar la visita de cobranza.');    
    }
  }
}

export async function completeCollectionVisitData({ deliveryId, outcome, lastUpdatedBy }) {
  const currentDate = new Date();
  let error = new Error();
  error.name = 'Internal';
  let session;

  const conn = await connectToDatabase();
  session = await conn.startSession();

  try {
    await session.startTransaction();

    const delivery = await SaleDelivery.findById(deliveryId).session(session);
    if (!delivery) {
       throw new Error('La tarea no existe.');
    }

    delivery.status = 'COMPLETADA';
    delivery.completedAt = currentDate;
    delivery.completedBy = lastUpdatedBy;
    delivery.updatedAt = currentDate;
    delivery.lastUpdatedBy = lastUpdatedBy;

    await delivery.save({ session, isNew: false });

    const sale = await Sale.findById(delivery.sale).session(session);
    if (!sale) throw new Error('La venta asociada no existe.');

    const visitIndex = sale.collectionVisits.findIndex(v => 
      v.deliveryRef && v.deliveryRef.toString() === deliveryId.toString()
    );

    if (visitIndex !== -1) {
      sale.collectionVisits[visitIndex].completed = true;
      sale.collectionVisits[visitIndex].outcome = outcome; 
      sale.collectionVisits[visitIndex].completedAt = currentDate;
      sale.collectionVisits[visitIndex].completedBy = lastUpdatedBy;
    }

    sale.updatedAt = currentDate;
    sale.lastUpdatedBy = lastUpdatedBy;
    
    await sale.save({ session, isNew: false });

    await session.commitTransaction();
    await session.endSession();

    return { success: true };
  } catch (e) {
    console.error(e);
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    await session.endSession();
    if (e.name === 'Internal') throw e;
    else {
      throw new Error('Ocurrió un error al completar la cobranza. Intente de nuevo.');
    }
  }
}

export async function getCompletedCollectionsData(page, limit, date = null, userId = null) {
  if (!isConnected()) {
    await connectToDatabase();
  }

  const filter = {
    type: 'COBRANZA',
    status: 'COMPLETADA'
  };

  if (userId) {
    filter.completedBy = userId; 
  }

  if (date) {
    const dateObj = typeof date === 'string' ? dateFromString(date) : date;
    const startOfDay = setDateToInitial(dateObj);
    const endOfDay = setDateToEnd(dateObj);

    filter.completedAt = {
      $gte: startOfDay,
      $lte: endOfDay
    };
  }

  const skip = (page - 1) * limit;

  const collections = await SaleDelivery.find(filter)
    .populate({
      path: 'sale',
      select: 'saleNum customer',
      populate: {
        path: 'customer',
        select: 'name cell phone currentResidence', 
        populate: {
          path: 'currentResidence',
          select: 'street suburb maps sector city',
          populate: { path: 'sector', select: 'name' }
        }
      }
    })
    .populate('completedBy', 'name') 
    .sort({ completedAt: -1 }) 
    .skip(skip)
    .limit(limit)
    .lean();

  return { list: collections }; 
}
