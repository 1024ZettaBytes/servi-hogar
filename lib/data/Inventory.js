'use strict';
import { connectToDatabase } from '../db';
import { Inventory } from '../models/Inventory';
import { ProductEntry } from '../models/ProductEntry';
import { UsedInventory } from '../models/UsedInventory';

export async function saveProductData({
  code,
  type,
  name,
  stock,
  sellPrice,
  latestPrice,
  min
}) {
  let error = new Error();
  error.name = 'Internal';
  const currentDate = Date.now();
  try {
    await connectToDatabase();

    const existingProduct = await Inventory.findOne({ code });
    if (existingProduct) {
      error.message = 'Ya existe un producto con el código ingresado';
      throw error;
    }

    await new Inventory({
      code,
      type,
      name,
      stock,
      sellPrice,
      latestCost: latestPrice,
      min,
      createdAt: currentDate
    }).save();
  } catch (e) {
    if (e.name === 'Internal') throw e;
    else {
      console.error(e);
      throw new Error(
        'Ocurrío un error al guardar el producto. Intente de nuevo.'
      );
    }
  }
}

export async function getProductsData(term = null, detailed = true) {
  try {
    let products;
    await connectToDatabase();
    if (detailed) {
      const filter = term
        ? {
            $or: [
              { code: { $regex: term, $options: 'i' } },
              { name: { $regex: term, $options: 'i' } }
            ]
          }
        : {};
      products = await Inventory.find({
        type: 'REFACCION',
        ...filter
      })
        .sort({ stock: 1 })
        .lean();
    } else {
      products = await Inventory.find({
        type: 'REFACCION'
      })
        .sort({ stock: 1 })
        .select({ code: 1, name: 1 })
        .lean();
    }

    return products;
  } catch (e) {
    console.error(e);
    throw new Error(
      'Ocurrío un error al obtener el inventario. Intente de nuevo.'
    );
  }
}

export async function saveProductEntryData({ product, date, qty, cost }) {
  let error = new Error();
  error.name = 'Internal';
  const currentDate = Date.now();
  let conn = await connectToDatabase();
  const session = await conn.startSession();
  try {
    let existingProduct = await Inventory.findOne({ code: product });
    if (!existingProduct || existingProduct.code !== product) {
      error.message = 'No existe el producto con el código ingresado';
      throw error;
    }
    await session.startTransaction();
    await new ProductEntry({
      product: existingProduct,
      cost,
      qty,
      date,
      createdAt: currentDate
    }).save({ session, isNew: true });
    existingProduct.stock = Number(existingProduct.stock) + Number(qty);
    existingProduct.latestCost = cost;
    await existingProduct.save({ session, isNew: false });
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
        'Ocurrío un error al guardar el producto. Intente de nuevo.'
      );
    }
  }
}
export async function getProductEntriesData() {
  try {
    await connectToDatabase();
    const entries = await ProductEntry.find()
      .sort({ date: 1 })
      .populate({
        path: 'product',
        select: 'code name'
      })
      .lean();
    return entries;
  } catch (e) {
    console.error(e);
    throw new Error(
      'Ocurrío un error al obtener los registros. Intente de nuevo.'
    );
  }
}

export async function getUsedInventoryData() {
  try {
    await connectToDatabase();
    const usedInventory = await UsedInventory.find()
      .sort({ date: 1 })
      .populate({
        path: 'inventoryProduct',
        select: 'code name'
      })
      .lean();
    return usedInventory;
  } catch (e) {
    console.error(e);
    throw new Error(
      'Ocurrío un error al obtener las salidas de inventario. Intente de nuevo.'
    );
  }
}
