import { connectToDatabase } from '../db';
import { Receipt } from '../models/Receipt';
import { Customer } from '../models/Customer';
import { PAYMENT_REASONS } from '../consts/OBJ_CONTS';

/**
 * Generates and saves a receipt for a payment (regular or sale payment)
 * @param {Object} receiptData - Receipt data
 * @param {string} receiptData.paymentId - Regular payment ID (optional)
 * @param {string} receiptData.salePaymentId - Sale payment ID (optional)
 * @param {string} receiptData.customerId - Customer ID
 * @param {string} receiptData.reason - Payment reason (RENT_EXT, DEBT, ADD, EXTERNAL_REPAIR)
 * @param {string} receiptData.method - Payment method (TRANSFER, DEP, CASH, CASH_OFFICE)
 * @param {number} receiptData.amount - Base payment amount
 * @param {number} receiptData.lateFee - Late fee amount (default 0)
 * @param {number} receiptData.lateFeeDays - Number of days late (optional)
 * @param {Date} receiptData.date - Payment date
 * @param {string} receiptData.observations - Additional notes (optional)
 * @param {Object} session - Mongoose session for transaction (optional)
 * @returns {Promise<Object>} Generated receipt data
 */
export async function generateReceipt(receiptData, session = null) {
  const {
    paymentId = null,
    salePaymentId = null,
    customerId,
    reason,
    method,
    amount,
    lateFee = 0,
    lateFeeDays = null,
    saleTotalWeeks = null,
    salePaidWeeks = null,
    date,
  } = receiptData;
  
  // Use the provided date but set the time to current time
  const receiptDate = new Date(date);
  const now = new Date();
  receiptDate.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds());

  let error = new Error();
  error.name = 'Internal';

  try {
    await connectToDatabase();

    // Validate that at least one payment ID is provided
    if (!paymentId && !salePaymentId) {
      error.message = 'Se requiere un ID de pago (payment o sale payment)';
      throw error;
    }

    // Retrieve customer information
    const customer = await Customer.findById(customerId)
      .select({ name: 1, cell: 1, currentRent: 1 })
      .populate({ path: 'currentRent' , select: { endDate: 1 } })
      .lean();

    if (!customer) {
      error.message = 'Cliente no encontrado';
      throw error;
    }

    // Map reason to receipt reason format
    const receiptReasonMap = {
      RENT_EXT: 'RENT',
      DEBT: 'DEBT',
      ADD: 'CREDIT',
      EXTERNAL_REPAIR: 'EXT_REPAIR',
      SALE: 'SALE'
    };
    const receiptReason = receiptReasonMap[reason];

    let description;
    let rentEndDate = customer.currentRent ? customer.currentRent.endDate : null;
    let observations = null;
    // Determine if there's a late fee
    const hasLateFee = lateFee > 0;
    // Generate description and more
    if(receiptReason === 'RENT') {
      description = "Pago semanal de renta de lavadora";
      if(hasLateFee) {
        observations = `Incluye recargo por ${lateFeeDays} día(s) de retraso en el pago de la renta.`;
      }
    } else if (receiptReason === 'EXT_REPAIR') {
      description = `Pago por reparación externa`;
    } else if (receiptReason === 'SALE') {
      description = `Abono, pago ${salePaidWeeks} de ${saleTotalWeeks}`;
    } else {
      description = `Pago por ${receiptReason.toLowerCase()}`;
    }
    const realAmount = hasLateFee ? parseFloat(amount) - parseFloat(lateFee) : parseFloat(amount);
    // Calculate total
    const total = parseFloat(realAmount) + parseFloat(lateFee);

    // Map payment method (CASH_OFFICE -> CASH for receipt)
    const  receiptMethod = method === 'CASH_OFFICE' ? 'CASH' : method;

    // Generate sequential receipt number
    const receiptCount = await Receipt.countDocuments();
    const receiptNumber = receiptCount + 1;

    // Create receipt document
    const newReceipt = new Receipt({
      receiptNumber,
      paymentId,
      salePaymentId,
      customerName: customer.name,
      customerPhone: customer.cell,
      date: receiptDate,
      reason: receiptReason,
      hasLateFee,
      lateFeeDays: hasLateFee ? lateFeeDays : null,
      lateFeeAmount: lateFee,
      description,
      amount: realAmount,
      total,
      rentEndDate,
      method: receiptMethod,
      observations
    });

   const savedReceipt = await newReceipt.save({ session, new: true });

    return savedReceipt;
  } catch (e) {
    console.error('Error generating receipt:', e);
    if (e.name === 'Internal') throw e;
    throw new Error('Error al generar el recibo. Intente de nuevo.');
  }
}

/**
 * Retrieves a receipt by receipt number
 * @param {number} receiptNumber - Receipt number
 * @returns {Promise<Object>} Receipt data
 */
export async function getReceiptByNumber(receiptNumber) {
  try {
    await connectToDatabase();
    
    const receipt = await Receipt.findOne({ receiptNumber }).lean();
    
    if (!receipt) {
      throw new Error('Recibo no encontrado');
    }
    
    return receipt;
  } catch (e) {
    console.error('Error retrieving receipt:', e);
    throw new Error('Error al obtener el recibo. Intente de nuevo.');
  }
}

/**
 * Retrieves receipts by customer ID
 * @param {string} customerId - Customer ID
 * @param {number} limit - Number of receipts to retrieve
 * @returns {Promise<Array>} Array of receipts
 */
export async function getReceiptsByCustomer(customerId, limit = 10) {
  try {
    await connectToDatabase();
    
    const customer = await Customer.findById(customerId).select({ name: 1 }).lean();
    
    if (!customer) {
      throw new Error('Cliente no encontrado');
    }
    
    const receipts = await Receipt.find({ customerName: customer.name })
      .sort({ date: -1 })
      .limit(limit)
      .lean();
    
    return receipts;
  } catch (e) {
    console.error('Error retrieving customer receipts:', e);
    throw new Error('Error al obtener los recibos del cliente. Intente de nuevo.');
  }
}

/**
 * Retrieves a receipt by payment ID
 * @param {string} paymentId - Payment ID
 * @returns {Promise<Object>} Receipt data
 */
export async function getReceiptByPaymentId(paymentId) {
  try {
    await connectToDatabase();
    
    const receipt = await Receipt.findOne({ paymentId }).lean();
    
    if (!receipt) {
      throw new Error('Recibo no encontrado para este pago');
    }
    
    return receipt;
  } catch (e) {
    console.error('Error retrieving receipt by payment:', e);
    throw new Error('Error al obtener el recibo. Intente de nuevo.');
  }
}

/**
 * Retrieves a receipt by sale payment ID
 * @param {string} salePaymentId - Sale payment ID
 * @returns {Promise<Object>} Receipt data
 */
export async function getReceiptBySalePaymentId(salePaymentId) {
  try {
    await connectToDatabase();
    
    const receipt = await Receipt.findOne({ salePaymentId }).lean();
    
    if (!receipt) {
      throw new Error('Recibo no encontrado para este pago de venta');
    }
    
    return receipt;
  } catch (e) {
    console.error('Error retrieving receipt by sale payment:', e);
    throw new Error('Error al obtener el recibo. Intente de nuevo.');
  }
}
