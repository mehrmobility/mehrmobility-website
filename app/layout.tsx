import type { Metadata } from "next";
import "./globals.css";
import "./customer-mobile.css";
import "./mehr/mehr.css";
import "./mehr/experiences.css";
import "./mehr/import/import.css";
import { indexRobots, mehrOrigin } from "@/lib/mehr-site/seo";
import { importKeywords } from "@/lib/mehr-site/import-guides";

export const metadata: Metadata = {
  metadataBase: mehrOrigin,
  title: { default: "مهر خودرو | انتخاب شما، تعهد مهر", template: "%s | مهر خودرو" },
  description: "خودروهای وارداتی مهر در منطقه آزاد انزلی؛ مشخصات، کاتالوگ، خدمات پس از فروش و راه‌های ارتباط با مهر خودرو.",
  keywords: ["مهر خودرو", "واردات خودرو منطقه آزاد انزلی", "خودرو وارداتی انزلی", "تبدیل پلاک منطقه آزاد به پلاک ملی", ...importKeywords],
  robots: indexRobots(),
  alternates: { canonical: "/" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fa" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
