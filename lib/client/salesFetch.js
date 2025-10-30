import axios from 'axios';
import { API_URL, ROUTES } from '../consts/API_URL_CONST';

export async function getAllSales() {
  try {
    const response = await axios.get(`${API_URL}/api/sales/all`);
    return response.data;
  } catch (error) {
    return { error: true, msg: error?.response?.data?.message || error.message };
  }
}

export async function getSaleById(saleId) {
  try {
    const response = await axios.get(`${API_URL}/api/sales/${saleId}`);
    return response.data;
  } catch (error) {
    return { error: true, msg: error?.response?.data?.message || error.message };
  }
}

export async function saveSale(saleData) {
  try {
    const response = await axios.post(ROUTES.SAVE_SALE_API, saleData);
    return response.data;
  } catch (error) {
    return { error: true, msg: error?.response?.data?.message || error.message };
  }
}

export async function registerPayment(paymentData) {
  try {
    const response = await axios.post(ROUTES.REGISTER_SALE_PAYMENT_API, paymentData);
    return response.data;
  } catch (error) {
    return { error: true, msg: error?.response?.data?.message || error.message };
  }
}

export async function getPendingSales() {
  try {
    const response = await axios.get(ROUTES.ALL_PENDING_SALES_API);
    return response.data;
  } catch (error) {
    return { error: true, msg: error?.response?.data?.message || error.message };
  }
}

export async function assignSaleToOperator(assignmentData) {
  try {
    const response = await axios.post(ROUTES.ASSIGN_SALE_API, assignmentData);
    return response.data;
  } catch (error) {
    return { error: true, msg: error?.response?.data?.errorMsg || error.message };
  }
}

export async function completeSaleDelivery(deliveryData) {
  try {
    const response = await axios.post(ROUTES.COMPLETE_SALE_DELIVERY_API, deliveryData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 120000, // 2 minutes timeout for large file uploads
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });
    return response.data;
  } catch (error) {
    console.error('Complete sale delivery error:', error);
    
    
    return { error: true, msg: error?.response?.data?.errorMsg || error?.response?.data?.message || error.message, debug: JSON.stringify(error) };
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
    return { error: true, msg: error?.response?.data?.message || error.message };
  }
}
