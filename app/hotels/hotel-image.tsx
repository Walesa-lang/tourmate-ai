"use client";

import Image from "next/image";
import { useState } from "react";

type HotelImageProps = {
  src: string;
  alt: string;
  propertyType: string;
  scene: string;
};

export default function HotelImage({
  src,
  alt,
  propertyType,
  scene,
}: HotelImageProps) {
  const [hasError, setHasError] = useState(false);

  return (
    <div className={`hotel-image hotel-scene-${scene}`}>
      {!hasError && (
        <Image
          className="hotel-photo"
          src={src}
          alt={alt}
          fill
          sizes="(max-width: 560px) calc(100vw - 28px), (max-width: 820px) calc(50vw - 38px), (max-width: 1160px) 36vw, 420px"
          loading="lazy"
          unoptimized
          onError={() => setHasError(true)}
        />
      )}
      <div className="hotel-image-fallback" aria-hidden={!hasError}>
        <span className="hotel-sun" />
        <span className="hotel-landscape" />
        {hasError && <span className="fallback-message">Image unavailable</span>}
      </div>
      <span className="property-type">{propertyType}</span>
      <span className="sample-listing">Illustrative image</span>
    </div>
  );
}
