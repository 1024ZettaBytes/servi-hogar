import { connectToDatabase, isConnected } from '../db';
import { Sale } from '../models/Sale';
import { SaleDelivery } from '../models/SaleDelivery';
import { SalePayment } from '../models/SalePayment';
import { SalesMachine } from '../models/SalesMachine';
import { Receipt } from '../models/Receipt';
import { PaymentAccount } from '../models/PaymentAccount';
import { Customer } from '../models/Customer';
import { User } from '../models/User';
import { uploadFile } from '../cloud';
import { getFileExtension, setDateToInitial, setDateToEnd, dateFromString, getTimeFromDate } from '../client/utils';
import { updateResidenceDataFunc } from './Customers';
import { markSalesMachineAsSold, markSalesMachineAsPending, returnSalesMachineAfterRepair } from './SalesMachines';
import { checkAndBlockOperator } from './Users';
import dayjs from 'dayjs';
import { SalePickup } from '../models/SalePickup';
import { Machine } from '../models/Machine';
import { SaleRepair } from '../models/SaleRepair';
import { SaleChange } from '../models/SaleChange';
import { generateReceipt } from './Receipts';
import { isFeatureEnabled } from './FeatureFlags';
import { FEATURE_FLAGS } from '../consts/featureFlags';
import { PAYMENT_METHODS, OFFICE_CASH_METHOD } from '../consts/OBJ_CONTS';

// Initialize models to ensure Mongoose knows about them
PaymentAccount.init();
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

      const hasPendingSaleChange = await SaleChange.exists({
        sale: sale._id,
        status: { $in: ['ESPERA', 'ASIGNADA'] }
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
        hasWarrantyProcess: !!(hasPendingPickup || hasPendingRepair || hasPendingRepairDelivery || hasPendingSaleChange)
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
        select: 'machineNum brand capacity cost warranty latestTecCond',
        model: 'sales_machines',
        populate: { path: 'latestTecCond', select: 'name', model: 'users' }
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
    .select('_id status cancellationReason imagesUrl completedAt completedBy') 
    .populate({
      path: 'completedBy',
      select: 'name'
    })
    .lean();

  return {
    ...sale,
    payments,
    delivery: delivery ? {
        _id: delivery._id,
        status: delivery.status,
        cancellationReason: delivery.cancellationReason,
        imagesUrl: delivery.imagesUrl,
        completedAt: delivery.completedAt,
        completedBy: delivery.completedBy
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
        select: 'machineNum brand capacity serialNumber',
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
  cashPrice,
  totalAmount,
  initialPayment,
  totalWeeks,
  createdBy,
  soldBy,
  isUpfrontCashPayment,
  paymentMethod,
  paymentAccountId,
  paymentImagePath,
  paymentImageName
}) {
  const currentDate = new Date();
  const saleDateToUse = saleDate ? new Date(saleDate) : currentDate;
  let error = new Error();
  error.name = 'Internal';

  if (isUpfrontCashPayment) {
    // For upfront cash payment, only cashPrice is required
    if (!cashPrice || cashPrice <= 0) {
      error.message = 'El precio de contado debe ser mayor a 0';
      throw error;
    }
    if (!paymentMethod) {
      error.message = 'Se requiere el método de pago';
      throw error;
    }
    const requiresImage = paymentMethod === 'TRANSFER' || paymentMethod === 'DEP';
    if (requiresImage && !paymentImagePath) {
      error.message = 'Se requiere una foto del comprobante de pago';
      throw error;
    }
    if (requiresImage && !paymentAccountId) {
      error.message = 'Se requiere seleccionar una cuenta de pago';
      throw error;
    }
  } else {
    // Normal credit sale validations
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

    // For upfront cash payment, set credit fields to match cashPrice
    const effectiveTotalAmount = isUpfrontCashPayment ? cashPrice : totalAmount;
    const effectiveInitialPayment = isUpfrontCashPayment ? cashPrice : initialPayment;
    const effectiveTotalWeeks = isUpfrontCashPayment ? 1 : totalWeeks;

    // Calculate remaining amount and weekly payment
    const remainingAmount = effectiveTotalAmount - effectiveInitialPayment;
    const weeklyPayment = effectiveTotalWeeks > 0 ? remainingAmount / effectiveTotalWeeks : 0;

    // Create new sale
    const newSale = new Sale({
      saleNum,
      machine: machineId || null,
      serialNumber: serialNumber || '',
      customer: customerId || null,
      cashPrice: cashPrice || null,
      totalAmount: effectiveTotalAmount,
      initialPayment: effectiveInitialPayment,
      remainingAmount: isUpfrontCashPayment ? 0 : remainingAmount,
      weeklyPayment,
      totalWeeks: effectiveTotalWeeks,
      paidWeeks: isUpfrontCashPayment ? effectiveTotalWeeks : 0,
      accumulatedPayment: 0,
      isPaid: isUpfrontCashPayment ? true : false,
      status: isUpfrontCashPayment ? 'PAGADA' : 'ACTIVA',
      saleDate: saleDateToUse,
      lastPaymentDate: isUpfrontCashPayment ? saleDateToUse : null,
      nextPaymentDate: null, // Will be set when delivered (for credit sales)
      createdAt: currentDate,
      updatedAt: currentDate,
      createdBy,
      soldBy: soldBy || createdBy,
      lastUpdatedBy: createdBy
    });

    await newSale.save({ session, isNew: true });

    // Create the sale delivery record (always created, even for upfront cash)
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

    // If upfront cash payment, create SalePayment and Receipt
    let receipt = null;
    if (isUpfrontCashPayment) {
      // Upload payment image if needed
      let imageUrl = null;
      const requiresImage = paymentMethod === 'TRANSFER' || paymentMethod === 'DEP';
      if (requiresImage && paymentImagePath) {
        const timestamp = Date.now();
        const imageExt = getFileExtension(paymentImageName);
        const imageFileName = `sales-payments/${newSale._id}_payment_${timestamp}.${imageExt}`;
        imageUrl = await uploadFile(paymentImagePath, imageFileName);
      }

      // Create SalePayment record
      const salePayment = new SalePayment({
        sale: newSale._id,
        amount: cashPrice,
        paymentDate: saleDateToUse,
        weeksCovered: effectiveTotalWeeks,
        imageUrl,
        method: paymentMethod,
        paymentAccount: paymentAccountId || null,
        isCashSettlement: true,
        createdBy,
        createdAt: currentDate
      });
      await salePayment.save({ session, isNew: true });

      // Generate receipt (only if customer is assigned)
      if (customerId) {
        receipt = await generateReceipt({
          salePaymentId: salePayment._id,
          customerId,
          reason: 'SALE',
          method: paymentMethod,
          amount: cashPrice,
          date: saleDateToUse,
          saleTotalWeeks: effectiveTotalWeeks,
          salePaidWeeks: effectiveTotalWeeks,
          isCashSettlement: true
        }, session);
      }
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

    return { ...populatedSale, receipt };
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
  customerData,
  downPaymentMethod,
  downPaymentAccountId,
  downPaymentImagePath,
  downPaymentImageName
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

    // Determine if the down payment (enganche) must be collected on this delivery.
    // Upfront cash sales already created their SalePayment when the sale was saved.
    const existingSalePayment = await SalePayment.findOne({
      sale: saleId,
      $or: [{ isDownPayment: true }, { isCashSettlement: true }]
    }).lean();
    const requiresDownPayment = sale.initialPayment > 0 && !existingSalePayment;
    const requiresDownPaymentImage =
      downPaymentMethod === 'TRANSFER' || downPaymentMethod === 'DEP';

    if (requiresDownPayment) {
      console.log('Sale requires down payment registration, amount:', sale.initialPayment);
      if (!downPaymentMethod || !PAYMENT_METHODS[downPaymentMethod]) {
        console.error('❌ Missing or invalid down payment method');
        error.message = 'Se requiere el método de pago del enganche';
        throw error;
      }
      // La entrega la hace el operador en la calle: su efectivo es CASH y
      // entra a su corte de ruta, nunca a la caja de oficina.
      if (downPaymentMethod === OFFICE_CASH_METHOD) {
        error.message =
          'El enganche en efectivo recibido en la entrega debe registrarse como Efectivo, no como Efectivo (Oficina).';
        throw error;
      }
      if (requiresDownPaymentImage && !downPaymentImagePath) {
        console.error('❌ Missing down payment voucher image');
        error.message = 'Se requiere una foto del comprobante del enganche';
        throw error;
      }
      if (requiresDownPaymentImage && !downPaymentAccountId) {
        console.error('❌ Missing down payment account');
        error.message = 'Se requiere seleccionar una cuenta de pago para el enganche';
        throw error;
      }
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

    // The down payment voucher is only uploaded when the method requires it
    const uploadDownPaymentImage = requiresDownPayment && requiresDownPaymentImage;
    const downPaymentFileName = uploadDownPaymentImage
      ? `sales-payments/${saleId}_downpayment_${timestamp}.${getFileExtension(downPaymentImageName)}`
      : null;

    console.log(`Uploading ${uploadDownPaymentImage ? 5 : 4} images to cloud storage...`);

    const [ineUrl, frontalUrl, labelUrl, boardUrl, downPaymentUrl] = await Promise.all([
      uploadFile(ineImagePath, ineFileName),
      uploadFile(frontalImagePath, frontalFileName),
      uploadFile(labelImagePath, labelFileName),
      uploadFile(boardImagePath, boardFileName),
      uploadDownPaymentImage
        ? uploadFile(downPaymentImagePath, downPaymentFileName)
        : Promise.resolve(null)
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

    // Register the down payment (enganche) as a real payment + receipt.
    // The sale balance already accounts for it (remainingAmount was computed as
    // totalAmount - initialPayment when the sale was created), so this is a
    // documentary record only: do NOT touch remainingAmount/accumulatedPayment/paidWeeks.
    let receipt = null;
    if (requiresDownPayment) {
      console.log('Registering down payment...');
      const downPayment = new SalePayment({
        sale: sale._id,
        amount: sale.initialPayment,
        paymentDate: deliveryDateToUse,
        weeksCovered: 0,
        imageUrl: downPaymentUrl,
        method: downPaymentMethod,
        paymentAccount: downPaymentAccountId || null,
        isCashSettlement: false,
        isDownPayment: true,
        createdBy: deliveredBy,
        createdAt: currentDate
      });
      await downPayment.save({ session, isNew: true });
      console.log('✅ Down payment saved');

      // Generate receipt (only if customer is assigned)
      if (sale.customer) {
        receipt = await generateReceipt({
          salePaymentId: downPayment._id,
          customerId: sale.customer,
          reason: 'SALE',
          method: downPaymentMethod,
          amount: sale.initialPayment,
          date: deliveryDateToUse,
          isDownPayment: true
        }, session);
        console.log('✅ Down payment receipt generated');
      }
    }

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

    // Check if operator should be blocked
    let wasBlocked = false;
    if (delivery.assignedTo) {
      wasBlocked = await checkAndBlockOperator(delivery.assignedTo, currentDate, session);
    }

    console.log('Committing transaction...');
    await session.commitTransaction();
    await session.endSession();
    console.log('✅✅✅ Sale delivery completed successfully! ✅✅✅');

    return { success: true, wasBlocked, receipt };
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
    }).sort({ createdAt: -1 });
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
    let machine = await SalesMachine.findById(sale.machine);
    const isSaleMachine = !!machine;

    // If not found in sales_machines, try in machines collection (legacy)
    if (!isSaleMachine) {
      machine = await Machine.findById(sale.machine);
    }


    if ( isSaleMachine && machine.status !== 'LISTO') {
      console.error('❌ Machine status is not LISTO:', machine.status);
      error.message = 'La máquina debe estar en estado LISTO para completar la entrega';
      throw error;
    }

    if (isSaleMachine && !machine.currentVehicle) {
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

    if(isSaleMachine) {
    // Return machine to VENDIDO status after repair (clears vehicle/warehouse)
    console.log('Returning machine to VENDIDO status...');
    await returnSalesMachineAfterRepair({
      machineId: sale.machine,
      lastUpdatedBy: deliveredBy,
      session
    });
    console.log('✅ Machine returned to VENDIDO status');
    }
    // Check if operator should be blocked
    let wasBlocked = false;
    if (delivery.assignedTo) {
      wasBlocked = await checkAndBlockOperator(delivery.assignedTo, currentDate, session);
    }

    console.log('Committing transaction...');
    await session.commitTransaction();
    await session.endSession();
    console.log('✅✅✅ Repair return delivery completed successfully! ✅✅✅');

    return { success: true, wasBlocked };
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

/**
 * Aplica un abono regular a la venta: acumula el monto, calcula las semanas
 * completas cubiertas y recorre la fecha del próximo pago. Muta la venta
 * recibida (sin guardarla) y devuelve las semanas cubiertas por el abono.
 * No cubre pagos de contado, que liquidan la venta completa.
 */
function applyRegularPaymentToSale({
  sale,
  paymentAmount,
  paymentDate,
  currentDate,
  lastUpdatedBy
}) {
  const totalAccumulated = (sale.accumulatedPayment || 0) + paymentAmount;

  // Semanas completas que cubre el acumulado
  const weeksCovered = Math.floor(totalAccumulated / sale.weeklyPayment);

  // Acumulado restante después de cubrir las semanas completas
  const newAccumulatedPayment = totalAccumulated % sale.weeklyPayment;

  sale.paidWeeks += weeksCovered;
  sale.accumulatedPayment = newAccumulatedPayment;
  sale.remainingAmount -= paymentAmount;
  sale.lastPaymentDate = paymentDate;
  sale.updatedAt = currentDate;
  sale.lastUpdatedBy = lastUpdatedBy;

  if (sale.paidWeeks >= sale.totalWeeks || sale.remainingAmount <= 0) {
    // La venta quedó liquidada con este abono
    sale.isPaid = true;
    sale.status = 'PAGADA';
    sale.paidWeeks = sale.totalWeeks;
    sale.remainingAmount = 0;
    sale.accumulatedPayment = 0;
    sale.nextPaymentDate = null;
  } else if (weeksCovered > 0) {
    // Se mantiene el calendario original recorriendo 7 días por semana cubierta
    const nextPaymentDate = sale.nextPaymentDate
      ? new Date(sale.nextPaymentDate)
      : new Date(paymentDate);
    nextPaymentDate.setDate(nextPaymentDate.getDate() + 7 * weeksCovered);
    sale.nextPaymentDate = nextPaymentDate;
  }
  // Si weeksCovered es 0, nextPaymentDate no cambia (abono parcial a la semana en curso)

  return weeksCovered;
}

export async function registerSalePayment({
  saleId,
  paymentAmount,
  paymentDate,
  paymentMethod,
  paymentAccountId,
  paymentImagePath,
  paymentImageName,
  isCashSettlement,
  cashPriceOverride,
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

  if (!paymentMethod) {
    error.message = 'Se requiere el método de pago';
    throw error;
  }

  // Image is only required for TRANSFER and DEP methods
  const requiresImage = paymentMethod === 'TRANSFER' || paymentMethod === 'DEP';
  if (requiresImage && !paymentImagePath) {
    error.message = 'Se requiere una foto del comprobante de pago';
    throw error;
  }

  if (requiresImage && !paymentAccountId) {
    error.message = 'Se requiere seleccionar una cuenta de pago';
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

    // Validate cash settlement if requested
    if (isCashSettlement) {
      // Get the delivery to check completedAt date
      const delivery = await SaleDelivery.findOne({ 
        sale: saleId, 
        status: 'COMPLETADA',
        isRepairReturn: { $ne: true }
      }).lean();
      
      if (!delivery || !delivery.completedAt) {
        error.message = 'No se puede realizar pago de contado: la entrega no está completada';
        throw error;
      }
      
      const daysSinceDelivery = Math.floor(
        (currentDate.getTime() - new Date(delivery.completedAt).getTime()) / (1000 * 60 * 60 * 24)
      );

      // Admins can lift the 30-day window via a feature flag so any user can
      // still settle at the original price regardless of elapsed days.
      const bypassWindow = await isFeatureEnabled(
        FEATURE_FLAGS.CASH_SETTLEMENT_BYPASS_WINDOW
      );

      if (!bypassWindow && daysSinceDelivery > 30) {
        error.message = `No se puede realizar pago de contado: han pasado ${daysSinceDelivery} días desde la entrega (máximo 30 días)`;
        throw error;
      }
      
      // If cashPriceOverride is provided, save it to the sale
      if (cashPriceOverride && !sale.cashPrice) {
        sale.cashPrice = cashPriceOverride;
      }
    }

    let imageUrl = null;
    // Upload payment image to Google Cloud Storage
    if(requiresImage) {
    const timestamp = Date.now();
    const imageExt = getFileExtension(paymentImageName);
    const imageFileName = `sales-payments/${saleId}_payment_${timestamp}.${imageExt}`;
    imageUrl = await uploadFile(paymentImagePath, imageFileName);
    }

    // Update sale with new values
    let weeksCovered;
    if (isCashSettlement) {
      // Cash settlement: mark as fully paid
      weeksCovered = sale.totalWeeks - sale.paidWeeks;
      sale.isPaid = true;
      sale.status = 'PAGADA';
      sale.paidWeeks = sale.totalWeeks;
      sale.remainingAmount = 0;
      sale.accumulatedPayment = 0;
      sale.lastPaymentDate = paymentDateToUse;
      sale.nextPaymentDate = null;
      sale.updatedAt = currentDate;
      sale.lastUpdatedBy = lastUpdatedBy;
    } else {
      // Regular payment
      weeksCovered = applyRegularPaymentToSale({
        sale,
        paymentAmount,
        paymentDate: paymentDateToUse,
        currentDate,
        lastUpdatedBy
      });
    }

    // Create payment history record
    const salePayment = new SalePayment({
      sale: saleId,
      amount: paymentAmount,
      paymentDate: paymentDateToUse,
      weeksCovered,
      imageUrl,
      method: paymentMethod,
      paymentAccount: paymentAccountId || null,
      isCashSettlement: isCashSettlement || false,
      createdBy: lastUpdatedBy,
      createdAt: currentDate
    });
    await salePayment.save({ session, isNew: true });

    await sale.save({ session, isNew: false });

    // Generate receipt for the sale payment (inside transaction so it rolls back if it fails)
    const receipt = await generateReceipt({
      salePaymentId: salePayment._id,
      customerId: sale.customer,
      reason: 'SALE',
      method: paymentMethod,
      amount: paymentAmount,
      date: paymentDateToUse,
      saleTotalWeeks: sale.totalWeeks,
      salePaidWeeks: sale.paidWeeks
    }, session);

    await session.commitTransaction();
    await session.endSession();

    return receipt;
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

export async function getSalePaymentsData(page, limit, searchTerm) {
  if (!isConnected()) {
    await connectToDatabase();
  }

  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 30;

  let saleIds = [];
  let userIds = [];
  const hasSearch = searchTerm && searchTerm.trim() !== '';

  if (hasSearch) {
    const foundCustomers = await Customer.find({
      name: { $regex: searchTerm, $options: 'i' }
    })
      .select({ _id: 1 })
      .lean();
    const customerIds = foundCustomers.map((c) => c._id);

    const foundSales = await Sale.find({
      customer: { $in: customerIds }
    })
      .select({ _id: 1 })
      .lean();
    saleIds = foundSales.map((s) => s._id);

    const foundUsers = await User.find({
      name: { $regex: searchTerm, $options: 'i' }
    })
      .select({ _id: 1 })
      .lean();
    userIds = foundUsers.map((u) => u._id);
  }

  const matchCondition = hasSearch
    ? {
        $or: [
          { sale: { $in: saleIds } },
          { createdBy: { $in: userIds } }
        ]
      }
    : {};

  const total = await SalePayment.countDocuments(matchCondition);

  const payments = await SalePayment.find(matchCondition)
    .populate({
      path: 'sale',
      select: 'saleNum customer totalWeeks paidWeeks weeklyPayment totalAmount remainingAmount status',
      populate: {
        path: 'customer',
        select: 'name cell'
      }
    })
    .populate({
      path: 'createdBy',
      select: 'name'
    })
    .populate({
      path: 'paymentAccount',
      select: 'bank count number'
    })
    .sort({ paymentDate: -1 })
    .skip(limitNum * (pageNum - 1))
    .limit(limitNum)
    .lean();

  // Calculate the payment number for each payment (e.g., "3 de 16")
  // We need to know the position of each payment within its sale
  const salePaymentCounts = {};
  for (const payment of payments) {
    const saleId = payment.sale?._id?.toString();
    if (saleId && !salePaymentCounts[saleId]) {
      // Get all payments for this sale ordered by date to determine the number.
      // The enganche is excluded so the weekly payments keep their 1..N numbering.
      const allSalePayments = await SalePayment.find({
        sale: saleId,
        isDownPayment: { $ne: true }
      })
        .select({ _id: 1, paymentDate: 1 })
        .sort({ paymentDate: 1 })
        .lean();
      salePaymentCounts[saleId] = allSalePayments.map((p) => p._id.toString());
    }
  }

  // Lookup receipts for each sale payment
  const paymentIds = payments.map((p) => p._id);
  const receipts = await Receipt.find({ salePaymentId: { $in: paymentIds } }).lean();
  const receiptMap = {};
  for (const r of receipts) {
    receiptMap[r.salePaymentId?.toString()] = r;
  }

  const list = payments.map((payment) => {
    const saleId = payment.sale?._id?.toString();
    const allPaymentIds = salePaymentCounts[saleId] || [];
    const paymentIndex = allPaymentIds.indexOf(payment._id.toString());
    const paymentNumber = paymentIndex >= 0 ? paymentIndex + 1 : null;
    const totalPayments = allPaymentIds.length;

    return {
      ...payment,
      paymentNumber,
      totalPayments,
      receipt: receiptMap[payment._id.toString()] || null
    };
  });

  return { list, total };
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

    // Cancel the actual outstanding delivery (a sale only has one open at a
    // time). Filtering by status avoids cancelling an already-completed
    // delivery and leaving the open one stuck as ASIGNADA in the table.
    const delivery = await SaleDelivery.findOne({
      sale: saleId,
      status: { $in: ['PENDIENTE', 'ASIGNADA'] }
    }).session(session);
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

export async function cancelActiveSaleData({
  saleId,
  cancellationReason,
  pickupTime,
  lastUpdatedBy
}) {
  const currentDate = new Date();
  let error = new Error();
  error.name = 'Internal';
  let session;

  if (!saleId || !cancellationReason) {
    error.message = 'Parámetros incorrectos: saleId o motivo de cancelación faltante.';
    throw error;
  }

  const conn = await connectToDatabase();
  session = await conn.startSession();

  try {
    await session.startTransaction();

    const sale = await Sale.findById(saleId).session(session);
    if (!sale) {
      error.message = 'La venta no existe';
      throw error;
    }

    if (sale.status !== 'ACTIVA') {
      error.message = 'Solo se pueden cancelar ventas activas (ya entregadas).';
      throw error;
    }

    // Check there's no existing pending cancellation pickup
    const existingCancellationPickup = await SalePickup.findOne({
      sale: saleId,
      isCancellation: true,
      status: { $in: ['ESPERA', 'ASIGNADA'] }
    }).session(session);

    if (existingCancellationPickup) {
      error.message = 'Ya existe una recolección de cancelación pendiente para esta venta.';
      throw error;
    }

    // Change sale status to EN_CANCELACION
    sale.status = 'EN_CANCELACION';
    sale.updatedAt = currentDate;
    sale.lastUpdatedBy = lastUpdatedBy;
    await sale.save({ session, isNew: false });

    // Change machine status to EN_CANCELACION
    if (sale.machine) {
      const machine = await SalesMachine.findById(sale.machine).session(session);
      if (machine) {
        machine.status = 'EN_CANCELACION';
        machine.updatedAt = currentDate;
        machine.lastUpdatedBy = lastUpdatedBy;
        await machine.save({ session, isNew: false });
      }
    }

    // Create Sale Pickup for cancellation
    let date = new Date(pickupTime.date);
    let fromTime = new Date(pickupTime.date);
    let endTime = new Date(pickupTime.date);
    if (pickupTime.timeOption === 'any') {
      date.setHours(21, 59, 59, 0);
      fromTime.setHours(8, 0, 0, 0);
      endTime.setHours(22, 0, 0, 0);
    } else {
      const fromT = getTimeFromDate(new Date(pickupTime.fromTime));
      const endT = getTimeFromDate(new Date(pickupTime.endTime));
      fromTime.setHours(fromT.hours, fromT.minutes, fromT.seconds, 0);
      endTime.setHours(endT.hours, endT.minutes, endT.seconds, 0);
      date = fromTime;
    }

    // Get next pickup numbers
    const totalDocuments = await SalePickup.countDocuments({
      status: { $ne: 'CANCELADA' }
    });
    const totalNumber = totalDocuments + 1;

    const start = dayjs(pickupTime.date).startOf('day');
    const end = dayjs(pickupTime.date).endOf('day');
    const todayPickups = await SalePickup.find({
      date: { $gte: start, $lt: end },
      status: { $ne: 'CANCELADA' }
    });
    const dayNumber = todayPickups.length + 1;

    const pickup = await new SalePickup({
      totalNumber,
      dayNumber,
      sale: saleId,
      machine: sale.machine,
      date,
      timeOption: pickupTime.timeOption,
      fromTime,
      endTime,
      reason: `CANCELACIÓN: ${cancellationReason}`,
      isCancellation: true,
      createdAt: currentDate,
      updatedAt: currentDate,
      createdBy: lastUpdatedBy,
      lastUpdatedBy,
      wasSent: false
    }).save({ session, isNew: true });

    await session.commitTransaction();
    await session.endSession();

    return { success: true, pickup };
  } catch (e) {
    console.error(e);
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    await session.endSession();
    if (e.name === 'Internal') throw e;
    else {
      throw new Error('Ocurrió un error al cancelar la venta activa. Intente de nuevo.');
    }
  }
}

export async function updateSaleCredit({
  saleId,
  totalAmount,
  initialPayment,
  totalWeeks,
  userId
}) {
  let error = new Error();
  error.name = 'Internal';

  if (!saleId) {
    error.message = 'La venta es requerida';
    throw error;
  }

  if (!totalAmount || totalAmount <= 0) {
    error.message = 'El monto total debe ser mayor a 0';
    throw error;
  }

  if (initialPayment < 0) {
    error.message = 'El enganche debe ser mayor o igual a 0';
    throw error;
  }

  if (initialPayment > totalAmount) {
    error.message = 'El enganche no puede ser mayor al total';
    throw error;
  }

  if (!totalWeeks || totalWeeks <= 0) {
    error.message = 'Las semanas deben ser mayores a 0';
    throw error;
  }

  const conn = await connectToDatabase();
  const session = await conn.startSession();

  try {
    await session.startTransaction();

    const sale = await Sale.findById(saleId).session(session);

    if (!sale) {
      error.message = 'La venta no existe';
      throw error;
    }

    if (!['ACTIVA', 'EN_CANCELACION'].includes(sale.status)) {
      error.message = 'Solo se pueden modificar ventas activas o en cancelación';
      throw error;
    }

    if (sale.paidWeeks > 0) {
      error.message = 'No se puede modificar una venta con semanas pagadas';
      throw error;
    }

    const remainingAmount = totalAmount - initialPayment;

    const weeklyPayment =
      totalWeeks > 0
        ? Number((remainingAmount / totalWeeks).toFixed(2))
        : 0;

    sale.totalAmount = totalAmount;
    sale.initialPayment = initialPayment;
    sale.totalWeeks = totalWeeks;
    sale.remainingAmount = remainingAmount;
    sale.weeklyPayment = weeklyPayment;
    sale.updatedAt = new Date();
    sale.lastUpdatedBy = userId;

    await sale.save({ session });

    await session.commitTransaction();
    await session.endSession();

    const updatedSale = await Sale.findById(sale._id)
      .populate({
        path: 'customer',
        select: 'name cell lastRent currentResidence',
      })
      .populate({
        path: 'machine',
        select: 'machineNum brand capacity',
        model: 'sales_machines'
      })
      .lean();

    return updatedSale;

  } catch (e) {
    console.error(e);

    if (session.inTransaction()) {
      await session.abortTransaction();
    }

    await session.endSession();

    if (e.name === 'Internal') throw e;

    throw new Error(
      'Ocurrió un error al actualizar la venta. Intente de nuevo.'
    );
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

    if (sale.status === 'EN_CANCELACION') {
      error.message = 'No se puede agendar cobranza: la venta está en proceso de cancelación.';
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

export async function completeCollectionVisitData({
  deliveryId,
  outcome,
  paymentInCash,
  cashAmount,
  lastUpdatedBy
}) {
  const currentDate = new Date();
  let error = new Error();
  error.name = 'Internal';
  let session;

  // El efectivo solo aplica cuando el cliente sí pagó durante la visita
  const isCashPayment = outcome === 'PAGO' && paymentInCash === true;
  const receivedCash = isCashPayment ? Number(cashAmount) : null;

  if (isCashPayment && (!Number.isFinite(receivedCash) || receivedCash <= 0)) {
    error.message = 'Debe indicar una cantidad válida de efectivo recibido.';
    throw error;
  }

  const conn = await connectToDatabase();
  session = await conn.startSession();

  try {
    await session.startTransaction();

    const delivery = await SaleDelivery.findById(deliveryId).session(session);
    if (!delivery) {
       throw new Error('La tarea no existe.');
    }

    const sale = await Sale.findById(delivery.sale).session(session);
    if (!sale) throw new Error('La venta asociada no existe.');

    // El efectivo recibido por el operador es un abono a la venta, así que se
    // registra como pago y se afecta el saldo igual que un pago de oficina.
    let salePaymentId = null;
    if (isCashPayment) {
      if (sale.isPaid) {
        error.message = 'Esta venta ya está pagada completamente.';
        throw error;
      }

      const weeksCovered = applyRegularPaymentToSale({
        sale,
        paymentAmount: receivedCash,
        paymentDate: currentDate,
        currentDate,
        lastUpdatedBy
      });

      const salePayment = new SalePayment({
        sale: sale._id,
        amount: receivedCash,
        paymentDate: currentDate,
        weeksCovered,
        method: 'CASH',
        paymentAccount: null,
        isCashSettlement: false,
        createdBy: lastUpdatedBy,
        createdAt: currentDate
      });
      await salePayment.save({ session, isNew: true });
      salePaymentId = salePayment._id;
    }

    delivery.paymentInCash = isCashPayment;
    delivery.cashAmount = receivedCash;
    delivery.salePayment = salePaymentId;
    delivery.status = 'COMPLETADA';
    delivery.completedAt = currentDate;
    delivery.completedBy = lastUpdatedBy;
    delivery.updatedAt = currentDate;
    delivery.lastUpdatedBy = lastUpdatedBy;

    await delivery.save({ session, isNew: false });

    const visitIndex = sale.collectionVisits.findIndex(v => 
      v.deliveryRef && v.deliveryRef.toString() === deliveryId.toString()
    );

    if (visitIndex !== -1) {
      sale.collectionVisits[visitIndex].completed = true;
      sale.collectionVisits[visitIndex].outcome = outcome;
      sale.collectionVisits[visitIndex].paymentInCash = isCashPayment;
      sale.collectionVisits[visitIndex].cashAmount = receivedCash;
      sale.collectionVisits[visitIndex].completedAt = currentDate;
      sale.collectionVisits[visitIndex].completedBy = lastUpdatedBy;
    }

    sale.updatedAt = currentDate;
    sale.lastUpdatedBy = lastUpdatedBy;
    
    await sale.save({ session, isNew: false });

    // El recibo se genera dentro de la transacción para que se revierta si falla
    let receipt = null;
    if (isCashPayment) {
      receipt = await generateReceipt({
        salePaymentId,
        customerId: sale.customer,
        reason: 'SALE',
        method: 'CASH',
        amount: receivedCash,
        date: currentDate,
        saleTotalWeeks: sale.totalWeeks,
        salePaidWeeks: sale.paidWeeks
      }, session);
    }

    await session.commitTransaction();
    await session.endSession();

    return { success: true, receipt };
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

export async function getCompletedSaleDeliveriesData(date) {
  if (!isConnected()) {
    await connectToDatabase();
  }

  const filter = {
    type: 'ENTREGA',
    status: 'COMPLETADA'
  };

  if (date) {
    const dateObj = typeof date === 'string' ? dateFromString(date) : date;
    const startOfDay = setDateToInitial(dateObj);
    const endOfDay = setDateToEnd(dateObj);
    filter.completedAt = { $gte: startOfDay, $lte: endOfDay };
  }

  const deliveries = await SaleDelivery.find(filter)
    .populate({
      path: 'sale',
      populate: {
        path: 'customer',
        select: 'name cell currentResidence',
        populate: {
          path: 'currentResidence',
          select: 'street suburb sector city',
          populate: [
            { path: 'sector', select: 'name' },
            { path: 'city', select: 'name' }
          ]
        }
      }
    })
    .populate('assignedTo', 'name')
    .populate('completedBy', 'name')
    .sort({ completedAt: -1 })
    .lean();

  return { list: deliveries };
}

export async function getPendingSaleDeliveriesData(userId, userRole) {
  if (!isConnected()) {
    await connectToDatabase();
  }

  const query = { type: 'ENTREGA' };

  if (userRole === 'OPE') {
    query.status = { $in: ['PENDIENTE', 'ASIGNADA'] };
    query.assignedTo = userId;
  } else {
    query.status = { $in: ['PENDIENTE', 'ASIGNADA'] };
  }

  const deliveries = await SaleDelivery.find(query)
    .populate({
      path: 'sale',
      populate: {
        path: 'customer',
        select: 'name cell currentResidence',
        populate: {
          path: 'currentResidence',
          select: 'street suburb sector city',
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

  return deliveries;
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
