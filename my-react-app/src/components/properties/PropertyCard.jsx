import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, MapPin, Bed, Bath, Maximize, ShieldCheck, Clock, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { listingsService } from '../../services/api';
import { getListingVerification } from '../../lib/verification';
import './PropertyCard.css';

export function PropertyCard({ property, onFavoriteChange }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isFavorited, setIsFavorited] = useState(Boolean(property?.is_favorited));
  const [isTogglingFav, setIsTogglingFav] = useState(false);

  if (!property) return null;

  // Resolve image URL: cover image first, then first available in images array, then image_url, then fallback
  let displayImage = 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=600&q=80';
  if (property.images && property.images.length > 0) {
    const cover = property.images.find(img => img.is_cover) || property.images[0];
    if (cover && cover.image_url) displayImage = cover.image_url;
  } else if (property.image_url) {
    displayImage = property.image_url;
  } else if (property.image && property.image !== '/api/placeholder/400/300') {
    displayImage = property.image;
  }

  // Format price safely (handles string or numeric types from PostgreSQL)
  const numericPrice = property.price !== undefined && property.price !== null ? Number(property.price) : null;
  const formattedPrice = numericPrice !== null && !isNaN(numericPrice)
    ? numericPrice.toLocaleString()
    : (property.price || '0');

  // Format location with fallback to city, state, address
  const locationText = property.location ||
    [property.address, property.city, property.state].filter(Boolean).join(', ') ||
    property.city ||
    property.state ||
    'Location not specified';

  // Format area with fallback to land_size
  const areaText = property.area || (property.land_size ? `${property.land_size} sq ft` : null);

  const bedroomsCount = property.bedrooms !== undefined && property.bedrooms !== null ? property.bedrooms : 0;
  const bathroomsCount = property.bathrooms !== undefined && property.bathrooms !== null ? property.bathrooms : 0;

  const handleFavoriteClick = async (e) => {
    e.stopPropagation();
    if (!user) {
      alert('Please log in to save properties to your favorites.');
      navigate('/login');
      return;
    }
    if (isTogglingFav) return;

    try {
      setIsTogglingFav(true);
      const nextState = !isFavorited;
      setIsFavorited(nextState); // optimistic update
      const res = await listingsService.toggleFavorite(property.id);
      setIsFavorited(res.favorited);
      if (onFavoriteChange) {
        onFavoriteChange(property.id, res.favorited);
      }
    } catch (err) {
      setIsFavorited(!isFavorited); // rollback on error
      console.error('Failed to toggle favorite:', err);
    } finally {
      setIsTogglingFav(false);
    }
  };

  const propertyTypeLabel = property.property_type
    ? property.property_type.charAt(0).toUpperCase() + property.property_type.slice(1)
    : null;

  const verification = getListingVerification(property);

  return (
    <div className="property-card" onClick={() => navigate(`/properties/${property.id}`)}>
      <div className="property-image-container">
        <img
          src={displayImage}
          alt={property.title || 'Property'}
          className="property-image"
          loading="lazy"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=600&q=80';
          }}
        />

        {/* Top Overlay Badges */}
        <div className="property-top-badges">
          {verification && (
            <span className={`property-badge ${verification.badgeClass}`} title={verification.description}>
              {verification.status === 'verified' && <ShieldCheck size={12} className="badge-inline-icon" />}
              {verification.status === 'pending' && <Clock size={12} className="badge-inline-icon" />}
              {verification.status === 'unverified' && <ShieldAlert size={12} className="badge-inline-icon" />}
              {verification.status === 'rejected' && <ShieldAlert size={12} className="badge-inline-icon" />}
              <span>{verification.shortLabel}</span>
            </span>
          )}
          {propertyTypeLabel && (
            <span className="property-badge type-badge">{propertyTypeLabel}</span>
          )}
          {property.listing_type && (
            <span className={`property-badge listing-badge badge-${property.listing_type}`}>
              {property.listing_type === 'rent' ? 'For Rent' : 'For Sale'}
            </span>
          )}
          {property.status && property.status !== 'published' && (
            <span className={`property-badge status-badge status-${property.status}`}>
              {property.status.replace('_', ' ')}
            </span>
          )}
        </div>

        {/* Favorite Button */}
        <button
          type="button"
          className={`property-card-fav-btn ${isFavorited ? 'active' : ''}`}
          onClick={handleFavoriteClick}
          aria-label={isFavorited ? 'Remove from favorites' : 'Save to favorites'}
        >
          <Heart size={18} fill={isFavorited ? '#ef4444' : 'none'} color={isFavorited ? '#ef4444' : '#ffffff'} />
        </button>

        {/* Price Tag */}
        <div className="property-price">₦{formattedPrice}</div>
      </div>

      <div className="property-content">
        <h3 className="property-title">{property.title || 'Untitled Property'}</h3>
        <p className="property-location">
          <MapPin size={15} className="location-pin-icon" />
          <span>{locationText}</span>
        </p>

        <div className="property-features">
          <span className="property-feature" title="Bedrooms">
            <Bed size={15} /> {bedroomsCount} Beds
          </span>
          <span className="property-feature" title="Bathrooms">
            <Bath size={15} /> {bathroomsCount} Baths
          </span>
          {areaText && (
            <span className="property-feature" title="Land size">
              <Maximize size={14} /> {areaText}
            </span>
          )}
        </div>

        <button 
          type="button"
          className="property-view-button"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/properties/${property.id}`);
          }}
        >
          View Details
        </button>
      </div>
    </div>
  );
}

