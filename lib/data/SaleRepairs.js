import { dateDiffInDays, hasSundayBetween } from '../client/utils';
import { connectToDatabase, isConnected } from '../db';
import { User } from '../models/User';
import { Role } from '../models/Role';
import { SaleRepair } from '../models/SaleRepair';
import { SalesMachine } from '../models/SalesMachine';
import { UsedInventory } from '../models/UsedInventory';
import { Inventory } from '../models/Inventory';
import { SalePickup } from '../models/SalePickup';
import { SaleDelivery } from '../models/SaleDelivery';
import { Sale } from '../models/Sale';
import { Customer } from '../models/Customer';
import dayjs from 'dayjs';

export const getNextSaleRepairId = async () => {
  const repair = await SaleRepair.findOne({}, {}, { sort: { totalNumber: -1 } });
  if (repair && repair.totalNumber && repair.totalNumber > 0) {
    return repair.totalNumber + 1;
  }
  return 1;
};

export async function completeSaleRepairData({
  saleRepairId,
  description,
  lastUpdatedBy
}) {
  let error = new Error();
  error.name = 'Internal';
  const currentDate = Date.now();
  let conn = await connectToDatabase();
  const session = await conn.startSession();
  try {
    let repair = await SaleRepair.findById(saleRepairId).populate({
      path: 'usedInventory',
      model: UsedInventory
    });

    if (!repair) {
      error.message = 'No se encontró la reparación indicada.';
      throw error;
    }
    
    if (repair.status !== 'PENDIENTE') {
      error.message = 'La reparación ya fue completada o cancelada.';
      throw error;
    }
    
    repair.status = 'COMPLETADA';
    repair.finishedAt = currentDate;
    repair.updatedAt = currentDate;
    repair.lastUpdatedBy = lastUpdatedBy;
    repair.description = description;
    
    await session.startTransaction();
    await repair.save({ session, new: false });

    // Get the pickup and sale info
    const pickup = await SalePickup.findById(repair.salePickup).populate('sale');
    
    // Create a delivery for returning the repaired machine
    const nextDeliveryDate = dayjs().add(1, 'day').startOf('day').toDate();
    
    const delivery = await new SaleDelivery({
      sale: pickup.sale._id,
      saleRepair: repair._id,
      isRepairReturn: true,
      status: 'PENDIENTE',
      deliveryDate: nextDeliveryDate,
      createdAt: currentDate,
      updatedAt: currentDate,
      createdBy: lastUpdatedBy,
      lastUpdatedBy
    }).save({ session, new: true });

    await session.commitTransaction();
    await session.endSession();
    
    return { repair, delivery };
  } catch (e) {
    console.error(e);
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    await session.endSession();
    if (e.name === 'Internal') throw e;
    else {
      console.error(e);
      throw new Error(
        'Ocurrió un error al completar la reparación. Intente de nuevo.'
      );
    }
  }
}

export async function getSaleRepairsData(userId, pending = false) {
  if (!isConnected()) {
    await connectToDatabase();
  }
  
  const user = await User.findById(userId).populate('role').lean();
  let filter = {
    status: {
      $in: pending ? ['PENDIENTE'] : ['COMPLETADA', 'CANCELADA']
    }
  };
  
  if (user.role.id === 'TEC') {
    filter.takenBy = userId;
  }
  
  const repairs = await SaleRepair.find(filter)
    .populate([
      { path: 'takenBy', select: '_id name' },
      {
        path: 'machine',
        select: '_id machineNum brand serialNumber'
      },
      {
        path: 'salePickup',
        populate: {
          path: 'sale',
          populate: {
            path: 'customer',
            select: 'name phone'
          }
        }
      }
    ])
    .sort({ updatedAt: 1 })
    .lean();
    
  if (pending) {
    for (let i in repairs) {
      const creationDate = new Date(repairs[i].createdAt);
      repairs[i].daysSinceCreate =
        dateDiffInDays(creationDate, new Date()) -
        (hasSundayBetween(creationDate, new Date()) ? 1 : 0);
    }
  }
  
  return repairs;
}

export const getSaleRepairById = async (id, userId) => {
  if (!isConnected()) {
    await connectToDatabase();
  }
  
  const repair = await SaleRepair.findById(id)
    .populate([
      { path: 'takenBy', select: '_id name' },
      {
        path: 'usedInventory',
        select: 'inventoryProduct qty price',
        populate: { path: 'inventoryProduct', select: 'code name' }
      },
      {
        path: 'machine',
        select: '_id machineNum brand serialNumber warranty'
      },
      {
        path: 'salePickup',
        populate: {
          path: 'sale',
          populate: {
            path: 'customer',
            select: 'name phone'
          }
        }
      }
    ])
    .lean();
    
  if (
    !repair ||
    (userId ? repair.takenBy._id.toString() !== userId : false)
  ) {
    const error = new Error('No se encontró la reparación indicada.');
    error.name = 'Internal';
    throw error;
  }
  
  return repair;
};

export const addUsedProductToSaleRepair = async ({
  repairId,
  productId,
  qty,
  lastUpdatedBy
}) => {
  let error = new Error();
  error.name = 'Internal';
  let conn = await connectToDatabase();
  const session = await conn.startSession();
  try {
    const repair = await SaleRepair.findById(repairId);
    if (!repair) {
      error.message = 'No se encontró la reparación indicada.';
      throw error;
    }
    
    if (repair.status !== 'PENDIENTE') {
      error.message = 'La reparación ya fue completada o cancelada.';
      throw error;
    }
    
    const product = await Inventory.findById(productId);
    if (!product) {
      error.message = 'No se encontró el producto indicado.';
      throw error;
    }
    
    if (product.stock < qty) {
      error.message = 'No hay suficiente cantidad de la refacción indicada.';
      throw error;
    }
    
    // Check if this product was already added
    const existingUsed = await UsedInventory.findOne({
      saleRepair: repairId,
      inventoryProduct: productId
    });
    
    if (existingUsed) {
      error.message = 'Este producto ya fue agregado a la reparación.';
      throw error;
    }
    
    const newUsedInventory = new UsedInventory({
      inventoryProduct: productId,
      saleRepair: repairId,
      qty,
      price: product.latestCost,
      date: Date.now(),
      createdBy: lastUpdatedBy
    });

    product.stock -= qty;
    product.updatedAt = Date.now();
    product.lastUpdatedBy = lastUpdatedBy;
    
    await session.startTransaction();
    await product.save({ session, new: false });
    await newUsedInventory.save({ session, new: true });

    let usedInventories = repair.usedInventory || [];
    usedInventories.push(newUsedInventory._id);
    repair.usedInventory = usedInventories;
    repair.updatedAt = Date.now();
    repair.lastUpdatedBy = lastUpdatedBy;
    await repair.save({ session, new: false });

    await session.commitTransaction();
    await session.endSession();
    
    return newUsedInventory;
  } catch (e) {
    console.error(e);
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    await session.endSession();
    if (e.name === 'Internal') throw e;
    else {
      throw new Error(
        'Ocurrió un error al agregar la refacción. Intente de nuevo.'
      );
    }
  }
};

export const removeUsedProductFromSaleRepair = async ({
  usedInventoryId,
  lastUpdatedBy
}) => {
  let error = new Error();
  error.name = 'Internal';
  let conn = await connectToDatabase();
  const session = await conn.startSession();
  try {
    const usedInventory = await UsedInventory.findById(usedInventoryId);
    if (!usedInventory) {
      error.message = 'No se encontró la refacción utilizada.';
      throw error;
    }
    
    const repair = await SaleRepair.findById(usedInventory.saleRepair);
    if (!repair) {
      error.message = 'No se encontró la reparación indicada.';
      throw error;
    }
    
    if (repair.status !== 'PENDIENTE') {
      error.message = 'La reparación ya fue completada, no se pueden quitar refacciones.';
      throw error;
    }
    
    const product = await Inventory.findById(usedInventory.inventoryProduct);
    if (!product) {
      error.message = 'No se encontró el producto indicado.';
      throw error;
    }

    await session.startTransaction();

    // Return stock to inventory
    product.stock += usedInventory.qty;
    product.updatedAt = Date.now();
    product.lastUpdatedBy = lastUpdatedBy;
    await product.save({ session, new: false });

    // Remove from repair
    repair.usedInventory = repair.usedInventory.filter(
      (id) => id.toString() !== usedInventoryId
    );
    repair.updatedAt = Date.now();
    repair.lastUpdatedBy = lastUpdatedBy;
    await repair.save({ session, new: false });

    // Delete the used inventory record
    await UsedInventory.findByIdAndDelete(usedInventoryId, { session });

    await session.commitTransaction();
    await session.endSession();
  } catch (e) {
    console.error(e);
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    await session.endSession();
    if (e.name === 'Internal') throw e;
    else {
      throw new Error(
        'Ocurrió un error al quitar la refacción. Intente de nuevo.'
      );
    }
  }
};

export async function cancelSaleRepairData({
  repairId,
  cancellationReason,
  lastUpdatedBy
}) {
  let error = new Error();
  error.name = 'Internal';
  const currentDate = Date.now();
  let conn = await connectToDatabase();
  const session = await conn.startSession();
  try {
    const repair = await SaleRepair.findById(repairId).populate('usedInventory');
    if (!repair) {
      error.message = 'No se encontró la reparación indicada.';
      throw error;
    }
    
    if (repair.status !== 'PENDIENTE') {
      error.message = 'La reparación ya fue completada o cancelada.';
      throw error;
    }

    await session.startTransaction();

    // Return all used inventory to stock
    if (repair.usedInventory && repair.usedInventory.length > 0) {
      for (let usedInv of repair.usedInventory) {
        const product = await Inventory.findById(usedInv.inventoryProduct);
        if (product) {
          product.stock += usedInv.qty;
          product.updatedAt = currentDate;
          product.lastUpdatedBy = lastUpdatedBy;
          await product.save({ session, new: false });
        }
        await UsedInventory.findByIdAndDelete(usedInv._id, { session });
      }
    }

    repair.status = 'CANCELADA';
    repair.cancellationReason = cancellationReason;
    repair.finishedAt = currentDate;
    repair.updatedAt = currentDate;
    repair.lastUpdatedBy = lastUpdatedBy;
    await repair.save({ session, new: false });

    await session.commitTransaction();
    await session.endSession();
    
    return repair;
  } catch (e) {
    console.error(e);
    if (session.inTransaction()) {
      await session.abortTransaction();
    }
    await session.endSession();
    if (e.name === 'Internal') throw e;
    else {
      throw new Error(
        'Ocurrió un error al cancelar la reparación. Intente de nuevo.'
      );
    }
  }
}
