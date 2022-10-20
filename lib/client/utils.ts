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
