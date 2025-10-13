import { connectToDatabase, isConnected } from '../db';
import { Sale } from '../models/Sale';
import { SalePayment } from '../models/SalePayment';
import { Machine } from '../models/Machine';
import { Customer } from '../models/Customer';
import { User } from '../models/User';

export async function getSalesData() {
  if (!isConnected()) {
    await connectToDatabase();
  }
  
  const sales = await Sale.find()
    .populate([
      {
        path: 'machine',
        select: 'machineNum brand capacity'
      },
      {
        path: 'customer',
        select: 'name'
      },
      {
        path: 'createdBy',
        select: 'name'
      }
    ])
    .sort({ createdAt: -1 })
    .lean();
  
  return sales;
}

export async function getSaleById(saleId) {
  if (!isConnected()) {
    await connectToDatabase();
  }
  
  const sale = await Sale.findById(saleId)
    .populate([
      {
        path: 'machine',
        select: 'machineNum brand capacity cost'
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
        select: 'machineNum brand capacity cost'
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
  
  return {
    ...sale,
    payments
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
      machine = await Machine.findById(machineId);
      if (!machine) {
        error.message = 'El equipo seleccionado no existe';
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
    
    // Calculate next payment date (7 days from sale date if not fully paid)
    let nextPaymentDate = null;
    if (initialPayment < totalAmount) {
      nextPaymentDate = new Date(saleDateToUse);
      nextPaymentDate.setDate(nextPaymentDate.getDate() + 7);
    }

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
      paidWeeks: initialPayment >= totalAmount ? totalWeeks : 0,
      isPaid: initialPayment >= totalAmount,
      status: initialPayment >= totalAmount ? 'PAGADA' : 'ACTIVA',
      saleDate: saleDateToUse,
      lastPaymentDate: initialPayment > 0 ? saleDateToUse : null,
      nextPaymentDate,
      createdAt: currentDate,
      updatedAt: currentDate,
      createdBy,
      lastUpdatedBy: createdBy
    });

    await newSale.save({ session, isNew: true });

    // If machine is linked, mark it as sold
    if (machine) {
      machine.active = false;
      machine.updatedAt = currentDate;
      machine.lastUpdatedBy = createdBy;
      await machine.save({ session, isNew: false });
    }

    await session.commitTransaction();
    await session.endSession();

    return { success: true, saleId: newSale._id };
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

export async function registerSalePayment({
  saleId,
  paymentAmount,
  paymentDate,
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

    // Calculate how many weeks this payment covers
    const weeksCovered = Math.floor(paymentAmount / sale.weeklyPayment);
    
    // Create payment history record
    const salePayment = new SalePayment({
      sale: saleId,
      amount: paymentAmount,
      paymentDate: paymentDateToUse,
      weeksCovered,
      createdBy: lastUpdatedBy,
      createdAt: currentDate
    });
    await salePayment.save({ session, isNew: true });
    
    sale.paidWeeks += weeksCovered;
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
      sale.nextPaymentDate = null;
    } else {
      // Calculate next payment date based on weeks covered
      // If there was a previous nextPaymentDate, add (7 days × weeks covered) to maintain schedule
      // Otherwise, add (7 days × weeks covered) from the payment date
      let nextPaymentDate;
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

export async function cancelSaleData({ saleId, lastUpdatedBy }) {
  const currentDate = new Date();
  let error = new Error();
  error.name = 'Internal';

  if (!saleId) {
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

    sale.status = 'CANCELADA';
    sale.updatedAt = currentDate;
    sale.lastUpdatedBy = lastUpdatedBy;

    await sale.save({ session, isNew: false });

    // Reactivate machine if it was linked
    if (sale.machine) {
      const machine = await Machine.findById(sale.machine);
      if (machine) {
        machine.active = true;
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
