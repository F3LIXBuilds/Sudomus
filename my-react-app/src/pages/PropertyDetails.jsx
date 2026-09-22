import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Navbar from '../components/Navbar';
import { PropertyCard } from '../components/properties/PropertyCard';
import { listingsService } from '../services/api';
import { 
  Heart, MapPin, Bed, Bath, Compass, Mail, User, Send, 
  ArrowLeft, ChevronLeft, ChevronRight, X, Calendar, 
  Car, ShieldCheck, CheckCircle2, Maximize, Clock, ShieldAlert,
  Building2, ExternalLink
} from 'lucide-react';
import { getListingVerification } from '../lib/verification';
import './PropertyDetails.css';

const DEFAULT_FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80';

export default function PropertyDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const [isFavorited, setIsFavorited] = useState(false);
  const [isTogglingFav, setIsTogglingFav] = useState(false);

  // Contact form state
  const [contactName, setContactName] = useState(user?.name || '');
  const [contactEmail, setContactEmail] = useState(user?.email || '');
  const [contactMessage, setContactMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [contactSuccess, setContactSuccess] = useState('');
  const [contactError, setContactError] = useState('');

  const [relatedListings, setRelatedListings] = useState([]);
  const recordedListingIdRef = React.useRef(null);

  // Record view strictly once per listing ID view session
  useEffect(() => {
    if (id && recordedListingIdRef.current !== id) {
      recordedListingIdRef.current = id;
      listingsService.recordView(id).catch((err) => {
        console.warn('Could not record view:', err);
      });
    }
  }, [id]);

  // Fetch listing details on mount or ID change
  useEffect(() => {
    let isMounted = true;
    const fetchDetails = async () => {
      setLoading(true);
      setError('');
      try {
        // 1. Fetch listing details
        const data = await listingsService.getListingDetails(id);
        if (!isMounted) return;
        setListing(data);

        // Determine cover index
        if (data.images && data.images.length > 0) {
          const coverIdx = data.images.findIndex((img) => img.is_cover);
          setActiveImageIndex(coverIdx >= 0 ? coverIdx : 0);
        } else {
          setActiveImageIndex(0);
        }

        // 2. Check favorited status ONLY if user is logged in
        if (user) {
          try {
            const favRes = await listingsService.checkIsFavorited(id);
            if (isMounted) setIsFavorited(Boolean(favRes?.favorited));
          } catch (err) {
            console.warn('Could not check favorite status:', err);
          }
        }

        // 4. Fetch related listings (same property type or other published listings)
        try {
          const allListings = await listingsService.getAllListings();
          if (isMounted) {
            const related = (Array.isArray(allListings) ? allListings : allListings?.listings || [])
              .filter((item) => item.id !== id && item.property_type === data.property_type)
              .slice(0, 3);
            setRelatedListings(related);
          }
        } catch (err) {
          console.warn('Could not fetch related properties:', err);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Property details not found or could not be loaded.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchDetails();
    return () => {
      isMounted = false;
    };
  }, [id, user]);

  // Sync user details to contact form if auth state changes
  useEffect(() => {
    if (user) {
      if (!contactName && user.name) setContactName(user.name);
      if (!contactEmail && user.email) setContactEmail(user.email);
    }
  }, [user]);

  // Gallery Navigation
  const images = (listing?.images && listing.images.length > 0)
    ? listing.images.map((img) => img.image_url)
    : (listing?.image_url ? [listing.image_url] : [DEFAULT_FALLBACK_IMAGE]);

  const handlePrev = (e) => {
    if (e) e.stopPropagation();
    setActiveImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = (e) => {
    if (e) e.stopPropagation();
    setActiveImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  // Keyboard navigation for lightbox
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isLightboxOpen) return;
      if (e.key === 'Escape') setIsLightboxOpen(false);
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen, images.length]);

  // Favorites toggle
  const handleFavoriteToggle = async () => {
    if (!user) {
      alert('Please log in to save this property to your favorites.');
      navigate('/login');
      return;
    }
    if (isTogglingFav) return;

    try {
      setIsTogglingFav(true);
      const nextState = !isFavorited;
      setIsFavorited(nextState); // optimistic update
      const res = await listingsService.toggleFavorite(id);
      setIsFavorited(Boolean(res.favorited));
    } catch {
      setIsFavorited(!isFavorited); // rollback on error
      alert('Unable to update favorite status. Please try again.');
    } finally {
      setIsTogglingFav(false);
    }
  };

  // Contact Agent Submission
  const handleContactAgent = async (e) => {
    e.preventDefault();
    setContactSuccess('');
    setContactError('');

    if (!contactMessage.trim()) {
      setContactError('Please enter a message for the agent.');
      return;
    }

    setIsSending(true);
    try {
      const res = await listingsService.sendInquiry(id, {
        name: contactName,
        email: contactEmail,
        message: contactMessage.trim()
      });

      setContactSuccess(
        res?.message || 'Thank you! Your inquiry has been forwarded to the listing agent. They will reach out to you shortly.'
      );
      setContactMessage('');
    } catch (err) {
      setContactError(err.message || 'Failed to send inquiry. Please try again later.');
    } finally {
      setIsSending(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="property-details-loading-container">
          <div className="loader"></div>
          <p>Loading property details...</p>
        </div>
      </>
    );
  }

  if (error || !listing) {
    return (
      <>
        <Navbar />
        <div className="property-details-error-container">
          <h2>Property Not Available</h2>
          <p>{error || 'This listing does not exist or has been removed.'}</p>
          <button onClick={() => navigate('/properties')} className="back-btn">
            Browse All Properties
          </button>
        </div>
      </>
    );
  }

  // Safe numeric price in Naira
  const numericPrice = listing.price !== undefined && listing.price !== null ? Number(listing.price) : null;
  const formattedPrice = numericPrice !== null && !isNaN(numericPrice)
    ? numericPrice.toLocaleString()
    : (listing.price || '0');

  // Formatted listing date
  const formattedDate = listing.created_at
    ? new Date(listing.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : null;

  // Compute listing verification status
  const listingVerification = getListingVerification(listing);

  // Check valid coordinates
  const hasValidCoordinates =
    listing.latitude !== null &&
    listing.latitude !== undefined &&
    listing.longitude !== null &&
    listing.longitude !== undefined &&
    !isNaN(Number(listing.latitude)) &&
    !isNaN(Number(listing.longitude)) &&
    Number(listing.latitude) !== 0 &&
    Number(listing.longitude) !== 0;

  const lat = Number(listing.latitude);
  const lon = Number(listing.longitude);

  return (
    <>
      <Navbar />
      <div className="property-details-page">
        {/* Top Navigation Bar */}
        <div className="top-navigation-bar">
          <button onClick={() => navigate(-1)} className="nav-back-button" aria-label="Go back">
            <ArrowLeft size={18} /> Back to Search
          </button>
          <button 
            type="button"
            className={`save-property-btn ${isFavorited ? 'favorited' : ''}`}
            onClick={handleFavoriteToggle}
            aria-label={isFavorited ? 'Remove from favorites' : 'Save property'}
          >
            <Heart size={18} fill={isFavorited ? '#ef4444' : 'none'} color={isFavorited ? '#ef4444' : 'currentColor'} />
            <span>{isFavorited ? 'Saved to Favorites' : 'Save Property'}</span>
          </button>
        </div>

        {/* Gallery Section */}
        <div className="details-gallery-section">
          <div 
            className="main-image-viewport" 
            onClick={() => setIsLightboxOpen(true)}
            title="Click to view full screen"
          >
            <img 
              src={images[activeImageIndex]} 
              alt={listing.title || 'Property'} 
              className="main-gallery-image"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = DEFAULT_FALLBACK_IMAGE;
              }}
            />
            {images.length > 1 && (
              <>
                <button 
                  type="button"
                  className="gallery-control-btn prev-btn" 
                  onClick={handlePrev} 
                  aria-label="Previous image"
                >
                  <ChevronLeft size={24} />
                </button>
                <button 
                  type="button"
                  className="gallery-control-btn next-btn" 
                  onClick={handleNext} 
                  aria-label="Next image"
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}
            <div className="gallery-counter">
              {activeImageIndex + 1} / {images.length}
            </div>
            <div className="gallery-expand-hint">
              <Maximize size={15} /> Click to expand
            </div>
          </div>

          {/* Thumbnails strip */}
          {images.length > 1 && (
            <div className="thumbnails-grid">
              {images.map((img, idx) => (
                <button 
                  key={idx}
                  type="button"
                  className={`thumbnail-btn ${idx === activeImageIndex ? 'active' : ''}`}
                  onClick={() => setActiveImageIndex(idx)}
                  aria-label={`View photo ${idx + 1}`}
                >
                  <img 
                    src={img} 
                    alt={`Thumbnail ${idx + 1}`} 
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = DEFAULT_FALLBACK_IMAGE;
                    }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Lightbox Modal */}
        {isLightboxOpen && (
          <div className="lightbox-overlay" onClick={() => setIsLightboxOpen(false)}>
            <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
              <button 
                type="button"
                className="lightbox-close-btn"
                onClick={() => setIsLightboxOpen(false)}
                aria-label="Close full-screen view"
              >
                <X size={26} />
              </button>
              <img 
                src={images[activeImageIndex]} 
                alt={listing.title} 
                className="lightbox-image" 
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = DEFAULT_FALLBACK_IMAGE;
                }}
              />
              {images.length > 1 && (
                <>
                  <button 
                    type="button"
                    className="lightbox-nav-btn prev-btn" 
                    onClick={handlePrev}
                    aria-label="Previous image"
                  >
                    <ChevronLeft size={32} />
                  </button>
                  <button 
                    type="button"
                    className="lightbox-nav-btn next-btn" 
                    onClick={handleNext}
                    aria-label="Next image"
                  >
                    <ChevronRight size={32} />
                  </button>
                </>
              )}
              <div className="lightbox-counter">
                {activeImageIndex + 1} of {images.length}
              </div>
            </div>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="details-content-grid">
          
          {/* Left Column: Specifications & Description */}
          <div className="details-left-column">
            
            {/* Header Box */}
            <div className="details-header-box">
              <div className="details-badges-row">
                {listingVerification && (
                  <span className={`type-badge badge-verification ${listingVerification.badgeClass}`} title={listingVerification.description}>
                    {listingVerification.status === 'verified' && <ShieldCheck size={13} className="badge-inline-icon" />}
                    {listingVerification.status === 'pending' && <Clock size={13} className="badge-inline-icon" />}
                    {listingVerification.status === 'unverified' && <ShieldAlert size={13} className="badge-inline-icon" />}
                    <span>{listingVerification.label}</span>
                  </span>
                )}
                {listing.property_type && (
                  <span className="type-badge badge-property-type">
                    {listing.property_type}
                  </span>
                )}
                {listing.listing_type && (
                  <span className={`type-badge badge-${listing.listing_type}`}>
                    {listing.listing_type === 'rent' ? 'For Rent' : 'For Sale'}
                  </span>
                )}
                {listing.status && listing.status !== 'published' && (
                  <span className={`type-badge badge-status status-${listing.status}`}>
                    {listing.status.replace('_', ' ')}
                  </span>
                )}
              </div>

              <h1 className="property-main-title">{listing.title}</h1>
              
              <div className="location-tag">
                <MapPin size={18} className="location-tag-icon" />
                <span>
                  {[listing.address, listing.city, listing.state, listing.country].filter(Boolean).join(', ')}
                </span>
              </div>

              {/* Strict ₦ Naira price */}
              <div className="property-main-price">₦{formattedPrice}</div>

              <div className="property-meta-tags-row">
                {formattedDate && (
                  <div className="listing-date-tag">
                    <Calendar size={15} />
                    <span>Listed on {formattedDate}</span>
                  </div>
                )}
                <div className="listing-compliance-tag" title={listingVerification.description}>
                  <ShieldCheck size={14} className="compliance-icon" />
                  <span>Compliance: {listingVerification.label}</span>
                </div>
              </div>
            </div>

            {/* Key Features Bar */}
            <div className="key-features-bar">
              <div className="key-feature-item">
                <Bed size={22} className="property-feature-icon" />
                <div>
                  <span className="feature-val">{listing.bedrooms ?? 0}</span>
                  <span className="feature-lbl">Bedrooms</span>
                </div>
              </div>

              <div className="key-feature-item">
                <Bath size={22} className="property-feature-icon" />
                <div>
                  <span className="feature-val">{listing.bathrooms ?? 0}</span>
                  <span className="feature-lbl">Bathrooms</span>
                </div>
              </div>

              {listing.toilets !== undefined && listing.toilets !== null && Number(listing.toilets) > 0 && (
                <div className="key-feature-item">
                  <Bath size={22} className="property-feature-icon" />
                  <div>
                    <span className="feature-val">{listing.toilets}</span>
                    <span className="feature-lbl">Toilets</span>
                  </div>
                </div>
              )}

              {listing.parking_spaces !== undefined && listing.parking_spaces !== null && Number(listing.parking_spaces) > 0 && (
                <div className="key-feature-item">
                  <Car size={22} className="property-feature-icon" />
                  <div>
                    <span className="feature-val">{listing.parking_spaces}</span>
                    <span className="feature-lbl">Parking</span>
                  </div>
                </div>
              )}

              <div className="key-feature-item">
                <Compass size={22} className="property-feature-icon" />
                <div>
                  <span className="feature-val">{listing.land_size ? Number(listing.land_size).toLocaleString() : '0'}</span>
                  <span className="feature-lbl">sq ft</span>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="details-section-container">
              <h2>About this property</h2>
              <p className="details-description-text">
                {listing.description || 'No detailed description has been provided for this property.'}
              </p>
            </div>

            {/* Amenities & Features */}
            {listing.features && listing.features.length > 0 && (
              <div className="details-section-container">
                <h2>Features & Amenities</h2>
                <div className="features-chips-container">
                  {listing.features.map((feature, idx) => (
                    <span key={idx} className="feature-chip">
                      <CheckCircle2 size={16} className="feature-check-icon" /> {feature}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Location & Map Section */}
            <div className="details-section-container">
              <h2>Property Location</h2>
              {hasValidCoordinates ? (
                <div className="map-embed-wrapper">
                  <iframe
                    title="Property Location Map"
                    width="100%"
                    height="320"
                    style={{ border: 0, borderRadius: '12px', display: 'block' }}
                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${lon - 0.01}%2C${lat - 0.01}%2C${lon + 0.01}%2C${lat + 0.01}&layer=mapnik&marker=${lat}%2C${lon}`}
                    loading="lazy"
                  />
                  <div className="map-embed-footer">
                    <MapPin size={15} />
                    <span>Coordinates: {lat.toFixed(4)}, {lon.toFixed(4)}</span>
                    <a 
                      href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=16/${lat}/${lon}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="osm-link"
                    >
                      View Larger Map ↗
                    </a>
                  </div>
                </div>
              ) : (
                <div className="textual-location-card">
                  <div className="textual-location-icon">
                    <MapPin size={32} />
                  </div>
                  <div className="textual-location-info">
                    <h3>{listing.city || 'City'}, {listing.state || 'State'}</h3>
                    <p className="full-address">{listing.address || 'Address details available on request'}</p>
                    <p className="country-label">{listing.country || 'Nigeria'}</p>
                    <span className="location-verified-tag">
                      <ShieldCheck size={14} /> Verified Marketplace Address
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Contact Agent Card */}
          <div className="details-right-column">
            <div className="sticky-agent-card">
              {/* Agent info */}
              <div className="agent-card-header">
                <div className="agent-avatar-placeholder">
                  {listing.agent_avatar ? (
                    <img 
                      src={listing.agent_avatar} 
                      alt={listing.agent_name || 'Agent'} 
                      className="agent-avatar-image"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.style.display = 'none';
                      }}
                    />
                  ) : (
                    listing.agent_name ? listing.agent_name[0].toUpperCase() : 'A'
                  )}
                </div>
                <div className="agent-info-text">
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {listing.agent_name || 'Listing Consultant'}
                    {listing.agent_verified && (
                      <ShieldCheck size={18} color="#10b981" title="Verified Agent" />
                    )}
                  </h3>
                  {listing.agent_verified ? (
                    <span className="agent-role-label verified">
                      <ShieldCheck size={13} /> Verified {listing.agent_role === 'seller' ? 'Seller' : 'Agent'}
                    </span>
                  ) : (
                    <span className="agent-role-label standard">
                      <User size={13} /> {listing.agent_role === 'seller' ? 'Seller' : 'Agent'}
                    </span>
                  )}
                </div>
              </div>

              <div className="agent-contact-details">
                <div className="contact-detail-line">
                  <Building2 size={15} className="contact-icon" />
                  <span>{listing.agent_listings_count || 1} {listing.agent_listings_count === 1 ? 'Property Listed' : 'Properties Listed'}</span>
                </div>
                <div className="contact-detail-line">
                  <Mail size={15} className="contact-icon" />
                  <span>{listing.agent_email || 'inquiries@sudomus.com'}</span>
                </div>
                {listing.user_id && (
                  <Link to={`/agents/${listing.user_id}`} className="view-agent-profile-link">
                    <span>View Agent Profile & Listings</span>
                    <ExternalLink size={13} />
                  </Link>
                )}
              </div>

              <div className="agent-form-divider" />

              {/* Inquiry Form */}
              <form className="agent-contact-form" onSubmit={handleContactAgent}>
                <h4>Contact Agent</h4>
                <p className="agent-form-caption">
                  Send an inquiry directly regarding {listing.title}.
                </p>

                <div className="form-group-field">
                  <label htmlFor="contact-name">Your Name</label>
                  <div className="input-with-icon">
                    <User size={16} className="field-icon" />
                    <input
                      id="contact-name"
                      type="text"
                      placeholder="Full Name"
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group-field">
                  <label htmlFor="contact-email">Your Email</label>
                  <div className="input-with-icon">
                    <Mail size={16} className="field-icon" />
                    <input
                      id="contact-email"
                      type="email"
                      placeholder="you@example.com"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group-field">
                  <label htmlFor="contact-message">Message</label>
                  <textarea 
                    id="contact-message"
                    placeholder="Hi, I am interested in this property and would like to schedule an inspection or receive more details..."
                    value={contactMessage}
                    onChange={(e) => setContactMessage(e.target.value)}
                    rows={4}
                    required
                  ></textarea>
                </div>

                {contactSuccess && (
                  <div className="form-success-banner">
                    <CheckCircle2 size={16} /> {contactSuccess}
                  </div>
                )}

                {contactError && (
                  <div className="form-error-banner">
                    {contactError}
                  </div>
                )}

                <button type="submit" className="contact-submit-btn" disabled={isSending}>
                  {isSending ? (
                    'Sending Message...'
                  ) : (
                    <>
                      <Send size={16} /> Send Inquiry
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

        </div>

        {/* Related Properties */}
        {relatedListings.length > 0 && (
          <div className="related-properties-section">
            <div className="related-header">
              <h2 className="related-section-title">Similar Properties</h2>
              <Link to="/properties" className="see-all-link">
                View all available →
              </Link>
            </div>
            <div className="related-properties-grid">
              {relatedListings.map((related) => (
                <PropertyCard key={related.id} property={related} />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
