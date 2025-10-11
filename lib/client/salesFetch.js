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
