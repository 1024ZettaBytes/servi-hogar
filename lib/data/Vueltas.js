import { connectToDatabase, isConnected } from '../db';
import { RentDelivery } from '../models/RentDelivery';
import { RentPickup } from '../models/RentPickup';
import { RentChange } from '../models/RentChange';
import { SalePickup } from '../models/SalePickup';
import { SaleChange } from '../models/SaleChange';
import { SaleDelivery } from '../models/SaleDelivery';
import { ExtraTrip } from '../models/ExtraTrip';
import { Vehicle } from '../models/Vehicle';
import { User } from '../models/User';
import { Role } from '../models/Role';

/**
 * Per-type configuration for reassigning a pending "vuelta" to another operator.
 * - field: the schema field that stores the assigned operator.
 * - pending: statuses in which the task is still pending (reassignable).
 * - resetStatus: status to leave the task in after reassigning (a clean
 *   "assigned but not started" state, always within `pending`).
 * - assignedMeta: true for models that use assignedTo/assignedBy/assignedAt;
 *   false for models that use operator + takenAt/takenBy.
 */
const VUELTA_CONFIG = {
  ENTREGA: {
    model: RentDelivery,
    field: 'operator',
    pending: ['ESPERA', 'EN_CAMINO'],
    resetStatus: 'ESPERA',
    assignedMeta: false
  },
  RECOLECCION: {
    model: RentPickup,
    field: 'operator',
    pending: ['ESPERA', 'EN_CAMINO', 'EN_DOMICILIO'],
    resetStatus: 'ESPERA',
    assignedMeta: false
  },
  CAMBIO: {
    model: RentChange,
    field: 'operator',
    pending: ['ESPERA', 'ASIGNADA'],
    resetStatus: 'ASIGNADA',
    assignedMeta: false
  },
  RECOLECCION_VENTA: {
    model: SalePickup,
    field: 'operator',
    pending: ['ESPERA', 'ASIGNADA'],
    resetStatus: 'ASIGNADA',
    assignedMeta: false
  },
  CAMBIO_VENTA: {
    model: SaleChange,
    field: 'operator',
    pending: ['ESPERA', 'ASIGNADA'],
    resetStatus: 'ASIGNADA',
    assignedMeta: false
  },
  COBRANZA: {
    model: SaleDelivery,
    field: 'assignedTo',
    pending: ['PENDIENTE', 'ASIGNADA'],
    resetStatus: 'ASIGNADA',
    assignedMeta: true
  },
  ENTREGA_VENTA: {
    model: SaleDelivery,
    field: 'assignedTo',
    pending: ['PENDIENTE', 'ASIGNADA'],
    resetStatus: 'ASIGNADA',
    assignedMeta: true
  },
  VUELTA_EXTRA: {
    model: ExtraTrip,
    field: 'assignedTo',
    pending: ['PENDIENTE', 'ASIGNADA'],
    resetStatus: 'ASIGNADA',
    assignedMeta: true
  }
};

export function getReassignableVueltaTypes() {
  return Object.keys(VUELTA_CONFIG);
}

/**
 * Reassign a pending vuelta (task) from one operator to another.
 * Used by ADMIN/AUX from /vueltas-operador and /ventas.
 */
export async function reassignVueltaData({
  taskType,
  taskId,
  operatorId,
  lastUpdatedBy
}) {
  let error = new Error();
  error.name = 'Internal';
  if (!isConnected()) {
    await connectToDatabase();
  }

  const config = VUELTA_CONFIG[taskType];
  if (!config) {
    error.message = 'Tipo de vuelta no válido para reasignación';
    throw error;
  }
  if (!taskId || !operatorId) {
    error.message = 'Faltan datos para reasignar la vuelta';
    throw error;
  }

  // Validate target operator: active OPE with an assigned vehicle
  const operator = await User.findById(operatorId).populate('role');
  if (!operator || !operator.isActive || operator.role?.id !== 'OPE') {
    error.message = 'El operador seleccionado no es válido o está inactivo';
    throw error;
  }
  const vehicle = await Vehicle.findOne({ operator: operatorId });
  if (!vehicle) {
    error.message = 'El operador seleccionado no tiene un vehículo asignado';
    throw error;
  }

  const task = await config.model.findById(taskId);
  if (!task) {
    error.message = 'La vuelta indicada no existe';
    throw error;
  }
  if (!config.pending.includes(task.status)) {
    error.message = 'La vuelta ya no está pendiente y no se puede reasignar';
    throw error;
  }

  const currentDate = new Date();

  task[config.field] = operatorId;
  task.status = config.resetStatus;
  if (config.assignedMeta) {
    task.assignedBy = lastUpdatedBy;
    task.assignedAt = currentDate;
  } else {
    // Clear in-progress markers so the new operator starts fresh
    task.takenAt = null;
    task.takenBy = null;
  }
  task.updatedAt = currentDate;
  task.lastUpdatedBy = lastUpdatedBy;

  await task.save();
  return { reassigned: true };
}
