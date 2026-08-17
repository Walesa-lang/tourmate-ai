import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "TourMate AI",
    short_name: "TourMate",
    description: "A smart travel companion for planning trips, exploring destinations, and keeping travel ideas together.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#f7fbff",
    theme_color: "#102f56",
    icons: [
      { src: "/icons/tourmate-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/tourmate-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/tourmate-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
