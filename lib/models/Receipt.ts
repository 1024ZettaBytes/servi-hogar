import mongoose, { Model, model, Schema, Document } from 'mongoose';

/**
 * Receipt interface
 * Simple receipt for payment records
 */
export interface IReceipt extends Document {
  receiptNumber: number; // Sequential receipt number
  paymentId?: Schema.Types.ObjectId; // Reference to the original payment
  salePaymentId?: Schema.Types.ObjectId; // Reference to sale payment
  
  // Customer information
  customerName: string;
  customerPhone: string;
  
  // Date
  date: Date; // Receipt/payment date
  rentEndDate?: Date; // Specific date for rent payments
  // Payment reason
  reason: 'RENT' | 'SALE' | 'CREDIT' | 'EXT_REPAIR' | 'DEBT'; // Payment type
  
  // Late fee information
  hasLateFee: boolean;
  lateFeeDays?: number; // Number of days late
  lateFeeAmount: number; // Late fee amount
  
  // Payment details
  description: string; // Payment description
  amount: number; // Base payment amount
  total: number; // Total amount (amount + lateFeeAmount)
  
  // Payment method (matches PAYMENT_METHODS: TRANSFER, DEP, CASH)
  method: 'TRANSFER' | 'DEP' | 'CASH'
  
  // Additional notes
  observations?: string;
}

const ReceiptSchema = new Schema<IReceipt>(
  {
    receiptNumber: { type: Number, required: true, unique: true },
    paymentId: {
      type: Schema.Types.ObjectId,
      ref: 'payments',
      default: null
    },
    salePaymentId: {
      type: Schema.Types.ObjectId,
      ref: 'sale_payments',
      default: null
    },
    
    customerName: { type: String, required: true },
    customerPhone: { type: String, required: true },
    
    date: { type: Date, required: true },
    rentEndDate: { type: Date, default: null },
    
    reason: {
      type: String,
      enum: ['RENT', 'SALE', 'CREDIT', 'EXT_REPAIR', 'DEBT'],
      required: true
    },
    
    hasLateFee: { type: Boolean, default: false },
    lateFeeDays: { type: Number, default: null },
    lateFeeAmount: { type: Number, default: 0 },
    
    description: { type: String, required: true },
    amount: { type: Number, required: true },
    total: { type: Number, required: true },
    
    method: {
      type: String,
      enum: ['TRANSFER', 'DEP', 'CASH', 'CASH_OFFICE'],
      required: true
    },
    
    observations: { type: String, default: null }
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
    collection: 'receipts'
  }
);

// Indexes for efficient querying
ReceiptSchema.index({ receiptNumber: 1 });
ReceiptSchema.index({ paymentId: 1 });
ReceiptSchema.index({ salePaymentId: 1 });
ReceiptSchema.index({ date: -1 });

export const Receipt: Model<IReceipt> =
  mongoose.models.receipts || model('receipts', ReceiptSchema);
