import axios from 'axios';
import { ROUTES } from '../consts/API_URL_CONST';

export async function saveExtraTrip(tripData) {
  try {
    const response = await axios.post(ROUTES.EXTRA_TRIPS_API, tripData);
    return response.data;
  } catch (error) {
    return {
      error: true,
      msg: error?.response?.data?.errorMsg || error.message
    };
  }
}

export async function assignExtraTrip(tripId, operatorId) {
  try {
    const response = await axios.post(ROUTES.EXTRA_TRIPS_ASSIGN_API, {
      tripId,
      operatorId
    });
    return response.data;
  } catch (error) {
    return {
      error: true,
      msg: error?.response?.data?.errorMsg || error.message
    };
  }
}

export async function completeExtraTrip(tripId, completionNotes) {
  try {
    const response = await axios.post(ROUTES.EXTRA_TRIPS_COMPLETE_API, {
      tripId,
      completionNotes
    });
    return response.data;
  } catch (error) {
    return {
      error: true,
      msg: error?.response?.data?.errorMsg || error.message
    };
  }
}

export async function cancelExtraTrip(tripId) {
  try {
    const response = await axios.post(ROUTES.EXTRA_TRIPS_CANCEL_API, {
      tripId
    });
    return response.data;
  } catch (error) {
    return {
      error: true,
      msg: error?.response?.data?.errorMsg || error.message
    };
  }
}

export async function scheduleExtraTrip(tripId, scheduledTime) {
  try {
    const response = await axios.post(ROUTES.EXTRA_TRIPS_SCHEDULE_API, {
      tripId,
      scheduledTime
    });
    return response.data;
  } catch (error) {
    return {
      error: true,
      msg: error?.response?.data?.errorMsg || error.message
    };
  }
}
