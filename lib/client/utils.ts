function startOfWeek(dt):Date {
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

export const addDaysToDate = (date: Date, days: number):Date => {
  var result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export const setDateToInitial = (date: Date):Date => {
  var result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

export const getFileExtension = (fileName: string): string =>{
  const splited = fileName.split(".");
  return splited[splited.length-1];
}

export const getFileFromUrl = (url: string): string =>{
  const splited = url.split("/");
  return splited[splited.length-1];
}

export const dateDiffInDays = (initial: Date, end: Date):number =>{
  const _MS_PER_DAY = 1000 * 60 * 60 * 24;
  // Discard the time and time-zone information.
  const utc1 = Date.UTC(initial.getFullYear(), initial.getMonth(), initial.getDate());
  const utc2 = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());

  return Math.floor((utc2 - utc1) / _MS_PER_DAY);
}

export const dateDiffInWeeks = (initial: Date, end: Date):number =>{
  const week = 7 * 24 * 60 * 60 * 1000;
return Math.ceil((startOfWeek(initial).getTime() - startOfWeek(end).getTime()) / week);
}