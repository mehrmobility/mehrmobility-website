import vehicleData from "./vehicles.json";
import editorialData from "./editorial.json";

export type Vehicle = (typeof vehicleData)[number];
export type Entry = (typeof editorialData)[number];
export const vehicles: Vehicle[] = vehicleData;
export const entries: Entry[] = editorialData;
export const brands: Record<string, string> = { toyota: "تویوتا", mitsubishi: "میتسوبیشی", nissan: "نیسان", kia: "کیا", hyundai: "هیوندای", suzuki: "سوزوکی", mg: "ام‌جی", gwm: "گریت‌وال", changan: "چانگان" };
export const routeNames: Record<string, string> = { cars: "خودروهای مهر", services: "خدمات پس از فروش", news: "فروش و اطلاعیه‌ها", journal: "مجله مهر", about: "درباره مهر", contact: "شعب و تماس", customers: "امور مشتریان", numberplate: "تبدیل پلاک", survey: "نظرسنجی مشتریان", complaints: "شکایت مشتریان", rights: "حقوق مشتریان", communication: "ارتباط با مشتریان", finder: "راهنمای انتخاب", compare: "مقایسه خودروها", garage: "گاراژ من", showroom: "نمایشگاه تعاملی", "purchase-plan": "برنامه خرید", "trade-in": "کارشناسی و معاوضه", visit: "بازدید و خدمات", "my-car": "خودروی من" };
export const documents = {
  survey: "https://mehrkhodro.co/wp-content/uploads/2025/12/فرم-نظر-سنجی-مهر-موتور-خاورمیانه.pdf",
  complaints: "https://mehrkhodro.co/wp-content/uploads/2025/12/فرم-ثبت-شکایت-مشتری-مهر-موتور-خاورمیانه.pdf",
};
export const branches = [
  { name: "شوروم مهر", tag: "فروش و مشاوره", address: "رشت، کیلومتر ۱ جاده رشت به انزلی، روبه‌روی اتاق بازرگانی گیلان", phone: "01334206", query: "Mehr Khodro Rasht" },
  { name: "مرکز خدمات مهر", tag: "خدمات پس از فروش", address: "رشت، خیابان شهدا، جنب بیمه دانا", phone: "01333846760", query: "رشت خیابان شهدا بیمه دانا" },
  { name: "دفتر مرکزی مهر", tag: "منطقه آزاد انزلی", address: "منطقه آزاد انزلی، بلوار شهید فاتحی، روبه‌روی شهرک صنعتی شماره ۲", phone: "01334206", query: "Anzali Free Zone Shahid Fatehi" },
];
export const faNumber = (value: number) => new Intl.NumberFormat("fa-IR").format(value);
export const faDate = (value: string) => new Intl.DateTimeFormat("fa-IR", { year: "numeric", month: "long", day: "numeric", timeZone: "Asia/Tehran" }).format(new Date(value));
export const vehicleName = (vehicle: Vehicle) => vehicle.title.split("|")[0].trim();
export const entryPath = (entry: Entry) => `/mehr/${entry.type === "posts" ? "journal" : entry.type === "notifications" ? "news" : entry.type === "service" ? "services" : entry.slug === "about-us" ? "about" : "numberplate"}${entry.type === "pages" ? "" : `/${encodeURIComponent(entry.slug)}`}`;
export const vehicleImage = (vehicle: Vehicle) => `/mehr-site/vehicles/${vehicle.slug}.${vehicle.primaryImage.url.split(".").pop()?.split("?")[0] || "png"}`;
export const entryImage = (entry: Entry) => entry.displayImage && entry.displayImage.startsWith("https://mehrkhodro.co/") ? `/mehr-site/content/${entry.id}.${entry.displayImage.split(".").pop()?.split("?")[0] || "jpg"}` : entry.displayImage || entry.primaryImage;

export function rewriteContentLinks(html: string): string {
  const mappings: [string, string][] = [
    ...vehicles.map(v => [v.pageUrl, `/mehr/cars/${v.slug}`] as [string,string]),
    ...entries.map(e => [e.sourceUrl, entryPath(e)] as [string,string]),
  ];
  return mappings.reduce((body, [old, replacement]) => body.split(old).join(replacement).split(decodeURI(old)).join(replacement), html)
    .replace(/<img /g, '<img loading="lazy" ').replace(/alt=""/g, 'alt="تصویر پیوست مطلب مهر خودرو"');
}
