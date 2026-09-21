import { MehrWebsite } from "@/components/mehr-site/website";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { vehicles, entries, routeNames, vehicleImage, entryImage, vehicleName } from "@/lib/mehr-site/data";
import { emptyFilters, type Filters } from "@/lib/mehr-site/catalog";
import { validSlugs } from "@/lib/mehr-site/experience";
import { plainText } from "@/lib/mehr-site/seo";
import { getSiteManagement } from "@/lib/mehr-site/site-management";
import { cmsEditorial, cmsHomeHero, cmsPageIntro, cmsVehicles } from "@/lib/mehr-site/cms-db";

type Props={ params: Promise<{ segments?: string[] }>; searchParams: Promise<Record<string,string|string[]|undefined>> };
export const dynamic = "force-dynamic";
function decodeSegments(segments:string[]){return segments.map(segment=>{try{return decodeURIComponent(segment);}catch{notFound();}});}
export function generateStaticParams(){return [{segments:[]},...Object.keys(routeNames).map(section=>({segments:[section]})),...vehicles.map(v=>({segments:["cars",v.slug]})),...entries.filter(e=>["posts","notifications","service"].includes(e.type)).map(e=>({segments:[e.type==="posts"?"journal":e.type==="notifications"?"news":"services",e.slug]}))];}
export async function generateMetadata({params}:Props):Promise<Metadata>{
  const {segments=[]}=await params;const [section,slug]=decodeSegments(segments);
  const vehicle=section==="cars"&&slug?vehicles.find(v=>v.slug===slug):undefined;
  const entry=slug&&section!=="cars"?entries.find(e=>e.slug===slug):undefined;
  const title=vehicle?.title||entry?.title||routeNames[section]||"مهر خودرو | انتخاب شما، تعهد مهر";
  const path=`/mehr${segments.length?`/${segments.map(encodeURIComponent).join("/")}`:""}`;
  const description=vehicle?`${vehicleName(vehicle)}؛ ${vehicle.specs.body.join(" / ")} ${vehicle.specs.fuel.join(" / ")} با گیربکس ${vehicle.specs.gearbox.join(" / ")} و سال تولید ${vehicle.specs.year.join(" / ")} در مجموعه مهر خودرو.`:entry?plainText(entry.excerpt||entry.bodyHtml):({cars:"فهرست خودروهای وارداتی مهر با مشخصات، کاتالوگ و گالری تصاویر.",services:"خدمات پس از فروش خودرو در مهر؛ راه‌های تماس و درخواست هماهنگی مراجعه.",journal:"مقالات و بررسی خودروهای وارداتی و منطقه آزاد انزلی در مجله مهر.",news:"اطلاعیه‌ها و آرشیو بخشنامه‌های مهر خودرو.",about:"معرفی مهر خودرو و مسیر فعالیت آن در واردات و خدمات خودرو در منطقه آزاد انزلی.",contact:"نشانی شعب، شماره‌های تماس و راه‌های ارتباط با مهر خودرو.",numberplate:"راهنمای تبدیل پلاک منطقه آزاد به پلاک ملی و دریافت اطلاعات از مهر خودرو."} as Record<string,string>)[section]||"خودروهای مهر، خدمات پس از فروش و راه‌های ارتباط با مهر خودرو.";
  const image=vehicle?vehicleImage(vehicle):entry?entryImage(entry):undefined;
  return { title, description, alternates:{canonical:path}, openGraph:{title,description,locale:"fa_IR",type:entry?.type==="posts"?"article":"website",url:path,images:image?[{url:image,alt:title}]:undefined}, twitter:{card:image?"summary_large_image":"summary",title,description,images:image?[image]:undefined} };
}
export default async function Page({ params, searchParams }: Props) {
  const { segments:rawSegments = [] } = await params;
  const segments=decodeSegments(rawSegments);
  const [section,slug]=segments;
  if(segments.length>2||section&&!routeNames[section])notFound();
  const publicVehicles = cmsVehicles();
  const publicEntries = cmsEditorial();
  if(slug){const type=section==="journal"?"posts":section==="news"?"notifications":section==="services"?"service":"";if(section==="cars"?!publicVehicles.some(v=>v.slug===slug):!publicEntries.some(e=>e.type===type&&e.slug===slug))notFound();}
  const search=await searchParams;
  const initialFilters:Partial<Filters>={};
  for(const key of Object.keys(emptyFilters) as (keyof Filters)[]){const value=search[key];if(typeof value==="string")initialFilters[key]=value.slice(0,150);}
  const initialIds=typeof search.cars==="string"?validSlugs(search.cars.slice(0,3000).split(","),publicVehicles,section==="compare"?3:30):[];
  const initialCar=typeof search.car==="string"&&publicVehicles.some(v=>v.slug===search.car)?search.car:"";
  const initialColor=typeof search.color==="string"&&publicVehicles.find(v=>v.slug===initialCar)?.specs.colors.includes(search.color)?search.color:"";
  const management = await getSiteManagement();
  return <MehrWebsite segments={segments} initialFilters={initialFilters} initialIds={initialIds} initialCar={initialCar} initialColor={initialColor} navigation={management.mainNavigation.filter((item: { status: string }) => item.status === "published")} hero={cmsHomeHero()} aboutIntro={cmsPageIntro("about", { title:"مهر؛ نامی برای همراهی", eyebrow:"THE MEHR STORY", description:"از سال ۱۳۹۱، در مسیر انتخاب و نگهداری خودرو." })} contactIntro={cmsPageIntro("contact", { title:"از نزدیک، در کنار شما", eyebrow:"MEET MEHR", description:"برای انتخاب خودرو، خدمات یا پیگیری درخواست، با شعب مهر در ارتباط باشید." })} cmsEntries={publicEntries} cmsVehicles={publicVehicles}/>;
}
