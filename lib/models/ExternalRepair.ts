import mongoose, { Model, model, Schema, Document } from 'mongoose';

// Lifecycle of an external repair (customer-owned washer repaired outside the
// rental/sales inventory). The physical machine location is tracked with
// currentVehicle / currentWarehouse (exactly one set once picked up).
//   RECOLECCION_AGENDADA   -> office scheduled the pickup; route operator assigned (at customer)
//   RECOLECTADA            -> route picked it up; on the operator's vehicle (photos + condition note)
//   POR_EVALUAR            -> dropped at warehouse; technician assigned for evaluation (24h budget SLA)
//   ESPERANDO_AUTORIZACION -> budget submitted; office must send it to the client (48h reminders)
//   AUTORIZADA             -> client authorized; technician has 3 days to repair
//   NO_AUTORIZADA          -> client rejected; machine returned to the client (no charge)
//   REPARADA               -> repaired; office schedules the delivery (postponable with notes)
//   ENTREGADA              -> delivered & charged, 30-day warranty, linked to the repairing tech
//   DEVUELTA               -> returned to the client (rejected budget path)
//   CANCELADA              -> cancelled; used parts are returned to stock
export const EXTERNAL_REPAIR_STATUS = {
  RECOLECCION_AGENDADA: 'RECOLECCION_AGENDADA',
  RECOLECTADA: 'RECOLECTADA',
  POR_EVALUAR: 'POR_EVALUAR',
  ESPERANDO_AUTORIZACION: 'ESPERANDO_AUTORIZACION',
  AUTORIZADA: 'AUTORIZADA',
  NO_AUTORIZADA: 'NO_AUTORIZADA',
  REPARADA: 'REPARADA',
  ENTREGADA: 'ENTREGADA',
  DEVUELTA: 'DEVUELTA',
  CANCELADA: 'CANCELADA'
};

export interface IExternalRepairFollowUp {
  note: string;
  date: Date;
  createdBy: Schema.Types.ObjectId;
}

export interface IExternalRepair extends Document {
  totalNumber: number;
  // Existing customer that brought the machine (selected when scheduling); the
  // fields below are a confirmed snapshot at scheduling time.
  customer: Schema.Types.ObjectId;
  customerName: string;
  customerCell: string;
  customerAddress: string;
  customerMaps: string;
  // Machine data (same capture as a street purchase)
  brand: string;
  serialNumber: string;
  entryPhotos: [String];
  failureDescription: string;
  status: string;
  // Pickup (recolección)
  pickupAssignedTo: Schema.Types.ObjectId;
  // Técnico elegido manualmente al agendar la recolección; se convierte en
  // `takenBy` cuando el equipo se recibe en bodega.
  assignedTechnician: Schema.Types.ObjectId;
  pickupScheduledDate: Date;
  scheduledTime: Date;
  pickupCompletedAt: Date;
  pickupConditionNote: string;
  // Physical location
  currentWarehouse: Schema.Types.ObjectId;
  currentVehicle: Schema.Types.ObjectId;
  warehouseReceivedAt: Date;
  // Evaluation / repair technician (same person evaluates and repairs)
  takenBy: Schema.Types.ObjectId;
  takenAt: Date;
  // Budget
  usedInventory: [Schema.Types.ObjectId];
  laborAmount: number;
  budgetAmount: number;
  budgetSubmittedAt: Date;
  // Authorization
  authorizedAt: Date;
  authorizedBy: Schema.Types.ObjectId;
  rejectedAt: Date;
  rejectedBy: Schema.Types.ObjectId;
  // Repair
  repairedBy: Schema.Types.ObjectId;
  repairedAt: Date;
  repairDescription: string;
  repairEvidencePhotos: [String];
  // Delivery (authorized path)
  deliveryAssignedTo: Schema.Types.ObjectId;
  deliveryScheduledDate: Date;
  chargeAmount: number;
  warrantyUntil: Date;
  deliveredAt: Date;
  deliveredBy: Schema.Types.ObjectId;
  deliveryEvidenceUrl: string;
  followUpNotes: IExternalRepairFollowUp[];
  // Return (rejected path)
  returnAssignedTo: Schema.Types.ObjectId;
  returnedAt: Date;
  officeAlertedAt: Date;
  // SLA bookkeeping (on-read engine)
  budgetDeadline: Date;
  repairDeadline: Date;
  returnDeadline: Date;
  nextReminderAt: Date;
  reminderCount: number;
  cancellationReason: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: Schema.Types.ObjectId;
  lastUpdatedBy: Schema.Types.ObjectId;
}

const ExternalRepairSchema = new Schema<IExternalRepair>({
  totalNumber: { type: Number, required: true },
  customer: { type: Schema.Types.ObjectId, ref: 'customers', default: null },
  customerName: { type: String, required: true },
  customerCell: { type: String, default: '' },
  customerAddress: { type: String, default: '' },
  customerMaps: { type: String, default: '' },
  // Captured by the route operator at pickup (not by office at scheduling).
  brand: { type: String, default: '' },
  serialNumber: { type: String, default: '' },
  entryPhotos: { type: [String], default: [] },
  failureDescription: { type: String, required: true },
  status: {
    type: String,
    enum: Object.values(EXTERNAL_REPAIR_STATUS),
    default: EXTERNAL_REPAIR_STATUS.RECOLECCION_AGENDADA
  },
  pickupAssignedTo: {
    type: Schema.Types.ObjectId,
    ref: 'users',
    default: null
  },
  assignedTechnician: {
    type: Schema.Types.ObjectId,
    ref: 'users',
    default: null
  },
  pickupScheduledDate: { type: Date, default: null },
  scheduledTime: { type: Date, default: null },
  pickupCompletedAt: { type: Date, default: null },
  pickupConditionNote: { type: String, default: '' },
  currentWarehouse: {
    type: Schema.Types.ObjectId,
    ref: 'warehouses',
    default: null
  },
  currentVehicle: { type: Schema.Types.ObjectId, ref: 'vehicles', default: null },
  warehouseReceivedAt: { type: Date, default: null },
  takenBy: { type: Schema.Types.ObjectId, ref: 'users', default: null },
  takenAt: { type: Date, default: null },
  usedInventory: {
    type: [Schema.Types.ObjectId],
    ref: 'used_inventory',
    default: []
  },
  laborAmount: { type: Number, default: 0 },
  budgetAmount: { type: Number, default: 0 },
  budgetSubmittedAt: { type: Date, default: null },
  authorizedAt: { type: Date, default: null },
  authorizedBy: { type: Schema.Types.ObjectId, ref: 'users', default: null },
  rejectedAt: { type: Date, default: null },
  rejectedBy: { type: Schema.Types.ObjectId, ref: 'users', default: null },
  repairedBy: { type: Schema.Types.ObjectId, ref: 'users', default: null },
  repairedAt: { type: Date, default: null },
  repairDescription: { type: String, default: '' },
  repairEvidencePhotos: { type: [String], default: [] },
  deliveryAssignedTo: {
    type: Schema.Types.ObjectId,
    ref: 'users',
    default: null
  },
  deliveryScheduledDate: { type: Date, default: null },
  chargeAmount: { type: Number, default: 0 },
  warrantyUntil: { type: Date, default: null },
  deliveredAt: { type: Date, default: null },
  deliveredBy: { type: Schema.Types.ObjectId, ref: 'users', default: null },
  deliveryEvidenceUrl: { type: String, default: null },
  followUpNotes: {
    type: [
      {
        note: { type: String, required: true },
        date: { type: Date, required: true },
        createdBy: { type: Schema.Types.ObjectId, ref: 'users', default: null }
      }
    ],
    default: []
  },
  returnAssignedTo: { type: Schema.Types.ObjectId, ref: 'users', default: null },
  returnedAt: { type: Date, default: null },
  officeAlertedAt: { type: Date, default: null },
  budgetDeadline: { type: Date, default: null },
  repairDeadline: { type: Date, default: null },
  returnDeadline: { type: Date, default: null },
  nextReminderAt: { type: Date, default: null },
  reminderCount: { type: Number, default: 0 },
  cancellationReason: { type: String, default: '' },
  active: { type: Boolean, default: true },
  createdAt: { type: Date, required: true },
  updatedAt: { type: Date, required: true },
  createdBy: { type: Schema.Types.ObjectId, ref: 'users', default: null },
  lastUpdatedBy: { type: Schema.Types.ObjectId, ref: 'users', default: null }
});

export const ExternalRepair: Model<IExternalRepair> =
  mongoose.models.external_repairs ||
  model('external_repairs', ExternalRepairSchema);
