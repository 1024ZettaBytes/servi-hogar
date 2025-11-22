import axios from 'axios';
import { API_URL, ROUTES } from '../consts/API_URL_CONST';

export async function getAllSales() {
  try {
    const response = await axios.get(`${API_URL}/api/sales/all`);
    return response.data;
  } catch (error) {
    return {
      error: true,
      msg: error?.response?.data?.message || error.message
    };
  }
}

export async function getSaleById(saleId) {
  try {
    const response = await axios.get(`${API_URL}/api/sales/${saleId}`);
    return response.data;
  } catch (error) {
    return {
      error: true,
      msg: error?.response?.data?.message || error.message
    };
  }
}

export async function saveSale(saleData) {
  try {
    const response = await axios.post(ROUTES.SAVE_SALE_API, saleData);
    return response.data;
  } catch (error) {
    return {
      error: true,
      msg: error?.response?.data?.message || error.message
    };
  }
}

export async function registerPayment(paymentData) {
  try {
    const response = await axios.post(
      ROUTES.REGISTER_SALE_PAYMENT_API,
      paymentData
    );
    return { ...response.data, wasBlocked: response.data.wasBlocked };
  } catch (error) {
    return {
      error: true,
      msg: error?.response?.data?.message || error.message
    };
  }
}

export async function getPendingSales() {
  try {
    const response = await axios.get(ROUTES.ALL_PENDING_SALES_API);
    return response.data;
  } catch (error) {
    return {
      error: true,
      msg: error?.response?.data?.message || error.message
    };
  }
}

export async function assignSaleToOperator(assignmentData) {
  try {
    const response = await axios.post(ROUTES.ASSIGN_SALE_API, assignmentData);
    return response.data;
  } catch (error) {
    return {
      error: true,
      msg: error?.response?.data?.errorMsg || error.message
    };
  }
}

export async function completeSaleDelivery(attachments, saleData) {
  try {
    console.log('[salesFetch] completeSaleDelivery called');
    console.log('[salesFetch] Attachments:', Object.keys(attachments));
    console.log('[salesFetch] Sale data:', saleData);
    
    // Create FormData exactly like rent delivery does
    const json = JSON.stringify(saleData);
    const data = new FormData();
    data.append('body', json);
    
    // Append each image file (without the third parameter - filename)
    Object.keys(attachments).forEach((key) => {
      if (attachments[key]?.file) {
        console.log(`[salesFetch] Appending ${key}:`, {
          name: attachments[key].file.name,
          size: attachments[key].file.size,
          type: attachments[key].file.type
        });
        data.append(key, attachments[key].file);
      }
    });
    
    // Use exact same axios config as rent delivery (no timeout, no size limits)
    const res = await axios.post(
      ROUTES.COMPLETE_SALE_DELIVERY_API,
      data,
      {
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "multipart/form-data",
        },
      }
    );
    console.log('[salesFetch] Response received:', res.data);
    return { error: false, msg: res.data.msg };
  } catch (error) {
    console.error('[salesFetch] Error:', error);
    console.error('[salesFetch] Error details:', {
      message: error.message,
      code: error.code,
      response: error.response?.data,
      status: error.response?.status
    });
    
    return {
      error: true,
      msg: error.response?.data?.errorMsg || error.message || "Error al completar la entrega",
      errorCode: error.code,
      errorType: error.name,
      debug: JSON.stringify({
        code: error.code,
        message: error.message,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers
        }
      }, null, 2)
    };
  }
}

export async function cancelSale(saleId, lastUpdatedBy) {
  try {
    const response = await axios.post(`${API_URL}/api/sales/cancel`, {
      saleId,
      lastUpdatedBy
    });
    return response.data;
  } catch (error) {
    return {
      error: true,
      msg: error?.response?.data?.message || error.message
    };
  }
}
