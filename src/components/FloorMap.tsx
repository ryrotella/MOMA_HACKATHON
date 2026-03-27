"use client";

import { useEffect, useState, useCallback } from "react";
import { MapContainer, ImageOverlay, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import Link from "next/link";
import { useStore } from "@/store/useStore";
import artworks from "@/data/artworks.json";
import galleriesData from "@/data/galleries.json";

// Group artworks by gallery
function getArtworksByGallery(floor: number) {
  const grouped: Record<string, typeof artworks> = {};
  for (const artwork of artworks) {
    if (artwork.floor === floor) {
      if (!grouped[artwork.gallery]) grouped[artwork.gallery] = [];
      grouped[artwork.gallery].push(artwork);
    }
  }
  return grouped;
}

function createGalleryIcon(count: number, hasBookmark: boolean, isIsometric: boolean) {
  const size = count > 1 ? 32 : 26;
  // In isometric mode, counter-rotate pins so they face the camera
  const isoStyle = isIsometric
    ? "transform: rotateZ(10deg) rotateX(-45deg); transform-style: preserve-3d;"
    : "";
  return L.divIcon({
    className: "",
    html: `<div class="gallery-pin ${hasBookmark ? "has-bookmark" : ""}" style="width:${size}px;height:${size}px;font-size:${count > 1 ? 12 : 10}px;${isoStyle}">${count > 1 ? count : "●"}</div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

/** Auto-fits map to content bounds on mount and floor change */
function MapController({ floor }: { floor: number }) {
  const map = useMap();

  const fitToContent = useCallback(() => {
    const floorKey = String(floor) as keyof typeof galleriesData.floors;
    const floorData = galleriesData.floors[floorKey];
    if (!floorData) return;

    // Calculate bounds of actual gallery content (with padding)
    const galleries = Object.values(floorData.galleries);
    if (galleries.length === 0) return;

    const xs = galleries.map((g) => g.x);
    const ys = galleries.map((g) => g.y);
    const padding = 60;

    const contentBounds = L.latLngBounds(
      [floorData.imageHeight - Math.max(...ys) - padding, Math.min(...xs) - padding],
      [floorData.imageHeight - Math.min(...ys) + padding, Math.max(...xs) + padding]
    );

    map.invalidateSize();
    // Slight delay to let container size settle
    setTimeout(() => {
      map.fitBounds(contentBounds, {
        animate: false,
        padding: [10, 10],
      });
    }, 50);
  }, [map, floor]);

  useEffect(() => {
    fitToContent();
  }, [fitToContent]);

  // Also fit on window resize
  useEffect(() => {
    const handler = () => {
      map.invalidateSize();
      fitToContent();
    };
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, [map, fitToContent]);

  return null;
}

export default function FloorMap({ isIsometric = false }: { isIsometric?: boolean }) {
  const { currentFloor, bookmarks, toggleBookmark, recordArtworkView, currentSession, startSession } = useStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50">
        <div className="animate-pulse text-gray-400">Loading map...</div>
      </div>
    );
  }

  const floorKey = String(currentFloor) as keyof typeof galleriesData.floors;
  const floorData = galleriesData.floors[floorKey];
  if (!floorData) return null;

  const bounds: L.LatLngBoundsExpression = [
    [0, 0],
    [floorData.imageHeight, floorData.imageWidth],
  ];

  const artworksByGallery = getArtworksByGallery(currentFloor);

  return (
    <MapContainer
      key={currentFloor}
      crs={L.CRS.Simple}
      bounds={bounds}
      maxBounds={L.latLngBounds([-50, -50], [floorData.imageHeight + 50, floorData.imageWidth + 50])}
      maxBoundsViscosity={0.8}
      style={{ width: "100%", height: "100%" }}
      zoomSnap={0.25}
      minZoom={-1}
      maxZoom={3}
      zoomControl={false}
      attributionControl={false}
      // Mobile-friendly touch handling
      dragging={true}
      touchZoom={true}
      scrollWheelZoom={true}
      doubleClickZoom={true}
      bounceAtZoomLimits={false}
    >
      <ImageOverlay url={`/floors/floor${currentFloor}.svg`} bounds={bounds} />
      <MapController floor={currentFloor} />

      {Object.entries(floorData.galleries).map(([galleryId, pos]) => {
        const galleryArtworks = artworksByGallery[galleryId];
        if (!galleryArtworks || galleryArtworks.length === 0) return null;

        const hasBookmark = galleryArtworks.some((a) => bookmarks.includes(a.id));
        const position: L.LatLngExpression = [
          floorData.imageHeight - pos.y,
          pos.x,
        ];

        return (
          <Marker
            key={galleryId}
            position={position}
            icon={createGalleryIcon(galleryArtworks.length, hasBookmark, isIsometric)}
          >
            <Popup maxWidth={280} minWidth={200}>
              <div className="p-3">
                <div className="text-[10px] font-bold text-gray-400 tracking-wider mb-2">
                  GALLERY {galleryId}
                </div>
                <div className="space-y-2.5">
                  {galleryArtworks.map((artwork) => (
                    <div key={artwork.id} className="flex items-center gap-2.5">
                      {/* Thumbnail */}
                      <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        {artwork.thumbnail?.includes("moma.org") ? (
                          <img
                            src={artwork.thumbnail}
                            alt=""
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-sm">🎨</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/artwork/${artwork.id}`}
                          className="text-[13px] font-semibold text-gray-900 hover:text-[var(--moma-red)] line-clamp-1 transition-colors"
                          onClick={() => {
                            if (!currentSession) startSession();
                            recordArtworkView(artwork.id, artwork.gallery, artwork.floor);
                          }}
                        >
                          {artwork.title}
                        </Link>
                        <p className="text-[11px] text-gray-500 line-clamp-1">
                          {artwork.artist}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleBookmark(artwork.id);
                        }}
                        className="flex-shrink-0 p-1"
                        aria-label={bookmarks.includes(artwork.id) ? "Remove bookmark" : "Add bookmark"}
                      >
                        {bookmarks.includes(artwork.id) ? (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--moma-red)" stroke="var(--moma-red)" strokeWidth="2">
                            <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
                          </svg>
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2">
                            <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
                          </svg>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}

      {/* Zoom controls - positioned for mobile (right side, middle) */}
      <div className="leaflet-top leaflet-right" style={{ pointerEvents: "auto" }}>
        <div className="flex flex-col gap-0.5 m-3 bg-white rounded-lg shadow-md overflow-hidden">
          <ZoomButton direction="in" />
          <ZoomButton direction="out" />
        </div>
      </div>
    </MapContainer>
  );
}

function ZoomButton({ direction }: { direction: "in" | "out" }) {
  const map = useMap();
  return (
    <button
      onClick={() => direction === "in" ? map.zoomIn() : map.zoomOut()}
      className="w-9 h-9 flex items-center justify-center text-lg font-bold text-gray-700 hover:bg-gray-100 transition-colors"
    >
      {direction === "in" ? "+" : "−"}
    </button>
  );
}
