"use client";

import Image from "next/image";
import { useState } from "react";

type AttractionImageProps = {
  src: string;
  alt: string;
  scene: string;
};

export default function AttractionImage({ src, alt, scene }: AttractionImageProps) {
  const [hasError, setHasError] = useState(false);

  return (
    <div className={`attraction-image attraction-scene-${scene}`}>
      {!hasError && (
        <Image
          className="attraction-photo"
          src={src}
          alt={alt}
          fill
          sizes="(max-width: 580px) calc(100vw - 28px), (max-width: 860px) calc(50vw - 36px), (max-width: 1180px) 36vw, 420px"
          loading="lazy"
          unoptimized
          onError={() => setHasError(true)}
        />
      )}
      <div className="attraction-image-fallback" aria-hidden={!hasError}>
        <span className="attraction-fallback-sun" />
        <span className="attraction-fallback-land" />
        {hasError && <span className="attraction-fallback-message">Image unavailable</span>}
      </div>
      <span className="attraction-sample-label">Illustrative image</span>
    </div>
  );
}
