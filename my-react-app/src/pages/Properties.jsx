import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { listingsService } from '../services/api';
import { PropertyCard } from '../components/properties/PropertyCard';
import { Search, SlidersHorizontal, RotateCcw, Building2, Mail, Phone } from 'lucide-react';
import './Properties.css';

export default function Properties() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Initialize filters from URL params if present
  const [searchQuery, setSearchQuery] = useState(
    searchParams.get('search') || searchParams.get('location') || ''
  );
  const [propertyType, setPropertyType] = useState(searchParams.get('type') || '');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [sortBy, setSortBy] = useState(searchParams.get('sortBy') || 'newest');

  const [showFilters, setShowFilters] = useState(true);
  const [propertiesList, setPropertiesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all published listings once on mount
  useEffect(() => {
    let isMounted = true;
    const fetchProperties = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await listingsService.getAllListings();
        if (isMounted) {
          const list = Array.isArray(data) ? data : (data?.listings || []);
          setPropertiesList(list);
        }
      } catch (err) {
        console.error('Error fetching properties:', err);
        if (isMounted) {
          setError(err.message || 'Failed to load properties. Please make sure the server is running.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchProperties();
    return () => {
      isMounted = false;
    };
  }, []);

  // Sync state changes with URL parameters cleanly without reload
  useEffect(() => {
    const params = {};
    if (searchQuery.trim()) params.search = searchQuery.trim();
    if (propertyType) params.type = propertyType;
    if (minPrice) params.minPrice = minPrice;
    if (maxPrice) params.maxPrice = maxPrice;
    if (sortBy && sortBy !== 'newest') params.sortBy = sortBy;
    setSearchParams(params, { replace: true });
  }, [searchQuery, propertyType, minPrice, maxPrice, sortBy, setSearchParams]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setPropertyType('');
    setMinPrice('');
    setMaxPrice('');
    setSortBy('newest');
    setSearchParams({}, { replace: true });
  };

  const isFiltered = Boolean(searchQuery || propertyType || minPrice || maxPrice || sortBy !== 'newest');

  // Filter and sort listings
  const filteredProperties = useMemo(() => {
    let result = propertiesList.filter((property) => {
      // 1. Search query: city, state, address, or title
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesTitle = property.title && property.title.toLowerCase().includes(query);
        const matchesCity = property.city && property.city.toLowerCase().includes(query);
        const matchesState = property.state && property.state.toLowerCase().includes(query);
        const matchesAddress = property.address && property.address.toLowerCase().includes(query);
        if (!matchesTitle && !matchesCity && !matchesState && !matchesAddress) {
          return false;
        }
      }

      // 2. Property type filter: apartment, house, duplex, land, commercial, office
      if (propertyType && property.property_type !== propertyType) {
        return false;
      }

      // 3. Minimum price filter
      if (minPrice) {
        const numericMin = parseFloat(minPrice);
        if (!isNaN(numericMin) && parseFloat(property.price) < numericMin) {
          return false;
        }
      }

      // 4. Maximum price filter
      if (maxPrice) {
        const numericMax = parseFloat(maxPrice);
        if (!isNaN(numericMax) && parseFloat(property.price) > numericMax) {
          return false;
        }
      }

      return true;
    });

    // 5. Sorting
    result.sort((a, b) => {
      const priceA = parseFloat(a.price) || 0;
      const priceB = parseFloat(b.price) || 0;

      if (sortBy === 'price_asc') {
        return priceA - priceB;
      } else if (sortBy === 'price_desc') {
        return priceB - priceA;
      } else {
        // 'newest' default
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return dateB - dateA;
      }
    });

    return result;
  }, [propertiesList, searchQuery, propertyType, minPrice, maxPrice, sortBy]);

  return (
    <>
      <Navbar />
      <div className="properties-page">
        {/* Header Bar */}
        <div className="properties-header">
          <div>
            <h1 className="properties-title">Explore Properties</h1>
            <p className="properties-subtitle">
              Browse verified real-estate listings available on SuDomus.
            </p>
          </div>

          <button
            type="button"
            className="filter-toggle-btn"
            onClick={() => setShowFilters(!showFilters)}
            aria-label="Toggle filter controls"
          >
            <SlidersHorizontal size={18} />
            <span>{showFilters ? 'Hide Filters' : 'Show Filters'}</span>
          </button>
        </div>

        {/* Filter Controls Panel */}
        {showFilters && (
          <div className="filters-section-panel">
            <div className="filters-grid">
              {/* Omni-search: city, state, address, title */}
              <div className="filter-group search-filter-group">
                <label htmlFor="search-input">Search Location or Title</label>
                <div className="filter-input-icon-wrapper">
                  <Search size={18} className="input-icon" />
                  <input
                    id="search-input"
                    type="text"
                    placeholder="City, state, address, or property title..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="filter-input with-icon"
                  />
                </div>
              </div>

              {/* Property Type */}
              <div className="filter-group">
                <label htmlFor="property-type-select">Property Type</label>
                <select
                  id="property-type-select"
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value)}
                  className="filter-input filter-select"
                >
                  <option value="">All Property Types</option>
                  <option value="apartment">Apartment</option>
                  <option value="house">House</option>
                  <option value="duplex">Duplex</option>
                  <option value="land">Land</option>
                  <option value="commercial">Commercial</option>
                  <option value="office">Office</option>
                </select>
              </div>

              {/* Min Price */}
              <div className="filter-group">
                <label htmlFor="min-price-input">Min Price (₦)</label>
                <input
                  id="min-price-input"
                  type="text"
                  placeholder="e.g. 500,000"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value.replace(/[^0-9]/g, ''))}
                  className="filter-input"
                />
              </div>

              {/* Max Price */}
              <div className="filter-group">
                <label htmlFor="max-price-input">Max Price (₦)</label>
                <input
                  id="max-price-input"
                  type="text"
                  placeholder="e.g. 50,000,000"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value.replace(/[^0-9]/g, ''))}
                  className="filter-input"
                />
              </div>

              {/* Sorting */}
              <div className="filter-group">
                <label htmlFor="sort-by-select">Sort By</label>
                <select
                  id="sort-by-select"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="filter-input filter-select"
                >
                  <option value="newest">Newest First</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                </select>
              </div>
            </div>

            {/* Clear Filters Action */}
            {isFiltered && (
              <div className="filters-actions-bar">
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="clear-filters-btn"
                >
                  <RotateCcw size={15} /> Clear All Filters
                </button>
              </div>
            )}
          </div>
        )}

        {/* Results Info Bar */}
        <div className="marketplace-meta-bar">
          <div className="results-count-badge">
            Showing <strong>{filteredProperties.length}</strong> {filteredProperties.length === 1 ? 'property' : 'properties'}
          </div>
          {isFiltered && (
            <div className="active-filters-pills">
              {searchQuery && <span className="filter-pill">Search: "{searchQuery}"</span>}
              {propertyType && <span className="filter-pill">Type: {propertyType}</span>}
              {minPrice && <span className="filter-pill">Min: ₦{Number(minPrice).toLocaleString()}</span>}
              {maxPrice && <span className="filter-pill">Max: ₦{Number(maxPrice).toLocaleString()}</span>}
              {sortBy !== 'newest' && (
                <span className="filter-pill">
                  {sortBy === 'price_asc' ? 'Price: Low → High' : 'Price: High → Low'}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Main Content Area */}
        {loading ? (
          <div className="marketplace-loading-state">
            <div className="loader"></div>
            <p>Loading available properties...</p>
          </div>
        ) : error ? (
          <div className="marketplace-error-state">
            <p>{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="retry-button"
            >
              Retry
            </button>
          </div>
        ) : filteredProperties.length === 0 ? (
          <div className="marketplace-empty-state">
            <Building2 size={48} className="empty-state-icon" />
            <h3>No Properties Found</h3>
            <p>
              We couldn't find any published properties matching your current search or filter criteria.
            </p>
            {isFiltered && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="empty-reset-btn"
              >
                Clear All Filters
              </button>
            )}
          </div>
        ) : (
          <div className="marketplace-grid">
            {filteredProperties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        )}

        {/* Footer */}
        <footer className="properties-footer">
          <div className="footer-content">
            <div className="footer-section">
              <h3>SuDomus</h3>
              <p>Connecting Real Estate to the Blockchain with transparent, decentralized transactions.</p>
            </div>
            <div className="footer-section">
              <h4>Quick Links</h4>
              <Link to="/">Home</Link>
              <Link to="/properties">Properties</Link>
              <Link to="/privacy">Privacy Policy</Link>
              <Link to="/cookies">Cookie Policy</Link>
            </div>
            <div className="footer-section">
              <h4>Contact</h4>
              <p style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Mail size={15} /> <a href="mailto:sudomus.ng@gmail.com" style={{ color: 'inherit', textDecoration: 'none' }}>sudomus.ng@gmail.com</a></p>
              <p style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Phone size={15} /> +234 907 761 7091</p>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; {new Date().getFullYear()} SuDomus. All rights reserved.</p>
          </div>
        </footer>
      </div>
    </>
  );
}