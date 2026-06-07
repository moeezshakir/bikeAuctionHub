"use client";

import { useEffect, useMemo, useState } from "react";
import { HiMagnifyingGlassPlus } from "react-icons/hi2";
import { ImageLightbox } from "@/components/ridehub/ImageLightbox";
import { AUCTION_PLACEHOLDER_IMAGE, resolveAuctionImageSet } from "@/lib/auctionImages";

function filePreviewKey(file, index) {
  return `${index}-${file.name}-${file.size}-${file.lastModified}`;
}

function GalleryImage({ alt, src, className }) {
  const [activeSrc, setActiveSrc] = useState(src);

  useEffect(() => {
    setActiveSrc(src || AUCTION_PLACEHOLDER_IMAGE);
  }, [src]);

  return (
    <img
      alt={alt}
      className={className}
      decoding="async"
      loading="lazy"
      onError={(event) => {
        event.currentTarget.onerror = null;
        setActiveSrc(AUCTION_PLACEHOLDER_IMAGE);
      }}
      src={activeSrc || AUCTION_PLACEHOLDER_IMAGE}
    />
  );
}

function GalleryThumbButton({ alt, index, onOpen, src }) {
  return (
    <button className="auction-gallery-thumb" onClick={() => onOpen(index)} type="button">
      <GalleryImage alt={alt} className="auction-gallery-thumb-img" src={src} />
    </button>
  );
}

export function AuctionGallery({ slot, label = "Auction photos", size = "large" }) {
  const [lightboxIndex, setLightboxIndex] = useState(-1);
  const images = useMemo(() => resolveAuctionImageSet(slot), [slot]);
  const [hero, ...rest] = images;

  return (
    <>
      <div className={`auction-gallery-panel ${size === "large" ? "auction-gallery-panel-lg" : ""}`}>
        <button className="auction-gallery-hero" onClick={() => setLightboxIndex(0)} type="button">
          <GalleryImage alt={label} className="auction-gallery-hero-img" src={hero} />
          <span className="gallery-zoom-hint">
            <HiMagnifyingGlassPlus /> Click to preview
          </span>
        </button>
        {rest.length ? (
          <div className="auction-gallery-thumbs">
            {rest.map((src, index) => (
              <GalleryThumbButton
                alt={`${label} ${index + 2}`}
                index={index + 1}
                key={`${src}-${index}`}
                onOpen={setLightboxIndex}
                src={src}
              />
            ))}
          </div>
        ) : null}
      </div>
      <ImageLightbox
        images={images}
        index={lightboxIndex}
        onChangeIndex={setLightboxIndex}
        onClose={() => setLightboxIndex(-1)}
        title={label}
      />
    </>
  );
}

export function LocalImagePreviewGrid({ files, label = "Upload preview" }) {
  const [lightboxIndex, setLightboxIndex] = useState(-1);

  const previews = useMemo(
    () =>
      files.map((file, index) => ({
        key: filePreviewKey(file, index),
        url: URL.createObjectURL(file),
      })),
    [files]
  );

  useEffect(() => {
    return () => {
      previews.forEach((entry) => URL.revokeObjectURL(entry.url));
    };
  }, [previews]);

  useEffect(() => {
    if (lightboxIndex >= previews.length) {
      setLightboxIndex(previews.length ? previews.length - 1 : -1);
    }
  }, [lightboxIndex, previews.length]);

  if (!previews.length) return null;

  const urls = previews.map((entry) => entry.url);
  const [hero, ...rest] = urls;

  return (
    <>
      <div className="auction-gallery-panel auction-gallery-panel-lg upload-preview-panel">
        <p className="section-kicker">{label}</p>
        <button className="auction-gallery-hero upload-preview-hero" onClick={() => setLightboxIndex(0)} type="button">
          <img alt={`${label} main`} className="auction-gallery-hero-img" src={hero} />
          <span className="gallery-zoom-hint">
            <HiMagnifyingGlassPlus /> Preview uploads
          </span>
        </button>
        {rest.length ? (
          <div className="auction-gallery-thumbs upload-preview-thumbs">
            {rest.map((src, index) => (
              <button
                className="auction-gallery-thumb"
                key={previews[index + 1]?.key || src}
                onClick={() => setLightboxIndex(index + 1)}
                type="button"
              >
                <img alt={`Preview ${index + 2}`} className="auction-gallery-thumb-img" src={src} />
              </button>
            ))}
          </div>
        ) : null}
      </div>
      <ImageLightbox
        images={urls}
        index={lightboxIndex}
        onChangeIndex={setLightboxIndex}
        onClose={() => setLightboxIndex(-1)}
        title={label}
      />
    </>
  );
}
