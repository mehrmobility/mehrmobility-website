import type { Metadata } from "next";
import "./globals.css";
import "./customer-mobile.css";

export const metadata: Metadata = {
  title: "مهر من | خودرو و خدمات",
  description: "کشف خودرو، پیگیری خرید تا تحویل و خدمات پس از فروش مهر",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fa" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
