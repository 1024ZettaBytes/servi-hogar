import { jsPDF } from 'jspdf';
import * as htmlToImage from 'html-to-image';
import dayjs from 'dayjs';

import LocalizedFormat from 'dayjs/plugin/localizedFormat';
import 'dayjs/locale/es-mx';
import utc from 'dayjs/plugin/utc';
import tz from 'dayjs/plugin/timezone';
import objectSupport from 'dayjs/plugin/objectSupport';
import { MAPS_BASE_URL, PAYOUT_CONSTS } from 'lib/consts/OBJ_CONTS';
import { format } from 'date-fns';
import { useMediaQuery } from '@mui/material';
dayjs.extend(utc);
dayjs.extend(tz);
dayjs.extend(objectSupport);
dayjs.locale('es-mx');
dayjs.extend(LocalizedFormat);
function startOfWeek(dt): Date {
  const day = 24 * 60 * 60 * 1000;
  const weekday = dt.getDay();
  return new Date(dt.getTime() - Math.abs(0 - weekday) * day);
}

export const capitalizeFirstLetter = (str: string) => {
  const capitalizedDate = str.charAt(0).toUpperCase() + str.slice(1);
  return capitalizedDate;
};

export const validateMapsUrl = (url: string) => {
  const Reg = /(https|http):\/\/(www\.|)google\.[a-z]+\/maps/;
  const lowerUrl = url.toLowerCase();
  const splited = url.split(',');

  return (
    (lowerUrl.match(Reg) &&
      lowerUrl.includes('!3d') &&
      lowerUrl.includes('!4d')) ||
    (lowerUrl.includes('https://maps.google.com/maps?q=') &&
      splited.length === 2 &&
      splited[1].length > 0)
  );
};

export const replaceCoordinatesOnUrl = (coordinates: any): string => {
  const { latitude, longitude } = coordinates;
  return MAPS_BASE_URL.replace('[LAT]', latitude).replace('[LON]', longitude);
};

export const getCoordinatesFromUrl = (
  url: string
): { lat: number; lng: number } => {
  if (url.toLowerCase().includes('https://maps.google.com/maps?q=')) {
    const firstSplit = url.split('?q=')[1];
    const finalSplit = firstSplit.split(',');
    return {
      lat: Number.parseFloat(finalSplit[0]),
      lng: Number.parseFloat(finalSplit[1])
    };
  }
  const lowerUrl = url.toLowerCase();
  const _3dSplit = lowerUrl.split('!3d');
  let _4dSplit = _3dSplit[_3dSplit.length - 1].split('!4d');
  if (_4dSplit[1].includes('?hl')) {
    const index = _4dSplit[1].indexOf('?hl');
    const toReplace = _4dSplit[1].substring(index);
    _4dSplit[1] = _4dSplit[1].replace(toReplace, '');
  }
  return {
    lat: Number.parseFloat(_4dSplit[0]),
    lng: Number.parseFloat(_4dSplit[1])
  };
};

export const getTimeFromDate = (
  date: Date
): { hours: number; minutes: number; seconds: number } => {
  return {
    hours: date.getHours(),
    minutes: date.getMinutes(),
    seconds: date.getSeconds()
  };
};

export const dateFromString = (dateString: String): Date => {
  const [year, month, day] = dateString.split('-');
  return new Date(+year, +month - 1, +day);
};

export const dateToPlainString = (date: Date): String => {
  return format(date, 'dd-MM-yyyy');
};

export const addDaysToDate = (date: Date, days: number): Date => {
  var result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const setDateToInitial = (date: Date): Date => {
  var result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
};

export const setDateToMid = (date: Date): Date => {
  var result = new Date(date);
  result.setHours(12, 0, 0, 0);
  return result;
};

export const setDateToEnd = (date: Date): Date => {
  var result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
};

export const isDateInRange = (date: Date, start: Date, end: Date): boolean => {
  return date.getTime() >= start.getTime() && date.getTime() <= end.getTime();
};

export const getFileExtension = (fileName: string): string => {
  const splited = fileName.split('.');
  return splited[splited.length - 1];
};

export const getFileFromUrl = (url: string): string => {
  const splited = url.split('/');
  return splited[splited.length - 1];
};

// Extract full file path from cloud storage URL (includes folders)
// URL format: https://storage.googleapis.com/bucket-name/path/to/file.jpg
// Returns: path/to/file.jpg
export const getFilePathFromUrl = (url: string): string => {
  const patterns = [
    /storage\.googleapis\.com\/[^\/]+\/(.+)$/,  // Google Cloud Storage
    /storage\.cloud\.google\.com\/[^\/]+\/(.+)$/, // Alternative GCS URL
    /\.com\/[^\/]+\/(.+)$/ // Generic pattern: domain.com/bucket/path
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  // Fallback to last segment
  const splited = url.split('/');
  return splited[splited.length - 1];
};

export const dateDiffInDays = (initial: Date, end: Date): number => {
  const _MS_PER_DAY = 1000 * 60 * 60 * 24;
  // Discard the time and time-zone information.
  const utc1 = Date.UTC(
    initial.getFullYear(),
    initial.getMonth(),
    initial.getDate()
  );
  const utc2 = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());

  return Math.floor((utc2 - utc1) / _MS_PER_DAY);
};

export const dateDiffInWeeks = (initial: Date, end: Date): number => {
  const week = 7 * 24 * 60 * 60 * 1000;
  return Math.ceil(
    (startOfWeek(initial).getTime() - startOfWeek(end).getTime()) / week
  );
};

export const dateDiffInYears = (initial: Date, end: Date): number => {
  return dayjs(initial).diff(end, 'year');
};
export const hasSundayBetween = (startDate: Date, endDate: Date): boolean => {
  // Clone dates to avoid mutating original inputs
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Set both times to 12:00 PM
  start.setHours(12, 0, 0, 0);
  end.setHours(12, 0, 0, 0);

  const current = new Date(start);

  while (current <= end) {
    if (current.getDay() === 0) { // 0 = Sunday
      return true;
    }
    current.setDate(current.getDate() + 1);
  }

  return false;
}
export const printElement = async (
  document: Document,
  filename: string,
  elementName: string = null
): Promise<void> => {
  return await htmlToImage
    .toPng(document.getElementById(elementName || 'reportTable'), {
      quality: 1
    })
    .then(function (dataUrl) {
      const pdf = new jsPDF();
      const imgProps = pdf.getImageProperties(dataUrl);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(filename);
    });
};

export const getFirstWeekDay = (date: Date): Date => {
  const day = date.getDay();
  if (day === 5) return setDateToInitial(date);
  if (day > 5) return setDateToInitial(addDaysToDate(date, -(day - 5)));
  else return setDateToInitial(addDaysToDate(date, -(day + 2)));
};

export const getLastWeekDay = (date: Date): Date => {
  const day = date.getDay();
  if (day === 5) return setDateToEnd(addDaysToDate(date, 6));
  if (day > 5) return setDateToInitial(addDaysToDate(date, 5 + (6 - day)));
  else return setDateToEnd(addDaysToDate(date, 4 - day));
};

export const getFirstDayMonth = (date: Date): Date => {
  const firstDayDate = new Date(date.getFullYear(), date.getMonth(), 1);
  return setDateToInitial(firstDayDate);
};

export const getLastDayMonth = (date: Date): Date => {
  const lastDayDate = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return setDateToEnd(lastDayDate);
};

export const sleep = async (duration: number): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(resolve, duration);
  });
};

export const formatTZDate = (date: Date, format: string): string => {
  return dayjs(date).format(format);
};

export const convertDateToTZ = (date: Date): Date => {
  if (dayjs().utcOffset() / 60 === -7) return date;
  return dayjs
    .utc({
      y: date.getFullYear(),
      M: date.getMonth(),
      d: date.getDate(),
      h: date.getHours(),
      m: date.getMinutes(),
      s: date.getSeconds(),
      ms: date.getMilliseconds()
    })
    .add(7, 'hour')
    .toDate();
};

export const convertDateToLocal = (date: Date): Date => {
  let hourDiff = 0;
  let localOffSet = dayjs().utcOffset() / 60;
  if (localOffSet >= 0) hourDiff = -(7 + localOffSet);
  else {
    localOffSet = -localOffSet;
    hourDiff = localOffSet - 7;
  }
  return dayjs.utc(date).add(hourDiff, 'hour').toDate();
};

export const machineCalculations = (
  income: number,
  operationDate: Date,
  machineCreatedAt: Date
): any => {
  const currentYear = dateDiffInYears(operationDate, machineCreatedAt);
  const mantPercentage =
    PAYOUT_CONSTS.INITIAL_MANT + currentYear * PAYOUT_CONSTS.YEARLY_MANT;
  let data = {
    mantainance: income > 0 ? (income / 100) * mantPercentage : 0,
    mantPercentage,
    comision: income > 0 ? (income / 100) * PAYOUT_CONSTS.COMISION : 0,
    comisionPercentage: PAYOUT_CONSTS.COMISION,
    toPay: 0
  };
  data.toPay = income - data.mantainance - data.comision;
  return data;
};

const useDeviceType = () => {
  const isMobile = useMediaQuery('(max-width: 768px)'); // Adjust breakpoint as needed
  return { isMobile, isDesktop: !isMobile };
};

export const isMobile = () => {
  if (typeof window === 'undefined' || typeof window.navigator === 'undefined')
    return false;
  return /iphone|ipad|ipod|android|blackberry|windows phone/g.test(navigator.userAgent.toLowerCase()); 
}

/**
 * Compresses an image file and returns a compressed version with a preview URL
 * @param imageFile - The image file to compress
 * @param options - Compression options
 * @returns Object with compressed file and preview URL, or null if validation fails
 */
export const compressImage = async (
  imageFile: File,
  options: {
    primaryQuality?: number;
    fallbackQuality?: number;
  } = {}
): Promise<{ file: File; url: string } | null> => {
  const { primaryQuality = 0.2, fallbackQuality = 0.6 } = options;

  // Validate file type
  const isValidImage = imageFile.type.includes('image/') && !imageFile.type.includes('/heic');
  if (!isValidImage) {
    console.error('Invalid image type:', imageFile.type);
    return null;
  }

  // Dynamic imports to avoid SSR issues
  const imageConversion = await import('image-conversion');
  const Compressor = (await import('compressorjs')).default;

  // Compress image with fallback chain
  let compressedFile = imageFile;
  try {
    // Try primary compression (imageConversion)
    const compressed = await imageConversion.compress(imageFile, primaryQuality);
    compressedFile = new File([compressed as BlobPart], imageFile.name, {
      type: imageFile.type,
      lastModified: Date.now()
    });
  } catch (error) {
    console.warn('Primary compression failed, trying Compressor.js:', error);
    try {
      // Fallback to Compressor.js
      const compressed = await new Promise<Blob>((resolve, reject) => {
        new Compressor(imageFile, {
          quality: fallbackQuality,
          success: resolve,
          error: reject
        });
      });
      compressedFile = new File([compressed], imageFile.name, {
        type: imageFile.type,
        lastModified: Date.now()
      });
    } catch (error2) {
      console.warn('Compression failed, using original file:', error2);
      // Use original file as final fallback
    }
  }

  // Create preview URL
  const url = URL.createObjectURL(compressedFile);
  
  return { file: compressedFile, url };
};

export const formatReceiptNumber = (number: number, totalLength: number = 6): string => {
  return `SH-${number.toString().padStart(totalLength, '0')}`;
}

export const getWeeksFromPayment = (payment) => {
  if (typeof payment?.weeksToPay === 'number' && payment.weeksToPay > 0) {
    return payment.weeksToPay;
  }

  const desc = payment?.description?.toLowerCase() || '';

  if (desc.includes('semana')) {
    const match = desc.match(/\d+/);
    return match ? parseInt(match[0], 10) : null;
  }

  return null;
};

export default useDeviceType;
