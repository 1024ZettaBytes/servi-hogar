import { connectToDatabase } from '../db';
import { AttendanceRecord } from '../models/AttendanceRecord';
import { User } from '../models/User';
import { Warehouse } from '../models/Warehouse';
import { getCoordinatesFromUrl, validateMapsUrl } from '../client/utils';

const EXEMPT_ROLES = ['ADMIN', 'PARTNER', 'SYSTEM'];
const MAX_DISTANCE_METERS = 200;

function haversineDistance(coord1, coord2) {
  const R = 6371e3;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(coord2.lat - coord1.lat);
  const dLng = toRad(coord2.lng - coord1.lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(coord1.lat)) *
      Math.cos(toRad(coord2.lat)) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function getStartOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

async function setDefaultWarehouse(user){
  const office = await Warehouse.findOne({isOffice: true}).select("_id");
  user.warehouse = office._id;
  await user.save();
  return user;
}
export async function recordLoginAttendance({ userId, coordinates }) {
  await connectToDatabase();
  let user = await User.findById(userId).populate('role').populate('warehouse');
  if (!user || !user.role) return null;

  if (EXEMPT_ROLES.includes(user.role.id)) return null;

  if (!user.warehouse) {
    user = await setDefaultWarehouse(user);
  }

  const warehouse = user.warehouse;
  const now = new Date();
  const todayStart = getStartOfDay(now);

  let isLocationValid = false;
  if (coordinates && coordinates.lat && coordinates.lng && warehouse.maps) {
    if (validateMapsUrl(warehouse.maps)) {
      const warehouseCoords = getCoordinatesFromUrl(warehouse.maps);
      const distance = haversineDistance(coordinates, warehouseCoords);
      isLocationValid = distance <= MAX_DISTANCE_METERS;
    }
  }

  const existing = await AttendanceRecord.findOne({
    user: userId,
    date: todayStart
  });

  if (existing) {
    // Si el registro existente no fue válido pero el nuevo sí, actualizar
    if (!existing.isLoginLocationValid && isLocationValid) {
      existing.isLoginLocationValid = true;
      existing.loginCoordinates = coordinates;
      existing.firstLogin = now;
      await existing.save();
    }
    return { record: existing, isNew: false, isLocationValid: existing.isLoginLocationValid };
  }

  const record = new AttendanceRecord({
    user: userId,
    warehouse: warehouse._id,
    date: todayStart,
    firstLogin: now,
    loginCoordinates: coordinates || { lat: null, lng: null },
    isLoginLocationValid: isLocationValid
  });
  await record.save();
  return { record, isNew: true, isLocationValid };
}

export async function recordLogoutAttendance({ userId, coordinates }) {
  await connectToDatabase();
  const user = await User.findById(userId).populate('role').populate('warehouse');
  if (!user || !user.role) return null;

  if (EXEMPT_ROLES.includes(user.role.id)) return null;

  const warehouse = user.warehouse;
  const now = new Date();
  const todayStart = getStartOfDay(now);

  let isLocationValid = false;
  if (coordinates && coordinates.lat && coordinates.lng && warehouse?.maps) {
    if (validateMapsUrl(warehouse.maps)) {
      const warehouseCoords = getCoordinatesFromUrl(warehouse.maps);
      const distance = haversineDistance(coordinates, warehouseCoords);
      isLocationValid = distance <= MAX_DISTANCE_METERS;
    }
  }

  const record = await AttendanceRecord.findOneAndUpdate(
    { user: userId, date: todayStart },
    {
      lastLogout: now,
      logoutCoordinates: coordinates || { lat: null, lng: null },
      isLogoutLocationValid: isLocationValid
    },
    { new: true }
  );

  return record;
}

export async function getAttendanceByUser({ userId, startDate, endDate }) {
  await connectToDatabase();
  const query = { user: userId };
  if (startDate || endDate) {
    query.date = {};
    if (startDate) query.date.$gte = getStartOfDay(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      query.date.$lte = end;
    }
  }
  const records = await AttendanceRecord.find(query)
    .populate('warehouse', 'name')
    .sort({ date: -1 })
    .lean();
  return records;
}
