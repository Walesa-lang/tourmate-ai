type HotelImageProps = {
  propertyType: string;
  scene: string;
};

export default function HotelImage({
  propertyType,
  scene,
}: HotelImageProps) {
  return (
    <div className={`hotel-image hotel-scene-${scene}`} role="img" aria-label={`Illustrated ${propertyType.toLowerCase()} landscape`}>
      <div className="hotel-image-fallback" aria-hidden="true">
        <span className="hotel-sun" />
        <span className="hotel-landscape" />
      </div>
      <span className="property-type">{propertyType}</span>
      <span className="sample-listing">Illustrative image</span>
    </div>
  );
}
