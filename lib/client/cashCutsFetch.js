import axios from 'axios';
import { ROUTES } from '../consts/API_URL_CONST';
import { refreshData } from '../../pages/api/useRequest';

const errorMsgOf = (err, fallback) =>
  err?.response?.data?.errorMsg || fallback;

/** Refresca todo lo que depende del estado de la caja. */
const refreshCashData = () => {
  refreshData(ROUTES.ROUTE_CASH_SUMMARY_API);
  refreshData(ROUTES.OFFICE_CASH_BOX_API);
};

export async function createRouteCashCut({ declaredAmount, notes }) {
  try {
    const res = await axios.post(ROUTES.ROUTE_CASH_CUT_API, {
      declaredAmount,
      notes
    });

    refreshCashData();

    return { error: false, msg: res.data.msg, data: res.data.data };
  } catch (err) {
    return {
      error: true,
      msg: errorMsgOf(err, 'Error al generar el corte.')
    };
  }
}

export async function registerCashCutDeposit({
  cutId,
  depositAccountId,
  depositAmount,
  depositFolio,
  receiptFile
}) {
  try {
    const data = new FormData();
    data.append('cutId', cutId);
    data.append('depositAccountId', depositAccountId);
    data.append('depositAmount', depositAmount);
    data.append('depositFolio', depositFolio || '');

    // El archivo ya viene comprimido desde el componente (compressImage)
    data.append('receipt', receiptFile);

    const res = await axios.post(ROUTES.CASH_CUT_DEPOSIT_API, data, {
      headers: {
        Accept: 'application/json, text/plain, */*',
        'Content-Type': 'multipart/form-data'
      }
    });

    refreshCashData();

    return { error: false, msg: res.data.msg };
  } catch (err) {
    return {
      error: true,
      msg: errorMsgOf(err, 'Error al registrar el depósito.')
    };
  }
}

export async function createOfficeCashCut({
  declaredAmount,
  handedToUserId,
  notes
}) {
  try {
    const res = await axios.post(ROUTES.OFFICE_CASH_CUT_API, {
      declaredAmount,
      handedToUserId,
      notes
    });

    refreshCashData();

    return { error: false, msg: res.data.msg, data: res.data.data };
  } catch (err) {
    return {
      error: true,
      msg: errorMsgOf(err, 'Error al cerrar el turno.')
    };
  }
}

export async function confirmOfficeCashCut({ cutId, confirmedAmount, notes }) {
  try {
    const res = await axios.post(ROUTES.CASH_CUT_CONFIRM_API, {
      cutId,
      confirmedAmount,
      notes
    });

    refreshCashData();

    return { error: false, msg: res.data.msg };
  } catch (err) {
    return {
      error: true,
      msg: errorMsgOf(err, 'Error al confirmar la caja.')
    };
  }
}

export async function createCashExpense({
  concept,
  description,
  amount,
  date,
  receiptFile
}) {
  try {
    const data = new FormData();
    data.append('concept', concept);
    data.append('description', description || '');
    data.append('amount', amount);
    if (date) data.append('date', date);

    // El archivo ya viene comprimido desde el componente (compressImage)
    data.append('receipt', receiptFile);

    const res = await axios.post(ROUTES.CASH_EXPENSES_API, data, {
      headers: {
        Accept: 'application/json, text/plain, */*',
        'Content-Type': 'multipart/form-data'
      }
    });

    refreshCashData();

    return { error: false, msg: res.data.msg };
  } catch (err) {
    return {
      error: true,
      msg: errorMsgOf(err, 'Error al registrar el gasto.')
    };
  }
}

export async function editCashCutAmount({ cutId, field, newValue, reason }) {
  try {
    const res = await axios.put(`${ROUTES.CASH_CUTS_API}/${cutId}`, {
      field,
      newValue,
      reason
    });

    refreshCashData();

    return { error: false, msg: res.data.msg };
  } catch (err) {
    return {
      error: true,
      msg: errorMsgOf(err, 'Error al corregir el monto.')
    };
  }
}

export async function editCashExpenseAmount({ expenseId, newValue, reason }) {
  try {
    const res = await axios.put(`${ROUTES.CASH_EXPENSES_API}/${expenseId}`, {
      newValue,
      reason
    });

    refreshCashData();

    return { error: false, msg: res.data.msg };
  } catch (err) {
    return {
      error: true,
      msg: errorMsgOf(err, 'Error al corregir el monto.')
    };
  }
}
