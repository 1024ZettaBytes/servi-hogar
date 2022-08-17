export const capitalizeFirstLetter = (str: string) =>{
    const capitalizedDate = str.charAt(0).toUpperCase() + str.slice(1);
    return capitalizedDate;
};

export const  validateMapsUrl = (url: string)=>{
    const Reg = /(https|http):\/\/(www\.|)google\.[a-z]+\/maps/;
    return url.toLowerCase().match(Reg);
}