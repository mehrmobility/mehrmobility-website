import { MehrWebsite } from "@/components/mehr-site/website";
import { cmsEditorial, cmsHomeHero, cmsPageIntro, cmsVehicles } from "@/lib/mehr-site/cms-db";
import { getSiteManagement, type NavItem } from "@/lib/mehr-site/site-management";
import type { HomeHero } from "@/lib/mehr-site/cms-contract";

function rootHref(href: string) {
  if (href === "/mehr") return "/";
  return href.startsWith("/mehr/") ? href.slice(5) : href;
}

export const dynamic = "force-dynamic";

export default async function Home() {
  const management = await getSiteManagement();
  const hero = cmsHomeHero();
  const rootHero: HomeHero = {
    ...hero,
    primaryHref: rootHref(hero.primaryHref),
    secondaryHref: rootHref(hero.secondaryHref),
  };

  return <div className="mehr-site" dir="rtl"><MehrWebsite
    segments={[]}
    navigation={management.mainNavigation.filter((item: NavItem) => item.status === "published").map((item: NavItem) => ({ ...item, href: rootHref(item.href) }))}
    hero={rootHero}
    aboutIntro={cmsPageIntro("about", { title: "مهر؛ نامی برای همراهی", eyebrow: "THE MEHR STORY", description: "از سال ۱۳۹۱، در مسیر انتخاب و نگهداری خودرو." })}
    contactIntro={cmsPageIntro("contact", { title: "از نزدیک، در کنار شما", eyebrow: "MEET MEHR", description: "برای انتخاب خودرو، خدمات یا پیگیری درخواست، با شعب مهر در ارتباط باشید." })}
    cmsEntries={cmsEditorial()}
    cmsVehicles={cmsVehicles()}
  /></div>;
}
