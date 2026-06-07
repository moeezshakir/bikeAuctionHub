"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { HiChevronLeft, HiChevronRight, HiXMark } from "react-icons/hi2";
import { AUCTION_PLACEHOLDER_IMAGE } from "@/lib/auctionImages";

function LightboxImage({ alt, className, src }) {
  const [activeSrc, setActiveSrc] = useState(src);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setActiveSrc(src);
    setLoaded(false);
  }, [src]);

  return (
    <>
      {!loaded ? <div className="lightbox-image-loader" aria-hidden="true" /> : null}
      <img
        alt={alt}
        className={`${className}${loaded ? " is-loaded" : ""}`}
        decoding="async"
        onError={() => {
          setActiveSrc(AUCTION_PLACEHOLDER_IMAGE);
          setLoaded(true);
        }}
        onLoad={() => setLoaded(true)}
        src={activeSrc}
      />
    </>
  );
}

export function ImageLightbox({ images, index, onClose, onChangeIndex, title = "Image preview" }) {
  const isOpen = index >= 0 && images.length > 0;
  const safeIndex = isOpen ? Math.min(index, images.length - 1) : 0;
  const src = isOpen ? images[safeIndex] : "";

  const goNext = useCallback(() => {
    onChangeIndex((current) => (current + 1) % images.length);
  }, [images.length, onChangeIndex]);

  const goPrev = useCallback(() => {
    onChangeIndex((current) => (current - 1 + images.length) % images.length);
  }, [images.length, onChangeIndex]);

  useEffect(() => {
    if (!isOpen) return undefined;

    function onKeyDown(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
      if (event.key === "ArrowRight") {
        event.preventDefault();
        goNext();
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        goPrev();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, goNext, goPrev, onClose]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  if (!isOpen || typeof document === "undefined") return null;

  return createPortal(
    <div className="lightbox-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label={title}>
      <div className="lightbox-shell" onClick={(event) => event.stopPropagation()}>
        <div className="lightbox-toolbar">
          <div className="lightbox-title-wrap">
            <strong>{title}</strong>
            <span>
              {safeIndex + 1} / {images.length}
            </span>
          </div>
          <button aria-label="Close preview" className="lightbox-close" onClick={onClose} type="button">
            <HiXMark />
          </button>
        </div>

        <div className="lightbox-stage">
          {images.length > 1 ? (
            <button aria-label="Previous image" className="lightbox-nav" onClick={goPrev} type="button">
              <HiChevronLeft />
            </button>
          ) : (
            <span className="lightbox-nav-spacer" />
          )}

          <div className="lightbox-image-frame">
            <LightboxImage alt={`${title} ${safeIndex + 1}`} className="lightbox-image" src={src} />
          </div>

          {images.length > 1 ? (
            <button aria-label="Next image" className="lightbox-nav" onClick={goNext} type="button">
              <HiChevronRight />
            </button>
          ) : (
            <span className="lightbox-nav-spacer" />
          )}
        </div>

        {images.length > 1 ? (
          <div className="lightbox-thumbs">
            {images.map((thumb, thumbIndex) => (
              <button
                aria-label={`Show image ${thumbIndex + 1}`}
                aria-current={thumbIndex === safeIndex}
                className={thumbIndex === safeIndex ? "lightbox-thumb active" : "lightbox-thumb"}
                key={`${thumbIndex}-${String(thumb).slice(0, 48)}`}
                onClick={() => onChangeIndex(thumbIndex)}
                type="button"
              >
                <LightboxImage alt="" className="lightbox-thumb-img" src={thumb} />
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>,
    document.body
  );
}
