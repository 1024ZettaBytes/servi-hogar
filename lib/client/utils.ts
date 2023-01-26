import { jsPDF } from 'jspdf';
import * as htmlToImage from 'html-to-image';

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
  return (
    lowerUrl.match(Reg) && lowerUrl.includes('!3d') && lowerUrl.includes('!4d')
  );
};

export const getCoordinatesFromUrl = (
  url: string
): { lat: number; lng: number } => {
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

export const printElement = (document: Document, filename: string): void => {
  htmlToImage
    .toPng(document.getElementById('reportTable'), { quality: 1 })
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
  if (day === 6) return setDateToInitial(date);
  else return setDateToInitial(addDaysToDate(date, -(day + 1)));
};

export const getLastWeekDay = (date: Date): Date => {
  const day = date.getDay();
  if (day === 6) return setDateToEnd(addDaysToDate(date, 6));
  else return setDateToEnd(addDaysToDate(date, 5 - day));
};
