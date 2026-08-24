import { connectToDatabase } from '../db';
import { RentDelivery } from '../models/RentDelivery';
import { RentPickup } from '../models/RentPickup';
import { RentChange } from '../models/RentChange';
import { SalePickup } from '../models/SalePickup';
import { SaleDelivery } from '../models/SaleDelivery';
import { SaleChange } from '../models/SaleChange';
import { ExtraTrip } from '../models/ExtraTrip';
import { ExternalRepair } from '../models/ExternalRepair';
import { Rent } from '../models/Rent';
import { Sale } from '../models/Sale';
import { Customer } from '../models/Customer';
import { Residence } from '../models/Residence';
import { Sector } from '../models/Sector';
import { User } from '../models/User';
import { getVueltaOperatorField } from './Vueltas';
import { setDateToInitial, setDateToEnd } from '../client/utils';

// Las cadenas de populate de abajo referencian estos modelos por nombre. Sin
// registrarlos aquí, mongoose lanza MissingSchemaError si esta ruta se carga sin
// que otra los haya importado antes.
Rent.init();
Sale.init();
Customer.init();
Residence.init();
Sector.init();
User.init();

/**
 * Get the appropriate model based on task type
 */
function getModelByTaskType(taskType) {
  switch (taskType) {
    case 'ENTREGA':
      return RentDelivery;
    case 'RECOLECCION':
      return RentPickup;
    case 'CAMBIO':
      return RentChange;
    case 'RECOLECCION_VENTA':
      return SalePickup;
    case 'CAMBIO_VENTA':
      return SaleChange;
    case 'COBRANZA':
      return SaleDelivery;
    case 'ENTREGA_VENTA':
      return SaleDelivery;
    case 'VUELTA_EXTRA':
      return ExtraTrip;
    case 'RECOLECCION_EXTERNA':
    case 'ENTREGA_EXTERNA':
      return ExternalRepair;
    default:
      throw new Error(`Invalid task type: ${taskType}`);
  }
}

/**
 * En `ExternalRepair` el dueño depende de la etapa, y el status es lo que la
 * distingue: recolección pendiente vs entrega/devolución pendiente.
 */
const externalRepairOwnerQuery = (operatorId) => ({
  $or: [
    { status: 'RECOLECCION_AGENDADA', pickupAssignedTo: operatorId },
    {
      status: { $in: ['REPARADA', 'NO_AUTORIZADA'] },
      deliveryAssignedTo: operatorId
    }
  ]
});

/**
 * Filtro que acota cada modelo a las vueltas de un operador. La agenda se deriva de
 * aquí, así que un horario pertenece al operador asignado a la vuelta.
 */
const OWNER_QUERY_BY_MODEL = [
  [RentDelivery, (id) => ({ operator: id })],
  [RentPickup, (id) => ({ operator: id })],
  [RentChange, (id) => ({ operator: id })],
  [SalePickup, (id) => ({ operator: id })],
  [SaleChange, (id) => ({ operator: id })],
  // Solo los tipos de sale delivery que son programables.
  [
    SaleDelivery,
    (id) => ({ assignedTo: id, type: { $in: ['COBRANZA', 'ENTREGA'] } })
  ],
  [ExtraTrip, (id) => ({ assignedTo: id })],
  [ExternalRepair, externalRepairOwnerQuery]
];

// Modelos que además de `assignedTo` llevan meta de asignación (assignedBy/assignedAt).
const ASSIGNED_META_MODELS = [SaleDelivery, ExtraTrip];

/**
 * Update the scheduled time for a specific task.
 *
 * La programación es por operador: el dueño del horario es el operador asignado a la
 * vuelta. Si el slot ya está ocupado, solo se libera el de ESE operador — dos
 * operadores pueden tener las 09:00 al mismo tiempo.
 */
export async function updateTaskScheduledTime(
  taskId,
  taskType,
  scheduledTime,
  { userId, userRole } = {}
) {
  try {
    await connectToDatabase();

    const Model = getModelByTaskType(taskType);
    const ownerField = getVueltaOperatorField(taskType);

    if (!ownerField) {
      return { error: true, msg: `Invalid task type: ${taskType}` };
    }

    const task = await Model.findById(taskId).select(`${ownerField} status`).lean();
    if (!task) {
      return { error: true, msg: 'Task not found' };
    }

    const isOperator = userRole === 'OPE';
    let ownerId = task[ownerField] ? String(task[ownerField]) : null;

    // Un operador solo puede programar sus propias vueltas.
    if (isOperator && ownerId && ownerId !== String(userId)) {
      return { error: true, msg: 'Solo puedes programar tus propias vueltas.' };
    }

    const currentDate = new Date();
    const update = {
      scheduledTime: scheduledTime ? new Date(scheduledTime) : null,
      updatedAt: currentDate
    };
    if (userId) {
      update.lastUpdatedBy = userId;
    }

    if (scheduledTime) {
      // Programar una vuelta del pool (sin operador asignado) equivale a tomarla:
      // así el operador conserva la posibilidad de programar cobranzas PENDIENTE.
      if (isOperator && !ownerId) {
        update[ownerField] = userId;
        if (ASSIGNED_META_MODELS.includes(Model)) {
          update.status = 'ASIGNADA';
          update.assignedBy = userId;
          update.assignedAt = currentDate;
        }
        ownerId = String(userId);
      }

      // Oficina no puede programar una vuelta que todavía no tiene dueño: no habría
      // agenda a la que pertenecer.
      if (!ownerId) {
        return {
          error: true,
          msg: 'Asigna un operador a la vuelta antes de programarla.'
        };
      }

      const scheduledDate = new Date(scheduledTime);

      // Create a time range for matching (same minute)
      const startOfMinute = new Date(scheduledDate);
      startOfMinute.setSeconds(0, 0);
      const endOfMinute = new Date(scheduledDate);
      endOfMinute.setSeconds(59, 999);

      // Liberar ese minuto SOLO en la agenda de este operador.
      for (const [TaskModel, ownerQuery] of OWNER_QUERY_BY_MODEL) {
        await TaskModel.updateMany(
          {
            scheduledTime: { $gte: startOfMinute, $lte: endOfMinute },
            _id: { $ne: taskId },
            ...ownerQuery(ownerId)
          },
          {
            scheduledTime: null,
            updatedAt: currentDate
          }
        );
      }
    }

    const updatedTask = await Model.findByIdAndUpdate(taskId, update, { new: true });

    if (!updatedTask) {
      return { error: true, msg: 'Task not found' };
    }

    return {
      error: false,
      msg: 'Scheduled time updated successfully',
      data: updatedTask
    };
  } catch (error) {
    console.error('Error updating scheduled time:', error);
    return {
      error: true,
      msg: error.message || 'Error updating scheduled time'
    };
  }
}

// Populate del cliente (nombre + sector) reutilizado por las queries de rentas/ventas.
const customerPopulate = (path) => ({
  path,
  select: 'customer',
  populate: {
    path: 'customer',
    select: 'name currentResidence',
    populate: {
      path: 'currentResidence',
      select: 'sector',
      populate: { path: 'sector', select: 'name' }
    }
  }
});

const operatorPopulate = (field) => ({ path: field, select: 'name' });

function ownerOf(doc, field) {
  const operator = doc?.[field];
  if (!operator) {
    return { operatorId: null, operatorName: null };
  }
  return {
    operatorId: String(operator._id || operator),
    operatorName: operator.name || null
  };
}

/**
 * Get all scheduled time slots for a specific date.
 *
 * @param {string} date  YYYY-MM-DD
 * @param {object} opts
 * @param {string} [opts.operatorId] cuando viene, solo devuelve la agenda de ese
 *   operador (es lo que se fuerza para el rol OPE).
 */
export async function getScheduledSlotsForDate(date, { operatorId } = {}) {
  try {
    await connectToDatabase();

    // Parse date string in local timezone by adding time component
    // If date is "2025-12-18", create date at noon to avoid timezone issues
    const dateStr = date.split('T')[0]; // Get just YYYY-MM-DD part
    const [year, month, day] = dateStr.split('-').map(Number);
    const localDate = new Date(year, month - 1, day, 12, 0, 0); // Month is 0-indexed

    const startDate = setDateToInitial(localDate);
    const endDate = setDateToEnd(localDate);
    const dayRange = { $gte: startDate, $lte: endDate };

    // Filtro base + el campo de dueño cuando se pide una sola agenda.
    const scoped = (filter, ownerField) =>
      operatorId ? { ...filter, [ownerField]: operatorId } : filter;

    const externalRepairFilter = {
      scheduledTime: dayRange,
      status: { $in: ['RECOLECCION_AGENDADA', 'REPARADA', 'NO_AUTORIZADA'] }
    };
    if (operatorId) {
      Object.assign(externalRepairFilter, externalRepairOwnerQuery(operatorId));
    }

    // Query all task types for scheduled times on this date
    const [
      deliveries,
      pickups,
      changes,
      salePickups,
      saleChanges,
      saleDeliveries,
      collections,
      extraTrips,
      externalRepairs
    ] = await Promise.all([
      RentDelivery.find(
        scoped(
          { scheduledTime: dayRange, status: { $in: ['ESPERA', 'ASIGNADA'] } },
          'operator'
        )
      )
        .select('_id scheduledTime rent status operator')
        .populate([customerPopulate('rent'), operatorPopulate('operator')])
        .lean(),

      RentPickup.find(
        scoped(
          { scheduledTime: dayRange, status: { $in: ['ESPERA', 'ASIGNADA'] } },
          'operator'
        )
      )
        .select('_id scheduledTime rent status operator')
        .populate([customerPopulate('rent'), operatorPopulate('operator')])
        .lean(),

      RentChange.find(
        scoped(
          { scheduledTime: dayRange, status: { $in: ['ESPERA', 'ASIGNADA'] } },
          'operator'
        )
      )
        .select('_id scheduledTime rent status operator')
        .populate([customerPopulate('rent'), operatorPopulate('operator')])
        .lean(),

      SalePickup.find(
        scoped(
          { scheduledTime: dayRange, status: { $in: ['ESPERA', 'ASIGNADA'] } },
          'operator'
        )
      )
        .select('_id scheduledTime sale status operator')
        .populate([customerPopulate('sale'), operatorPopulate('operator')])
        .lean(),

      SaleChange.find(
        scoped(
          { scheduledTime: dayRange, status: { $in: ['ESPERA', 'ASIGNADA'] } },
          'operator'
        )
      )
        .select('_id scheduledTime sale status operator')
        .populate([customerPopulate('sale'), operatorPopulate('operator')])
        .lean(),

      SaleDelivery.find(
        scoped(
          {
            scheduledTime: dayRange,
            status: { $in: ['PENDIENTE', 'ASIGNADA'] },
            type: 'ENTREGA'
          },
          'assignedTo'
        )
      )
        .select('_id scheduledTime sale status assignedTo')
        .populate([customerPopulate('sale'), operatorPopulate('assignedTo')])
        .lean(),

      SaleDelivery.find(
        scoped(
          {
            scheduledTime: dayRange,
            status: { $in: ['PENDIENTE', 'ASIGNADA'] },
            type: 'COBRANZA' // Only include COBRANZA type for SaleDelivery
          },
          'assignedTo'
        )
      )
        .select('_id scheduledTime sale status assignedTo')
        .populate([customerPopulate('sale'), operatorPopulate('assignedTo')])
        .lean(),

      ExtraTrip.find(
        scoped(
          { scheduledTime: dayRange, status: { $in: ['PENDIENTE', 'ASIGNADA'] } },
          'assignedTo'
        )
      )
        .select('_id scheduledTime tripNumber destination reason status assignedTo')
        .populate([operatorPopulate('assignedTo')])
        .lean(),

      ExternalRepair.find(externalRepairFilter)
        .select(
          '_id scheduledTime customerName status totalNumber pickupAssignedTo deliveryAssignedTo'
        )
        .populate([
          operatorPopulate('pickupAssignedTo'),
          operatorPopulate('deliveryAssignedTo')
        ])
        .lean()
    ]);

    // Combine and format results
    const scheduledSlots = [
      ...deliveries.map((d) => ({
        taskId: d._id,
        taskType: 'ENTREGA',
        scheduledTime: d.scheduledTime,
        customerName: d.rent?.customer?.name || 'N/A',
        sector: d.rent?.customer?.currentResidence?.sector?.name || '',
        status: d.status,
        ...ownerOf(d, 'operator')
      })),
      ...pickups.map((p) => ({
        taskId: p._id,
        taskType: 'RECOLECCION',
        scheduledTime: p.scheduledTime,
        customerName: p.rent?.customer?.name || 'N/A',
        sector: p.rent?.customer?.currentResidence?.sector?.name || '',
        status: p.status,
        ...ownerOf(p, 'operator')
      })),
      ...changes.map((c) => ({
        taskId: c._id,
        taskType: 'CAMBIO',
        scheduledTime: c.scheduledTime,
        customerName: c.rent?.customer?.name || 'N/A',
        sector: c.rent?.customer?.currentResidence?.sector?.name || '',
        status: c.status,
        ...ownerOf(c, 'operator')
      })),
      ...salePickups.map((sp) => ({
        taskId: sp._id,
        taskType: 'RECOLECCION_VENTA',
        scheduledTime: sp.scheduledTime,
        customerName: sp.sale?.customer?.name || 'N/A',
        sector: sp.sale?.customer?.currentResidence?.sector?.name || '',
        status: sp.status,
        ...ownerOf(sp, 'operator')
      })),
      ...saleChanges.map((sc) => ({
        taskId: sc._id,
        taskType: 'CAMBIO_VENTA',
        scheduledTime: sc.scheduledTime,
        customerName: sc.sale?.customer?.name || 'N/A',
        sector: sc.sale?.customer?.currentResidence?.sector?.name || '',
        status: sc.status,
        ...ownerOf(sc, 'operator')
      })),
      ...saleDeliveries.map((sd) => ({
        taskId: sd._id,
        taskType: 'ENTREGA_VENTA',
        scheduledTime: sd.scheduledTime,
        customerName: sd.sale?.customer?.name || 'N/A',
        sector: sd.sale?.customer?.currentResidence?.sector?.name || '',
        status: sd.status,
        ...ownerOf(sd, 'assignedTo')
      })),
      ...collections.map((col) => ({
        taskId: col._id,
        taskType: 'COBRANZA',
        scheduledTime: col.scheduledTime,
        customerName: col.sale?.customer?.name || 'N/A',
        sector: col.sale?.customer?.currentResidence?.sector?.name || '',
        status: col.status,
        ...ownerOf(col, 'assignedTo')
      })),
      ...extraTrips.map((et) => ({
        taskId: et._id,
        taskType: 'VUELTA_EXTRA',
        scheduledTime: et.scheduledTime,
        customerName: `#${et.tripNumber} - ${et.destination}`,
        sector: et.reason || '',
        status: et.status,
        ...ownerOf(et, 'assignedTo')
      })),
      ...externalRepairs.map((er) => {
        const isPickup = er.status === 'RECOLECCION_AGENDADA';
        return {
          taskId: er._id,
          taskType: isPickup ? 'RECOLECCION_EXTERNA' : 'ENTREGA_EXTERNA',
          scheduledTime: er.scheduledTime,
          customerName: er.customerName || 'N/A',
          sector: `#${er.totalNumber}`,
          status: er.status,
          ...ownerOf(er, isPickup ? 'pickupAssignedTo' : 'deliveryAssignedTo')
        };
      })
    ];

    // Sort by scheduled time
    scheduledSlots.sort(
      (a, b) =>
        new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime()
    );

    return {
      error: false,
      data: scheduledSlots
    };
  } catch (error) {
    console.error('Error getting scheduled slots:', error);
    return {
      error: true,
      msg: error.message || 'Error retrieving scheduled slots',
      data: []
    };
  }
}
