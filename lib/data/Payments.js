import { connectToDatabase, isConnected } from '../db';
import { Customer } from '../models/Customer';
import { Machine } from '../models/Machine';
import { Residence } from '../models/Residence';
import { getFileExtension } from '../client/utils';
import { Payment } from '../models/Payment';
import { PaymentAccount } from '../models/PaymentAccount';
import { PAYMENT_REASONS, PAYMENT_METHODS } from '../consts/OBJ_CONTS';
import { uploadFile } from '../cloud';
import { User } from '../models/User';
import { SalePayment } from '../models/SalePayment';
import { Sale } from '../models/Sale';
import { generateReceipt } from './Receipts';
Machine.init();
Residence.init();
PaymentAccount.init();

export async function savePaymentData({
  customerId,
  reason,
  method,
  paymentAccountId,
  amount,
  paymentDate,
  folio,
  files,
  lastUpdatedBy,
  lateFee = 0,
  lateFeeDays = null
}) {
  let error = new Error();
  error.name = 'Internal';
  const currentDate = Date.now();
  let conn = await connectToDatabase();
  const session = await conn.startSession();
  try {
    let customer = await Customer.findById(customerId);
    if (!customer) {
      error.message = 'El cliente indicado no es válido';
      throw error;
    }
    if (!PAYMENT_REASONS[reason]) {
      error.message = 'El concepto indicado no es válido';
      throw error;
    }
    if (!PAYMENT_METHODS[method]) {
      error.message = 'El método indicado no es válido';
      throw error;
    }
    if (
      method !== 'CASH' &&
      method !== 'CASH_OFFICE' &&
      (!folio || !files || !paymentAccountId)
    ) {
      error.message = 'Por favor indique folio, comprobante de pago y cuenta';
      throw error;
    }
    if ((folio && !files) || (files && !folio)) {
      error.message = 'Por favor indique el folio y comprobante de pago';
      throw error;
    }
    if (!amount) {
      error.message = 'Por favor indique el la cantidad de pago';
      throw error;
    }
    let amoutNumber = new Number(amount);
    // EXTERNAL_REPAIR payments don't add balance to customer (they are just recorded)
    if (reason !== 'EXTERNAL_REPAIR') {
      customer.balance = customer.balance + amoutNumber;
    }
    customer.updatedAt = currentDate;
    customer.lastUpdatedBy = lastUpdatedBy;
    if (folio) {
      const folioAlreadyExists = await Payment.findOne({ method, folio })
        .select({ _id: 1 })
        .lean();
      if (folioAlreadyExists) {
        error.message = 'El folio indicado ya existe para el método de pago';
        throw error;
      }
    }
    const paymentNum = await Payment.countDocuments();
    let newPayment = new Payment({
      number: paymentNum + 1,
      customer,
      amount: amoutNumber,
      reason,
      description: PAYMENT_REASONS[reason],
      folio: folio || null,
      method,
      paymentAccount: paymentAccountId || null,
      date: paymentDate,
      lateFee: lateFee > 0 ? lateFee : 0,
      lastUpdatedBy
    });
    if (files) {
      let fileName = `voucher_${paymentNum + 1}.${getFileExtension(
        files.file.originalFilename
      )}`;
      const voucherUrl = await uploadFile(files.file.filepath, fileName);
      newPayment.voucherUrl = voucherUrl;
    }
    await session.startTransaction();
    await customer.save({ session, new: false });
    await newPayment.save({ session, new: true });
    
    // Generate receipt for the payment (inside transaction so it rolls back if it fails)
    const receipt = await generateReceipt({
      paymentId: newPayment._id,
      customerId: customer._id,
      reason,
      method,
      amount,
      lateFee,
      lateFeeDays,
      date: paymentDate
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
      throw new Error('Ocurrío un error al guardar el pago. Intente de nuevo.');
    }
  }
}

export async function getPaymentsData(page, limit, searchTerm) {
  if (!isConnected()) {
    await connectToDatabase();
  }
  
  // Ensure page and limit are numbers
  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 30;
  
  let customerIds = [];
  let userIds = [];
  let saleIds = [];
  
  if (searchTerm && searchTerm.trim() !== '') {
    // Find matching customers
    const foundCustomers = await Customer.find({
      name: { $regex: searchTerm, $options: 'i' }
    })
      .select({ _id: 1 })
      .lean();
    customerIds = foundCustomers.map(c => c._id);
    
    // Find sales for those customers (for SalePayment filtering)
    const foundSales = await Sale.find({
      customer: { $in: customerIds }
    })
      .select({ _id: 1 })
      .lean();
    saleIds = foundSales.map(s => s._id);
    
    // Find matching users
    const foundUsers = await User.find({
      name: { $regex: searchTerm, $options: 'i' }
    })
      .select({ _id: 1 })
      .lean();
    userIds = foundUsers.map(u => u._id);
  }
  
  const hasSearch = searchTerm && searchTerm.trim() !== '';
  
  // Build match conditions for each collection
  const paymentMatch = hasSearch
    ? {
        $or: [
          { customer: { $in: customerIds } },
          { lastUpdatedBy: { $in: userIds } }
        ]
      }
    : {};
    
  const salePaymentMatch = hasSearch
    ? {
        $or: [
          { sale: { $in: saleIds } },
          { createdBy: { $in: userIds } }
        ]
      }
    : {};

  // Use aggregation with $unionWith for proper pagination across both collections
  const pipeline = [
    // Start with Payments collection
    { $match: paymentMatch },
    {
      $project: {
        _id: 1,
        number: 1,
        description: 1,
        method: 1,
        voucherUrl: 1,
        amount: 1,
        date: 1,
        sortDate: '$date', // Unified date field for sorting
        customer: 1,
        account: 1,
        paymentAccount: 1,
        folio: 1,
        lateFee: 1,
        lastUpdatedBy: 1,
        type: { $literal: 'payment' } // Mark the source
      }
    },
    // Union with SalePayments
    {
      $unionWith: {
        coll: 'salepayments',
        pipeline: [
          { $match: salePaymentMatch },
          {
            $project: {
              _id: 1,
              sale: 1,
              amount: 1,
              paymentDate: 1,
              method: 1,
              sortDate: '$paymentDate', // Unified date field for sorting
              imageUrl: 1,
              paymentAccount: 1,
              createdBy: 1,
              type: { $literal: 'salePayment' } // Mark the source
            }
          }
        ]
      }
    },
    // Sort by unified date descending
    { $sort: { sortDate: -1 } },
    // Pagination
    { $skip: limitNum * (pageNum - 1) },
    { $limit: limitNum },
    // Lookups for Payment fields
    {
      $lookup: {
        from: 'customers',
        localField: 'customer',
        foreignField: '_id',
        as: 'customerData'
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'lastUpdatedBy',
        foreignField: '_id',
        as: 'lastUpdatedByData'
      }
    },
    {
      $lookup: {
        from: 'payment_accounts',
        localField: 'paymentAccount',
        foreignField: '_id',
        as: 'paymentAccountData'
      }
    },
    // Lookup receipts for regular payments
    {
      $lookup: {
        from: 'receipts',
        localField: '_id',
        foreignField: 'paymentId',
        as: 'receiptDataByPaymentId'
      }
    },
    // Lookup receipts for sale payments
    {
      $lookup: {
        from: 'receipts',
        localField: '_id',
        foreignField: 'salePaymentId',
        as: 'receiptDataBySalePaymentId'
      }
    },
    // Lookups for SalePayment fields
    {
      $lookup: {
        from: 'sales',
        localField: 'sale',
        foreignField: '_id',
        as: 'saleData'
      }
    },
    {
      $lookup: {
        from: 'users',
        localField: 'createdBy',
        foreignField: '_id',
        as: 'createdByData'
      }
    },
    // Final projection to format the output
    {
      $project: {
        _id: 1,
        type: 1,
        // Payment fields
        number: 1,
        description: 1,
        method: 1,
        voucherUrl: 1,
        amount: 1,
        date: 1,
        account: 1,
        folio: 1,
        lateFee: 1,
        customer: {
          $cond: {
            if: { $gt: [{ $size: '$customerData' }, 0] },
            then: {
              _id: { $arrayElemAt: ['$customerData._id', 0] },
              name: { $arrayElemAt: ['$customerData.name', 0] }
            },
            else: null
          }
        },
        lastUpdatedBy: {
          $cond: {
            if: { $gt: [{ $size: '$lastUpdatedByData' }, 0] },
            then: {
              _id: { $arrayElemAt: ['$lastUpdatedByData._id', 0] },
              name: { $arrayElemAt: ['$lastUpdatedByData.name', 0] }
            },
            else: null
          }
        },
        paymentAccount: {
          $cond: {
            if: { $gt: [{ $size: '$paymentAccountData' }, 0] },
            then: {
              _id: { $arrayElemAt: ['$paymentAccountData._id', 0] },
              bank: { $arrayElemAt: ['$paymentAccountData.bank', 0] },
              count: { $arrayElemAt: ['$paymentAccountData.count', 0] },
              number: { $arrayElemAt: ['$paymentAccountData.number', 0] }
            },
            else: null
          }
        },
        // SalePayment fields
        paymentDate: 1,
        imageUrl: 1,
        sale: {
          $cond: {
            if: { $gt: [{ $size: '$saleData' }, 0] },
            then: {
              _id: { $arrayElemAt: ['$saleData._id', 0] },
              customer: { $arrayElemAt: ['$saleData.customer', 0] }
            },
            else: null
          }
        },
        createdBy: {
          $cond: {
            if: { $gt: [{ $size: '$createdByData' }, 0] },
            then: {
              _id: { $arrayElemAt: ['$createdByData._id', 0] },
              name: { $arrayElemAt: ['$createdByData.name', 0] }
            },
            else: null
          }
        },
        // Receipt data (from either paymentId or salePaymentId lookup)
        receipt: {
          $cond: {
            if: { $gt: [{ $size: '$receiptDataByPaymentId' }, 0] },
            then: { $arrayElemAt: ['$receiptDataByPaymentId', 0] },
            else: {
              $cond: {
                if: { $gt: [{ $size: '$receiptDataBySalePaymentId' }, 0] },
                then: { $arrayElemAt: ['$receiptDataBySalePaymentId', 0] },
                else: null
              }
            }
          }
        }
      }
    }
  ];

  // For SalePayments, we need to populate sale.customer separately
  const list = await Payment.aggregate(pipeline);

  // Populate sale.customer for SalePayments
  for (const item of list) {
    if (item.type === 'salePayment' && item.sale?.customer) {
      const saleCustomer = await Customer.findById(item.sale.customer)
        .select('name')
        .lean();
      if (saleCustomer) {
        item.sale.customer = saleCustomer;
      }
    }
  }

  // Get total counts from both collections
  const paymentCount = await Payment.countDocuments(paymentMatch);
  const salePaymentCount = await SalePayment.countDocuments(salePaymentMatch);

  return {
    list,
    total: paymentCount + salePaymentCount
  };
}
