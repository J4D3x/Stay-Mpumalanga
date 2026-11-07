
'use client';

import { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Expand,
  X,
} from 'lucide-react';

type ListingGalleryProps = {
  name: string;
  imageUrl: string | null;
  images: string[] | null;
};

const fallbackImage = '/placeholder-accommodation.jpg';

export function ListingGallery({
  name,
  imageUrl,
  images,
}: ListingGalleryProps) {
  const galleryImages = Array.from(
    new Set(
      [imageUrl, ...(images ?? [])].filter(
        (image): image is string =>
          typeof image === 'string' && image.trim().length > 0
      )
    )
  );

  const photos = galleryImages.length > 0
    ? galleryImages
    : [fallbackImage];

  const [activeIndex, setActiveIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  function previousImage() {
    setActiveIndex((current) =>
      current === 0 ? photos.length - 1 : current - 1
    );
  }

  function nextImage() {
    setActiveIndex((current) =>
      current === photos.length - 1 ? 0 : current + 1
    );
  }

  return (
    <>
      <section className="listingGallery">
        <div className="galleryMain">
          <img
            src={photos[activeIndex]}
            alt={`${name} - photo ${activeIndex + 1}`}
            onClick={() => setIsExpanded(true)}
          />

          {photos.length > 1 && (
            <>
              <button
                type="button"
                className="galleryArrow galleryPrevious"
                onClick={previousImage}
                aria-label="Previous image"
              >
                <ChevronLeft />
              </button>

              <button
                type="button"
                className="galleryArrow galleryNext"
                onClick={nextImage}
                aria-label="Next image"
              >
                <ChevronRight />
              </button>
            </>
          )}

          <button
            type="button"
            className="galleryExpand"
            onClick={() => setIsExpanded(true)}
            aria-label="View image full screen"
          >
            <Expand size={17} />
            View photos
          </button>

          <span className="galleryCounter">
            {activeIndex + 1} / {photos.length}
          </span>
        </div>

        {photos.length > 1 && (
          <div className="galleryThumbnails">
            {photos.map((photo, index) => (
              <button
                type="button"
                key={`${photo}-${index}`}
                className={`galleryThumbnail ${
                  activeIndex === index ? 'active' : ''
                }`}
                onClick={() => setActiveIndex(index)}
                aria-label={`View photo ${index + 1}`}
                aria-current={activeIndex === index ? 'true' : undefined}
              >
                <img src={photo} alt={`${name} thumbnail ${index + 1}`} />
              </button>
            ))}
          </div>
        )}
      </section>

      {isExpanded && (
        <div
          className="galleryLightbox"
          role="dialog"
          aria-modal="true"
          aria-label={`${name} photo gallery`}
          onClick={() => setIsExpanded(false)}
        >
          <button
            type="button"
            className="galleryClose"
            onClick={() => setIsExpanded(false)}
            aria-label="Close gallery"
          >
            <X />
          </button>

          {photos.length > 1 && (
            <button
              type="button"
              className="galleryArrow lightboxPrevious"
              onClick={(event) => {
                event.stopPropagation();
                previousImage();
              }}
              aria-label="Previous image"
            >
              <ChevronLeft />
            </button>
          )}

          <img
            src={photos[activeIndex]}
            alt={`${name} - photo ${activeIndex + 1}`}
            onClick={(event) => event.stopPropagation()}
          />

          {photos.length > 1 && (
            <button
              type="button"
              className="galleryArrow lightboxNext"
              onClick={(event) => {
                event.stopPropagation();
                nextImage();
              }}
              aria-label="Next image"
            >
              <ChevronRight />
            </button>
          )}

          <span className="lightboxCounter">
            {activeIndex + 1} / {photos.length}
          </span>
        </div>
      )}
    </>
  );
}
