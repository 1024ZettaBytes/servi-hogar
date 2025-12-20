import { connectToDatabase } from '../db';
import { RentDelivery } from '../models/RentDelivery';
import { RentPickup } from '../models/RentPickup';
import { RentChange } from '../models/RentChange';
import { SalePickup } from '../models/SalePickup';
import { SaleDelivery } from '../models/SaleDelivery';
import { setDateToInitial, setDateToEnd, formatTZDate } from '../client/utils';
import { format } from 'date-fns';

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
    case 'COBRANZA':
      return SaleDelivery;
    default:
      throw new Error(`Invalid task type: ${taskType}`);
  }
}

/**
 * Update the scheduled time for a specific task
 * If the slot is already occupied by another task, remove it from the existing one
 */
export async function updateTaskScheduledTime(taskId, taskType, scheduledTime) {
  try {
    await connectToDatabase();
    
    const Model = getModelByTaskType(taskType);
    
    // If setting a scheduled time, first check if any other task has this slot
    if (scheduledTime) {
      const scheduledDate = new Date(scheduledTime);
      
      // Create a time range for matching (same minute)
      const startOfMinute = new Date(scheduledDate);
      startOfMinute.setSeconds(0, 0);
      const endOfMinute = new Date(scheduledDate);
      endOfMinute.setSeconds(59, 999);
      
      // Find and clear any existing tasks with this scheduled time across all task types
      const allModels = [RentDelivery, RentPickup, RentChange, SalePickup, SaleDelivery];
      
      for (const TaskModel of allModels) {
        // Build query to find tasks with this scheduled time that are NOT the current task
        const query = {
          scheduledTime: { $gte: startOfMinute, $lte: endOfMinute },
          _id: { $ne: taskId }
        };
        
        // For SaleDelivery (COBRANZA), only clear COBRANZA type
        if (TaskModel === SaleDelivery) {
          query.type = 'COBRANZA';
        }
        
        // Clear the scheduled time from any matching tasks
        await TaskModel.updateMany(
          query,
          { 
            scheduledTime: null,
            updatedAt: new Date()
          }
        );
      }
    }
    
    const updatedTask = await Model.findByIdAndUpdate(
      taskId,
      { 
        scheduledTime: scheduledTime ? new Date(scheduledTime) : null,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!updatedTask) {
      return {
        error: true,
        msg: 'Task not found'
      };
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

/**
 * Get all scheduled time slots for a specific date
 */
export async function getScheduledSlotsForDate(date) {
  try {
    await connectToDatabase();
    
    // Parse date string in local timezone by adding time component
    // If date is "2025-12-18", create date at noon to avoid timezone issues
    const dateStr = date.split('T')[0]; // Get just YYYY-MM-DD part
    const [year, month, day] = dateStr.split('-').map(Number);
    const localDate = new Date(year, month - 1, day, 12, 0, 0); // Month is 0-indexed
        
    const startDate = setDateToInitial(localDate);
    const endDate = setDateToEnd(localDate);
    
    // Query all task types for scheduled times on this date
    const [deliveries, pickups, changes, salePickups, collections] = await Promise.all([
      RentDelivery.find({
        scheduledTime: { $gte: startDate, $lte: endDate },
        status: { $in: ['ESPERA', 'ASIGNADA'] }
      })
      .select('_id scheduledTime rent status')
      .populate({
        path: 'rent',
        select: 'customer',
        populate: {
          path: 'customer',
          select: 'name currentResidence',
          populate: {
            path: 'currentResidence',
            select: 'sector',
            populate: {
              path: 'sector',
              select: 'name'
            }
          }
        }
      })
      .lean(),
      
      RentPickup.find({
        scheduledTime: { $gte: startDate, $lte: endDate },
        status: { $in: ['ESPERA', 'ASIGNADA'] }
      })
      .select('_id scheduledTime rent status')
      .populate({
        path: 'rent',
        select: 'customer',
        populate: {
          path: 'customer',
          select: 'name currentResidence',
          populate: {
            path: 'currentResidence',
            select: 'sector',
            populate: {
              path: 'sector',
              select: 'name'
            }
          }
        }
      })
      .lean(),
      
      RentChange.find({
        scheduledTime: { $gte: startDate, $lte: endDate },
        status: { $in: ['ESPERA', 'ASIGNADA'] }
      })
      .select('_id scheduledTime rent status')
      .populate({
        path: 'rent',
        select: 'customer',
        populate: {
          path: 'customer',
          select: 'name currentResidence',
          populate: {
            path: 'currentResidence',
            select: 'sector',
            populate: {
              path: 'sector',
              select: 'name'
            }
          }
        }
      })
      .lean(),
      
      SalePickup.find({
        scheduledTime: { $gte: startDate, $lte: endDate },
        status: { $in: ['ESPERA', 'ASIGNADA'] }
      })
      .select('_id scheduledTime sale status')
      .populate({
        path: 'sale',
        select: 'customer',
        populate: {
          path: 'customer',
          select: 'name currentResidence',
          populate: {
            path: 'currentResidence',
            select: 'sector',
            populate: {
              path: 'sector',
              select: 'name'
            }
          }
        }
      })
      .lean(),

      SaleDelivery.find({
        scheduledTime: { $gte: startDate, $lte: endDate },
        status: { $in: ['PENDIENTE', 'ASIGNADA'] },
        type: 'COBRANZA'
      })
      .select('_id scheduledTime sale status')
      .populate({
        path: 'sale',
        select: 'customer',
        populate: {
          path: 'customer',
          select: 'name currentResidence',
          populate: {
            path: 'currentResidence',
            select: 'sector',
            populate: {
              path: 'sector',
              select: 'name'
            }
          }
        }
      })
      .lean()
    ]);

    // Combine and format results
    const scheduledSlots = [
      ...deliveries.map(d => ({
        taskId: d._id,
        taskType: 'ENTREGA',
        scheduledTime: d.scheduledTime,
        customerName: d.rent?.customer?.name || 'N/A',
        sector: d.rent?.customer?.currentResidence?.sector?.name || '',
        status: d.status
      })),
      ...pickups.map(p => ({
        taskId: p._id,
        taskType: 'RECOLECCION',
        scheduledTime: p.scheduledTime,
        customerName: p.rent?.customer?.name || 'N/A',
        sector: p.rent?.customer?.currentResidence?.sector?.name || '',
        status: p.status
      })),
      ...changes.map(c => ({
        taskId: c._id,
        taskType: 'CAMBIO',
        scheduledTime: c.scheduledTime,
        customerName: c.rent?.customer?.name || 'N/A',
        sector: c.rent?.customer?.currentResidence?.sector?.name || '',
        status: c.status
      })),
      ...salePickups.map(sp => ({
        taskId: sp._id,
        taskType: 'RECOLECCION_VENTA',
        scheduledTime: sp.scheduledTime,
        customerName: sp.sale?.customer?.name || 'N/A',
        sector: sp.sale?.customer?.currentResidence?.sector?.name || '',
        status: sp.status
      })),
      ...collections.map(col => ({
        taskId: col._id,
        taskType: 'COBRANZA',
        scheduledTime: col.scheduledTime,
        customerName: col.sale?.customer?.name || 'N/A',
        sector: col.sale?.customer?.currentResidence?.sector?.name || '',
        status: col.status
      }))
    ];

    // Sort by scheduled time
    scheduledSlots.sort((a, b) => 
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
