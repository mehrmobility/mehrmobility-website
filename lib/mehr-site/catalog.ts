import type { Vehicle } from "./data";
export type Filters = { q: string; brand: string; body: string; fuel: string; gearbox: string; country: string; year: string; sort: string };
export const emptyFilters: Filters = { q:"",brand:"",body:"",fuel:"",gearbox:"",country:"",year:"",sort:"latest" };
export function normalizeText(value: string) { return value.toLowerCase().replace(/ي/g,"ی").replace(/ك/g,"ک").replace(/[۰-۹]/g,c=>String("۰۱۲۳۴۵۶۷۸۹".indexOf(c))).replace(/[\u200c\u200f]/g," ").trim(); }
export function filterVehicles(cars: Vehicle[], filters: Filters) {
  return cars.filter(car=>{
    const words=normalizeText(filters.q).split(/\s+/).filter(Boolean);
    const text=normalizeText(`${car.title} ${car.slug} ${car.brandName} ${Object.values(car.specs).flat().join(" ")}`);
    return words.every(word=>text.includes(word))&&(!filters.brand||car.brand===filters.brand)&&(["body","fuel","gearbox","country","year"] as const).every(key=>!filters[key]||car.specs[key].includes(filters[key]));
  }).sort((a,b)=>{
    const year=(v:Vehicle)=>Math.max(0,...v.specs.year.map(Number).filter(Number.isFinite));
    if(filters.sort==="year-asc")return year(a)-year(b);
    if(filters.sort==="year-desc")return year(b)-year(a);
    if(filters.sort==="name")return a.title.localeCompare(b.title,"fa");
    return b.id-a.id;
  });
}
