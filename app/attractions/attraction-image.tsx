type AttractionImageProps = {
  scene: string;
};

export default function AttractionImage({ scene }: AttractionImageProps) {
  return (
    <div className={`attraction-image attraction-scene-${scene}`} role="img" aria-label="Illustrated Namibia activity landscape">
      <div className="attraction-image-fallback" aria-hidden="true">
        <span className="attraction-fallback-sun" />
        <span className="attraction-fallback-land" />
      </div>
      <span className="attraction-sample-label">Illustrative image</span>
    </div>
  );
}
