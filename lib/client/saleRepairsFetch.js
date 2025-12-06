import axios from 'axios';
import { ROUTES } from '../consts/API_URL_CONST';
import { refreshData } from '../../pages/api/useRequest';

export async function completeSaleRepair({ saleRepairId, description }) {
  try {
    const URL = ROUTES.SALE_REPAIR_BY_ID_API.replace(':id', saleRepairId);
    const res = await axios.post(
      URL,
      JSON.stringify({ saleRepairId, description }),
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    refreshData(ROUTES.ALL_SALE_REPAIRS_API);
    refreshData(ROUTES.ALL_PENDING_SALE_REPAIRS_API);
    refreshData(ROUTES.SALE_REPAIR_BY_ID_API.replace(':id', saleRepairId));
    return { error: false, msg: res.data.msg };
  } catch (err) {
    return {
      error: true,
      msg:
        err?.response?.data?.errorMsg ||
        'Error al completar la reparación. Por favor intente de nuevo.'
    };
  }
}

export async function cancelSaleRepair({ saleRepairId, cancellationReason }) {
  try {
    const URL = ROUTES.SALE_REPAIR_BY_ID_API.replace(':id', saleRepairId);
    const res = await axios.put(
      URL,
      JSON.stringify({ saleRepairId, cancellationReason }),
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    refreshData(ROUTES.ALL_SALE_REPAIRS_API);
    refreshData(ROUTES.ALL_PENDING_SALE_REPAIRS_API);
    refreshData(ROUTES.SALE_REPAIR_BY_ID_API.replace(':id', saleRepairId));
    return { error: false, msg: res.data.msg };
  } catch (err) {
    return {
      error: true,
      msg:
        err?.response?.data?.errorMsg ||
        'Error al cancelar la reparación. Por favor intente de nuevo.'
    };
  }
}

export async function addUsedProductToRepair(repairId, productId, qty) {
  try {
    const URL = ROUTES.SALE_REPAIR_USED_PRODUCT_API;
    const res = await axios.post(
      URL,
      JSON.stringify({ repairId, productId, qty }),
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    refreshData(ROUTES.ALL_PRODUCTS);
    refreshData(ROUTES.SALE_REPAIR_BY_ID_API.replace(':id', repairId));
    return { error: false, msg: res.data.msg };
  } catch (err) {
    console.error(err);
    return {
      error: true,
      msg:
        err?.response?.data?.errorMsg ||
        'Error al agregar la refacción. Por favor intente de nuevo.'
    };
  }
}

export async function removeUsedProductFromRepair(usedInventoryId) {
  try {
    const URL = ROUTES.SALE_REPAIR_USED_PRODUCT_API;
    const res = await axios.delete(URL, {
      data: JSON.stringify({ usedInventoryId }),
      headers: {
        'Content-Type': 'application/json'
      }
    });
    refreshData(ROUTES.SALE_REPAIR_BY_ID_API);
    refreshData(ROUTES.ALL_PRODUCTS);
    return { error: false, msg: res.data.msg };
  } catch (err) {
    return {
      error: true,
      msg:
        err?.response?.data?.errorMsg ||
        'Error al remover la refacción. Por favor intente de nuevo.'
    };
  }
}
