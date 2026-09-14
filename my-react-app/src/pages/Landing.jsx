import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import './Landing.css';
import houseSearchingSvg from '../assets/House-searching-rafiki.svg';
import Navbar from '../components/Navbar';
import FAQSection from '../components/FAQSection';

import { listingsService } from '../services/api';
import { PropertyCard } from '../components/properties/PropertyCard';
import { 
  Search, 
  ShieldCheck, 
  Zap, 
  Globe, 
  FileText, 
  Lock, 
  BarChart3, 
  Cpu 
} from 'lucide-react';

export default function Landing() {
  const [location, setLocation] = useState('');
  const [propertyType, setPropertyType] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);
  const [allListings, setAllListings] = useState([]);
  const [listings, setListings] = useState([]); // Filtered listings
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch listings from backend on page load
  const fetchListings = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await listingsService.getAllListings();
      const listingsArray = Array.isArray(data) ? data : (data?.listings || []);
      setAllListings(listingsArray);
      setListings(listingsArray);
    } catch (err) {
      console.error('Error fetching listings:', err);
      setError(err.message || 'Failed to load properties. Please make sure the server is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  // Search handler using backend API
  const handleSearch = (e) => {
    if (e) e.preventDefault();

    let filtered = [...allListings];

    if (location.trim()) {
      const loc = location.toLowerCase().trim();
      filtered = filtered.filter(item => 
        (item.city && item.city.toLowerCase().includes(loc)) || 
        (item.state && item.state.toLowerCase().includes(loc)) ||
        (item.address && item.address.toLowerCase().includes(loc)) ||
        (item.title && item.title.toLowerCase().includes(loc))
      );
    }

    if (propertyType) {
      filtered = filtered.filter(item => item.property_type === propertyType);
    }

    if (minPrice) {
      const numMin = parseFloat(minPrice);
      if (!isNaN(numMin)) {
        filtered = filtered.filter(item => parseFloat(item.price) >= numMin);
      }
    }

    if (maxPrice) {
      const numMax = parseFloat(maxPrice);
      if (!isNaN(numMax)) {
        filtered = filtered.filter(item => parseFloat(item.price) <= numMax);
      }
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const priceA = parseFloat(a.price) || 0;
      const priceB = parseFloat(b.price) || 0;
      if (sortBy === 'price_asc') {
        return priceA - priceB;
      } else if (sortBy === 'price_desc') {
        return priceB - priceA;
      } else {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return dateB - dateA;
      }
    });

    setListings(filtered);
  };

  const handleResetFilters = () => {
    setLocation('');
    setPropertyType('');
    setMinPrice('');
    setMaxPrice('');
    setSortBy('newest');
    setListings(allListings);
  };

  //  Navbar scroll behavior
  useEffect(() => {
    const handleScroll = () => {
      const navbar = document.querySelector('.navbar');
      if (navbar) {
        if (window.scrollY > 0) {
          navbar.classList.add('scrolled');
        } else {
          navbar.classList.remove('scrolled');
        }
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="landing-page">
      {/* Navbar with animated SuDomus logo */}
      <Navbar />

      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-left">
            <h1 className="hero-title hero-title-gradient">
              Connecting Real Estate to the Blockchain
            </h1>
            <p className="hero-description">
              Empowering buyers, sellers, and investors through transparent, decentralized property transactions.
            </p>

            {/* Search Button and Filters */}
            <div className="search-wrapper">
              <button
                className="search-toggle-btn"
                onClick={() => setShowFilters(!showFilters)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                <Search size={16} /> Search
              </button>

              {showFilters && (
                <form className="filter-form" onSubmit={handleSearch}>
                  <input
                    type="text"
                    placeholder="Location (e.g. Lagos, Rivers, Ihiala)"
                    className="search-input"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                  <select
                    className="search-select"
                    value={propertyType}
                    onChange={(e) => setPropertyType(e.target.value)}
                  >
                    <option value="">All Property Types</option>
                    <option value="apartment">Apartment</option>
                    <option value="house">House</option>
                    <option value="duplex">Duplex</option>
                    <option value="land">Land</option>
                    <option value="commercial">Commercial</option>
                    <option value="office">Office Space</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Min Price (₦)"
                    className="search-input"
                    value={minPrice}
                    onChange={(e) =>
                      setMinPrice(e.target.value.replace(/[^0-9]/g, ''))
                    }
                  />
                  <input
                    type="text"
                    placeholder="Max Price (₦)"
                    className="search-input"
                    value={maxPrice}
                    onChange={(e) =>
                      setMaxPrice(e.target.value.replace(/[^0-9]/g, ''))
                    }
                  />
                  <select
                    className="search-select"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="newest">Sort: Newest First</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                  </select>
                  <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
                    <button type="submit" className="search-button" style={{ flex: 1 }}>
                      Apply Filters
                    </button>
                    {(location || propertyType || minPrice || maxPrice || sortBy !== 'newest') && (
                      <button
                        type="button"
                        onClick={handleResetFilters}
                        className="search-button"
                        style={{
                          background: 'rgba(255, 255, 255, 0.1)',
                          border: '1px solid rgba(255, 255, 255, 0.2)',
                          color: '#e2e8f0',
                        }}
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <Link 
                    to="/properties" 
                    className="search-button"
                    style={{
                      display: 'block',
                      textAlign: 'center',
                      textDecoration: 'none',
                      marginTop: '0.5rem',
                      background: 'rgba(139, 92, 246, 0.25)',
                      border: '1px solid rgba(139, 92, 246, 0.4)',
                      color: '#ffffff'
                    }}
                  >
                    Explore Full Marketplace →
                  </Link>
                </form>
              )}
            </div>
          </div>

          <div className="hero-right">
            <img
              src={houseSearchingSvg}
              alt="House Searching Illustration"
              className="hero-svg"
            />
          </div>
        </div>
      </section>

      {/* Featured Listings Section */}
      <section className="featured-section" id="featured">
        <h2 className="section-title">Featured Listings</h2>
        <div className="wave-divider"></div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#a0aec0', fontSize: '1.1rem' }}>
            Loading properties...
          </div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#f87171' }}>
            <p style={{ marginBottom: '1rem' }}>{error}</p>
            <button
              onClick={fetchListings}
              style={{
                padding: '0.6rem 1.5rem',
                borderRadius: '8px',
                border: 'none',
                background: 'linear-gradient(90deg, #8b5cf6, #ec4899)',
                color: 'white',
                fontWeight: 600,
                cursor: 'pointer'
              }}
            >
              Retry
            </button>
          </div>
        ) : listings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#a0aec0', fontSize: '1.1rem' }}>
            No published properties found.
          </div>
        ) : (
          <div className="featured-grid">
            {listings.map((item) => (
              <PropertyCard key={item.id} property={item} />
            ))}
          </div>
        )}
      </section>

      {/* Features Section */}
      <section className="features-section" id="features">
        <h2 className="section-title">Why Choose SuDomus</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon"><ShieldCheck size={28} color="#8b5cf6" /></div>
            <h3 className="feature-title">Secure Transactions</h3>
            <p className="feature-description">
              All property deals are verified and protected by blockchain escrow technology.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon"><Zap size={28} color="#8b5cf6" /></div>
            <h3 className="feature-title">Fast Processing</h3>
            <p className="feature-description">
              Say goodbye to delays — enjoy instant confirmation for your transactions.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon"><Globe size={28} color="#8b5cf6" /></div>
            <h3 className="feature-title">Global Access</h3>
            <p className="feature-description">
              Buy and sell properties from anywhere, with full transparency and no middlemen.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon"><FileText size={28} color="#8b5cf6" /></div>
            <h3 className="feature-title">KYC Verified</h3>
            <p className="feature-description">
              Every user and listing undergoes strict identity and document verification.
            </p>
          </div>
        </div>
      </section>

      {/* Properties Section */}
      <section className="properties-section" id="properties">
        <h2 className="section-title">Explore More Properties</h2>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#a0aec0', fontSize: '1.1rem' }}>
            Loading properties...
          </div>
        ) : listings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#a0aec0', fontSize: '1.1rem' }}>
            No properties available at the moment.
          </div>
        ) : (
          <div className="properties-grid">
            {listings.map((item) => (
              <PropertyCard key={`explore-${item.id}`} property={item} />
            ))}
          </div>
        )}
      </section>

      {/* About Section - Techy Style */}
      <section className="about-section" id="about">
        <div className="about-container">
          <div className="about-header">
            <span className="about-badge">ABOUT US</span>
            <h2 className="about-title">
              <span className="tech-accent">&lt;</span>
              Building the Future
              <span className="tech-accent">/&gt;</span>
            </h2>
          </div>
          
          <div className="about-content">
            <div className="about-grid">
              <div className="about-card tech-card">
                <div className="tech-icon"><Cpu size={24} color="#8b5cf6" /></div>
                <h3 className="tech-title">Blockchain-Powered</h3>
                <p className="tech-text">
                  Leveraging <span className="highlight">Ethereum</span> and <span className="highlight">Solana</span> 
                  smart contracts for immutable, transparent property transactions.
                </p>
              </div>
              
              <div className="about-card tech-card">
                <div className="tech-icon"><Lock size={24} color="#8b5cf6" /></div>
                <h3 className="tech-title">Decentralized Escrow</h3>
                <p className="tech-text">
                  Secure funds in <span className="highlight">multi-signature wallets</span> until 
                  transaction conditions are met automatically.
                </p>
              </div>
              
              <div className="about-card tech-card">
                <div className="tech-icon"><Globe size={24} color="#8b5cf6" /></div>
                <h3 className="tech-title">Web3 Integration</h3>
                <p className="tech-text">
                  Connect your <span className="highlight">MetaMask</span> or <span className="highlight">Phantom</span> 
                  wallet for seamless crypto payments.
                </p>
              </div>
              
              <div className="about-card tech-card">
                <div className="tech-icon"><BarChart3 size={24} color="#8b5cf6" /></div>
                <h3 className="tech-title">Smart Analytics</h3>
                <p className="tech-text">
                  AI-powered insights and <span className="highlight">real-time market data</span> 
                  for informed investment decisions.
                </p>
              </div>
            </div>
            
            <div className="about-description">
              <p className="about-main-text">
                SuDomus is redefining real estate through <span className="gradient-text">cutting-edge blockchain technology</span>. 
                We've built a platform that combines the security of decentralized finance with the accessibility 
                of modern web applications.
              </p>
              <div className="tech-stats">
                <div className="stat-item">
                  <div className="stat-number">100%</div>
                  <div className="stat-label">On-Chain</div>
                </div>
                <div className="stat-item">
                  <div className="stat-number">24/7</div>
                  <div className="stat-label">Automated</div>
                </div>
                <div className="stat-item">
                  <div className="stat-number">0%</div>
                  <div className="stat-label">Middlemen</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5 Interactive FAQs Section */}
      <FAQSection />

      {/* Partners Section */}
      <section className="partners-section">
        <div className="partners-container">
          <h2 className="partners-title">Our Partners</h2>
          <p className="partners-subtitle">Trusted by leading organizations in real estate and blockchain</p>
          <div className="partners-wall">
            {[...Array(12)].map((_, index) => (
              <div key={index} className="partner-logo">
                <div className="partner-placeholder">
                  <span className="partner-text">Partner {index + 1}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-container">
          <div className="footer-content">
            <div className="footer-section">
              <h3 className="footer-logo">SuDomus</h3>
              <p className="footer-description">
                Revolutionizing real estate through blockchain technology. 
                Secure, transparent, and decentralized property transactions.
              </p>
              <div className="footer-social">
                <a 
                  href="https://x.com/sudomus_" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="social-link" 
                  aria-label="X (formerly Twitter)"
                  title="Follow us on X"
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
                <a 
                  href="https://linkedin.com" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="social-link" 
                  aria-label="LinkedIn"
                  title="Connect on LinkedIn"
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
                  </svg>
                </a>
                <a 
                  href="https://github.com" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="social-link" 
                  aria-label="GitHub"
                  title="View on GitHub"
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                  </svg>
                </a>
                <a 
                  href="https://discord.com" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="social-link" 
                  aria-label="Discord"
                  title="Join our Discord"
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <svg width="20" height="15" viewBox="0 0 127.14 96.36" fill="currentColor" aria-hidden="true">
                    <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.25,60,73.25,53s5-12.74,11.44-12.74S96.23,46,96.12,53,91.08,65.69,84.69,65.69Z" />
                  </svg>
                </a>
              </div>
            </div>
            
            <div className="footer-section">
              <h4 className="footer-heading">Platform</h4>
              <ul className="footer-links">
                <li><a href="#featured">Featured Properties</a></li>
                <li><Link to="/properties">Browse All</Link></li>
                <li><Link to="/about">About Us</Link></li>
                <li><Link to="/properties">Search</Link></li>
              </ul>
            </div>
            
            <div className="footer-section">
              <h4 className="footer-heading">Resources</h4>
              <ul className="footer-links">
                <li><a href="#faq">Frequently Asked Questions</a></li>
                <li><Link to="/properties">Marketplace</Link></li>
                <li><a href="#about">Verification Protocol</a></li>
                <li><a href="mailto:sudomus.ng@gmail.com">Contact: sudomus.ng@gmail.com</a></li>
              </ul>
            </div>
            
            <div className="footer-section">
              <h4 className="footer-heading">Legal</h4>
              <ul className="footer-links">
                <li><Link to="/privacy">Privacy Policy</Link></li>
                <li><Link to="/cookies">Cookie Policy</Link></li>
                <li><a href="/privacy#terms">Terms of Service</a></li>
                <li><a href="/privacy#governance">Compliance</a></li>
              </ul>
            </div>
          </div>
          
          <div className="footer-bottom">
            <p className="footer-copyright">
              © {new Date().getFullYear()} SuDomus. All rights reserved. Built on blockchain.
            </p>
            <div className="footer-tech-badges">
              <span className="tech-badge">Ethereum</span>
              <span className="tech-badge">Solana</span>
              <span className="tech-badge">Web3</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
