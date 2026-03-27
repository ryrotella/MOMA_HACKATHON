"use client";

import { useState } from "react";
import Image, { type ImageProps } from "next/image";

interface ArtworkImageProps extends Omit<ImageProps, "onError"> {
  fallbackClassName?: string;
}

/**
 * Next.js Image wrapper with a styled placeholder fallback when the image fails to load.
 */
export default function ArtworkImage({
  alt,
  className,
  fallbackClassName,
  ...props
}: ArtworkImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gray-200 text-gray-400 ${fallbackClassName ?? className ?? ""}`}
      >
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mb-1"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
        <span className="text-[10px] font-medium leading-tight text-center px-2">
          {alt || "Image"}
        </span>
      </div>
    );
  }

  return (
    <Image
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
      {...props}
    />
  );
}

/**
 * Native img wrapper with the same placeholder fallback.
 * Use where Next.js Image isn't needed (e.g. external URLs without domain config).
 */
export function ArtworkImg({
  alt,
  className,
  fallbackClassName,
  src,
  ...props
}: React.ImgHTMLAttributes<HTMLImageElement> & { fallbackClassName?: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gray-200 text-gray-400 ${fallbackClassName ?? className ?? ""}`}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mb-0.5"
        >
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
        <span className="text-[10px] font-medium leading-tight text-center px-1">
          {alt || "Image"}
        </span>
      </div>
    );
  }

  return (
    <img
      alt={alt}
      className={className}
      src={src}
      onError={() => setFailed(true)}
      {...props}
    />
  );
}
