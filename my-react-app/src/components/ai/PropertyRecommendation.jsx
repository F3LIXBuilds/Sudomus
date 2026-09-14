import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import "../../styles/ai/PropertyRecommendation.css";

const DEFAULT_FALLBACK_IMAGE =
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=800&q=80";

function formatPrice(price, currency = "NGN", listingType = "") {
  if (price === null || price === undefined || price === "") {
    return "Price on request";
  }
  const numeric = Number(price);
  if (Number.isNaN(numeric)) {
    return `₦${price}`;
  }
  const formatted = new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: currency || "NGN",
    maximumFractionDigits: 0,
  }).format(numeric);

  return listingType === "rent" ? `${formatted} / year` : formatted;
}

export default function PropertyRecommendation({ property }) {
  const navigate = useNavigate();
  const initialImage = property?.image || property?.image_url || DEFAULT_FALLBACK_IMAGE;
  const [imgSrc, setImgSrc] = useState(initialImage);

  if (!property) return null;

  const {
    id,
    title = "Property Listing",
    location,
    city,
    state,
    price,
    currency = "NGN",
    listingType,
    listing_type,
    propertyType,
    property_type,
    bedrooms,
    bathrooms,
    description,
    verified,
    is_verified,
  } = property;

  const effectiveListingType = listingType || listing_type || "";
  const effectivePropertyType = propertyType || property_type || "";
  const effectiveVerified = Boolean(verified || is_verified);
  const displayLocation = location || [city, state].filter(Boolean).join(", ") || "Nigeria";

  const handleClick = () => {
    if (id) {
      navigate(`/properties/${id}`);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleClick();
    }
  };

  return (
    <article
      className="property-card"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="button"
      aria-label={`View details for ${title}`}
    >
      <div className="property-card__image-wrap">
        <img
          className="property-card__image"
          src={imgSrc}
          alt={title}
          loading="lazy"
          onError={() => setImgSrc(DEFAULT_FALLBACK_IMAGE)}
        />
        <div className="property-card__badges-group">
          {effectiveVerified && (
            <span className="property-card__badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <ShieldCheck size={12} /> Verified
            </span>
          )}
          {effectiveListingType && (
            <span className="property-card__type-badge">
              {effectiveListingType === "rent" ? "Rent" : "Sale"}
            </span>
          )}
        </div>
      </div>

      <div className="property-card__body">
        <div className="property-card__type-label">
          {effectivePropertyType ? effectivePropertyType.toUpperCase() : "LISTING"}
        </div>
        <h3 className="property-card__title">{title}</h3>
        <p className="property-card__location">{displayLocation}</p>
        <p className="property-card__price">
          {formatPrice(price, currency, effectiveListingType)}
        </p>

        {(bedrooms !== null && bedrooms !== undefined || bathrooms !== null && bathrooms !== undefined) && (
          <div className="property-card__meta">
            {bedrooms !== null && bedrooms !== undefined && (
              <span>{bedrooms} {bedrooms === 1 ? "Bed" : "Beds"}</span>
            )}
            {bedrooms !== null && bedrooms !== undefined && bathrooms !== null && bathrooms !== undefined && (
              <span className="property-card__meta-dot" />
            )}
            {bathrooms !== null && bathrooms !== undefined && (
              <span>{bathrooms} {bathrooms === 1 ? "Bath" : "Baths"}</span>
            )}
          </div>
        )}

        {description && <p className="property-card__description">{description}</p>}

        <button
          type="button"
          className="property-card__cta"
          onClick={(e) => {
            e.stopPropagation();
            handleClick();
          }}
        >
          View property
        </button>
      </div>
    </article>
  );
}
