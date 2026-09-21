"use client";

import Image from "next/image";
import { CameraOff } from "lucide-react";
import { useState } from "react";

export function CatalogVehicleImage({ src, alt, sizes, priority = false, used = false }: { src: string; alt: string; sizes: string; priority?: boolean; used?: boolean }) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const failed = failedSrc === src;
  const actualUsedImage = src.startsWith("/customer-api/v1/marketplace/listings/") && src.includes("/media/");
  if (!src || failed || (used && !actualUsedImage)) {
    return <div className="image-not-available" role="img" aria-label={`تصویر ${alt} در دسترس نیست`}><CameraOff size={32} strokeWidth={1.3} /><span>{failed ? "دریافت تصویر ممکن نشد" : "عکس واقعی هنوز منتشر نشده"}</span></div>;
  }
  // Private BFF images must use the browser's session and must not enter the
  // Next image optimizer's shared cache, which does not forward auth headers.
  return <Image src={src} alt={alt} fill sizes={sizes} priority={priority} unoptimized={actualUsedImage} onError={() => setFailedSrc(src)} />;
}
