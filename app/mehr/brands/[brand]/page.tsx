import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { brands, vehicleImage, vehicleName, vehicles } from "@/lib/mehr-site/data";

const supportedBrands = ["toyota", "nissan"] as const;
type Brand = typeof supportedBrands[number];
type Props = { params: Promise<{ brand: string }> };
export function generateStaticParams() { return supportedBrands.map(brand => ({ brand })); }
export async function generateMetadata({ params }: Props): Promise<Metadata> { const { brand } = await params; if (!supportedBrands.includes(brand as Brand)) return {}; const name = brands[brand]; return { title: `خودروهای ${name} در مهر خودرو`, description: `مشخصات، کاتالوگ و مدل‌های ${name} که در مجموعه خودروهای مهر معرفی شده‌اند.`, keywords: [`خودروهای ${name} در مهر`, `${name} منطقه آزاد انزلی`, `خودرو وارداتی ${name}`, `نمایندگی ${name}`], alternates: { canonical: `/mehr/brands/${brand}` } }; }
export default async function BrandPage({ params }: Props) { const { brand } = await params; if (!supportedBrands.includes(brand as Brand)) notFound(); const name = brands[brand]; const cars = vehicles.filter(car => car.brand === brand); return <main className="mi-page"><article className="mi-article"><nav><Link href="/mehr">مهر خودرو</Link><span>/</span><Link href="/mehr/cars">خودروها</Link><span>/</span><b>{name}</b></nav><span className="mi-label">MEHR VEHICLE COLLECTION</span><h1>خودروهای {name}<br/>در مهر خودرو</h1><p className="mi-lead">مدل‌های {name} که در کاتالوگ عمومی مهر معرفی شده‌اند را مقایسه کنید. این صفحه ادعای نمایندگی رسمی {name} نیست.</p><section className="mi-grid">{cars.map(car => <Link key={car.slug} href={`/mehr/cars/${car.slug}`}><img src={vehicleImage(car)} alt=""/><small>{car.brandName}</small><h2>{vehicleName(car)}</h2><p>{car.specs.body.join(" · ")} · {car.specs.year.join(" / ")}</p><b>مشخصات خودرو ←</b></Link>)}</section><section><h2>آیا مهر خودرو نمایندگی رسمی {name} است؟</h2><p>این سایت صرفاً مدل‌های موجود در کاتالوگ عمومی مهر را معرفی می‌کند. هرگونه وضعیت نمایندگی رسمی، گارانتی، موجودی یا شرایط فروش باید از مرجع رسمی برند یا تأییدیه کتبی مهر استعلام شود.</p></section></article></main>; }
