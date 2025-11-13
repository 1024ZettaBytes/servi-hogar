import { ROUTES } from '../consts/API_URL_CONST';

export async function getAllSalesMachines(all = false) {
  const url = `${ROUTES.ALL_SALES_MACHINES_API}${all ? '?all=true' : ''}`;
  const res = await fetch(url);
  if (res.ok) {
    const json = await res.json();
    return { salesMachinesList: json.salesMachinesList, error: false };
  }
  const json = await res.json();
  return { error: true, msg: json.error };
}

export async function saveSalesMachine(data) {
  const url = `${ROUTES.ALL_SALES_MACHINES_API}/save`;
  const res = await fetch(url, {
    method: 'POST',
    body: data // data is already FormData from the component
  });
  if (res.ok) {
    const json = await res.json();
    return { msg: json.msg, error: false };
  }
  const json = await res.json();
  return { error: true, msg: json.error };
}

export async function updateSalesMachine(data) {
  const url = `${ROUTES.ALL_SALES_MACHINES_API}/update`;
  const res = await fetch(url, {
    method: 'PUT',
    body: JSON.stringify(data),
    headers: {
      'Content-Type': 'application/json'
    }
  });
  if (res.ok) {
    const json = await res.json();
    return { msg: json.msg, error: false };
  }
  const json = await res.json();
  return { error: true, msg: json.error };
}

export async function deleteSalesMachines(arrayOfIds) {
  const url = `${ROUTES.ALL_SALES_MACHINES_API}/delete`;
  const res = await fetch(url, {
    method: 'DELETE',
    body: JSON.stringify({ arrayOfIds }),
    headers: {
      'Content-Type': 'application/json'
    }
  });
  if (res.ok) {
    const json = await res.json();
    return { msg: json.msg, error: false };
  }
  const json = await res.json();
  return { error: true, msg: json.error };
}
