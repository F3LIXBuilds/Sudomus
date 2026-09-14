import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { 
  Search, 
  MessageSquare, 
  ShieldCheck, 
  Users, 
  ArrowRight, 
  CheckCircle2, 
  MapPin, 
  Cpu, 
  Lock, 
  TrendingUp,
  Layers,
  Sparkles
} from 'lucide-react';
import './About.css';

export default function About() {
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'About SuDomus | Real Estate Reimagined';
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="about-page">
      <Navbar />

      <main className="about-main">
        {/* 1. HERO SECTION */}
        <section className="about-hero-section" aria-labelledby="about-hero-heading">
          <div className="about-hero-glow about-hero-glow--left" aria-hidden="true" />
          <div className="about-hero-glow about-hero-glow--right" aria-hidden="true" />
          
          <div className="about-hero-container">
            <span className="about-pill">About SuDomus</span>
            <h1 id="about-hero-heading" className="about-hero-title">
              Real Estate, Reimagined for Nigeria.
            </h1>
            <p className="about-hero-lead">
              SuDomus is building a smarter way to discover, evaluate, and connect with real estate across Nigeria.
            </p>
            <p className="about-hero-description">
              By combining modern search technology, real-time property discovery, intelligent AI assistance, and trust-focused agent workflows, SuDomus unites the entire property journey on one streamlined platform.
            </p>
            
            <div className="about-hero-actions">
              <button 
                type="button" 
                className="about-btn about-btn--primary"
                onClick={() => navigate('/properties')}
              >
                Explore Properties <ArrowRight size={18} />
              </button>
              <button 
                type="button" 
                className="about-btn about-btn--secondary"
                onClick={() => navigate('/ai')}
              >
                Try SuDomus AI
              </button>
            </div>
          </div>
        </section>

        {/* 2. OUR MISSION */}
        <section className="about-section about-section--alt" aria-labelledby="mission-heading">
          <div className="about-container">
            <div className="about-section-header">
              <span className="about-section-tag">Purpose</span>
              <h2 id="mission-heading" className="about-section-title">Our Mission</h2>
              <p className="about-section-subtitle">
                Making property discovery in Nigeria more accessible, transparent, and technology-driven.
              </p>
            </div>

            <div className="about-mission-grid">
              <div className="about-mission-card">
                <div className="about-mission-card__number">01</div>
                <h3 className="about-mission-card__title">Accessible Discovery</h3>
                <p className="about-mission-card__text">
                  Making property search straightforward and intuitive for everyone, whether buying a family home, leasing commercial space, or investing in land.
                </p>
              </div>

              <div className="about-mission-card">
                <div className="about-mission-card__number">02</div>
                <h3 className="about-mission-card__title">Accountability & Trust</h3>
                <p className="about-mission-card__text">
                  Improving confidence between buyers, renters, sellers, and verified agents through systematic listing verification and transparent property records.
                </p>
              </div>

              <div className="about-mission-card">
                <div className="about-mission-card__number">03</div>
                <h3 className="about-mission-card__title">Reduced Friction</h3>
                <p className="about-mission-card__text">
                  Cutting down redundant manual steps, endless phone tag, and fragmented information across unverified channels.
                </p>
              </div>

              <div className="about-mission-card">
                <div className="about-mission-card__number">04</div>
                <h3 className="about-mission-card__title">Intelligent Assistance</h3>
                <p className="about-mission-card__text">
                  Using artificial intelligence and smart filtering to turn complex property queries into instant, actionable results.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 3. THE PROBLEM */}
        <section className="about-section" aria-labelledby="problem-heading">
          <div className="about-container">
            <div className="about-section-header">
              <span className="about-section-tag">Industry Context</span>
              <h2 id="problem-heading" className="about-section-title">
                Real Estate Shouldn't Be This Difficult.
              </h2>
              <p className="about-section-subtitle">
                Searching for property in Nigeria has historically presented persistent hurdles for both seekers and professionals.
              </p>
            </div>

            <div className="about-problem-grid">
              <div className="about-problem-item">
                <div className="about-problem-bullet" />
                <div>
                  <h4 className="about-problem-item__title">Fragmented Property Information</h4>
                  <p className="about-problem-item__text">
                    Listings are often scattered across social groups, bulletin boards, and informal networks without standardized data or up-to-date availability.
                  </p>
                </div>
              </div>

              <div className="about-problem-item">
                <div className="about-problem-bullet" />
                <div>
                  <h4 className="about-problem-item__title">Difficulty Finding Matching Properties</h4>
                  <p className="about-problem-item__text">
                    Matching specific requirements—such as bedroom count, precise budget constraints, and distinct neighborhoods—frequently requires countless manual follow-ups.
                  </p>
                </div>
              </div>

              <div className="about-problem-item">
                <div className="about-problem-bullet" />
                <div>
                  <h4 className="about-problem-item__title">Uncertainty Around Listings and Agents</h4>
                  <p className="about-problem-item__text">
                    Lack of structured verification creates hesitation when evaluating whether a listing is genuine and whether an agent represents verified credentials.
                  </p>
                </div>
              </div>

              <div className="about-problem-item">
                <div className="about-problem-bullet" />
                <div>
                  <h4 className="about-problem-item__title">Inefficient Communication</h4>
                  <p className="about-problem-item__text">
                    Inquiries are often lost in transit, schedules conflict, and tracking viewing requests becomes cumbersome without unified tools.
                  </p>
                </div>
              </div>

              <div className="about-problem-item">
                <div className="about-problem-bullet" />
                <div>
                  <h4 className="about-problem-item__title">Time-Consuming Manual Search</h4>
                  <p className="about-problem-item__text">
                    Property seekers spend weeks sifting through stale listings, driving to inspections for properties that do not match initial representations.
                  </p>
                </div>
              </div>

              <div className="about-problem-item">
                <div className="about-problem-bullet" />
                <div>
                  <h4 className="about-problem-item__title">Limited Access to Smart Recommendations</h4>
                  <p className="about-problem-item__text">
                    Traditional directories lack the intelligence to understand natural, conversational property requirements in Nigerian Naira and local contexts.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. THE SOLUTION */}
        <section className="about-section about-section--alt" aria-labelledby="solution-heading">
          <div className="about-container">
            <div className="about-section-header">
              <span className="about-section-tag">Platform</span>
              <h2 id="solution-heading" className="about-section-title">
                One Platform. A Smarter Property Search.
              </h2>
              <p className="about-section-subtitle">
                SuDomus resolves fragmentation by bringing discovery, AI search, verified data, and direct agent connection under one cohesive ecosystem.
              </p>
            </div>

            <div className="about-solution-grid">
              <div className="about-solution-card">
                <div className="about-solution-card__icon-wrap">
                  <Search size={24} />
                </div>
                <h3 className="about-solution-card__title">Property Discovery</h3>
                <p className="about-solution-card__text">
                  Search and explore available properties across Nigeria with structured filters covering price, bedroom count, property type, and neighborhood location.
                </p>
              </div>

              <div className="about-solution-card">
                <div className="about-solution-card__icon-wrap">
                  <MessageSquare size={24} />
                </div>
                <h3 className="about-solution-card__title">AI-Powered Search</h3>
                <p className="about-solution-card__text">
                  Describe what you are looking for naturally in your own words. SuDomus AI parses criteria such as budget, location, and property type to query the real listings database.
                </p>
              </div>

              <div className="about-solution-card">
                <div className="about-solution-card__icon-wrap">
                  <ShieldCheck size={24} />
                </div>
                <h3 className="about-solution-card__title">Trust & Verification</h3>
                <p className="about-solution-card__text">
                  Build trust into the property discovery process through agent identity compliance workflows, listing reviews, and transparent status badges.
                </p>
              </div>

              <div className="about-solution-card">
                <div className="about-solution-card__icon-wrap">
                  <Users size={24} />
                </div>
                <h3 className="about-solution-card__title">Direct Connections</h3>
                <p className="about-solution-card__text">
                  Connect directly with listing agents, view agent profiles and portfolios, and submit direct inquiries on any listing without intermediary friction.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 5. WEB3 / TECHNOLOGY */}
        <section className="about-section" aria-labelledby="tech-heading">
          <div className="about-container">
            <div className="about-tech-layout">
              <div className="about-tech-text">
                <span className="about-section-tag">Technology</span>
                <h2 id="tech-heading" className="about-section-title">
                  Built for the Next Generation of Real Estate.
                </h2>
                <p className="about-text-p">
                  At SuDomus, we believe blockchain and decentralized technologies hold significant promise for transforming real estate—when applied thoughtfully to real operational bottlenecks rather than used as superficial marketing.
                </p>
                <p className="about-text-p">
                  Our development roadmap explores how digital identity, decentralized verification, transparent public ledgers, and secure smart contracts can complement day-to-day property transactions.
                </p>

                <div className="about-tech-distinction">
                  <h4 className="about-tech-distinction__title">Current Product vs. Future Roadmap</h4>
                  <ul className="about-tech-distinction__list">
                    <li>
                      <CheckCircle2 size={16} className="about-check-icon" />
                      <span><strong>Available Today:</strong> Centralized real-time marketplace, live PostgreSQL listings, agent KYC verification workflows, interactive mapping, and natural-language AI property search.</span>
                    </li>
                    <li>
                      <CheckCircle2 size={16} className="about-check-icon" />
                      <span><strong>In Development:</strong> On-chain agent credentials, decentralized escrow smart contracts, cryptographic document audit trails, and Web3 wallet-authenticated property agreements.</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="about-tech-cards">
                <div className="about-tech-pillar">
                  <Lock size={20} className="about-pillar-icon" />
                  <h4>Digital Identity</h4>
                  <p>Exploring self-sovereign agent identities and verifiable credentials for tamper-proof reputation history.</p>
                </div>
                <div className="about-tech-pillar">
                  <ShieldCheck size={20} className="about-pillar-icon" />
                  <h4>Transparent Records</h4>
                  <p>Designing immutable audit logs for listing status changes, inspection verifications, and compliance milestones.</p>
                </div>
                <div className="about-tech-pillar">
                  <Cpu size={20} className="about-pillar-icon" />
                  <h4>Secure Infrastructure</h4>
                  <p>Architected with modern web security, secure APIs, and forward compatibility with decentralized network layers.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 6. SU DOMUS AI */}
        <section className="about-section about-section--alt" aria-labelledby="ai-heading">
          <div className="about-container">
            <div className="about-ai-box">
              <div className="about-ai-box__content">
                <span className="about-section-tag">Intelligent Assistance</span>
                <h2 id="ai-heading" className="about-section-title">Meet SuDomus AI</h2>
                <p className="about-text-p">
                  SuDomus AI is your conversational assistant for real estate in Nigeria. Instead of manually adjusting multiple dropdowns and sliders, simply tell SuDomus AI what you need in natural English.
                </p>
                
                <div className="about-ai-prompt-preview">
                  <span className="about-ai-prompt-label">Example Prompt:</span>
                  <p className="about-ai-prompt-quote">
                    "Find me an apartment with at least 3 bedrooms under ₦50 million in Rivers."
                  </p>
                </div>

                <p className="about-text-p">
                  SuDomus AI parses your location, property type, price limits, and bedroom preferences, executes a query against the live SuDomus PostgreSQL database, and delivers structured, interactive recommendation cards you can open immediately.
                </p>

                <button 
                  type="button" 
                  className="about-btn about-btn--primary"
                  onClick={() => navigate('/ai')}
                >
                  Try SuDomus AI <ArrowRight size={18} />
                </button>
              </div>

              <div className="about-ai-box__visual" aria-hidden="true">
                <div className="about-ai-card-mockup">
                  <div className="about-ai-card-mockup__header">
                    <span className="about-ai-card-mockup__dot" />
                    <span>SuDomus AI Assistant</span>
                  </div>
                  <div className="about-ai-card-mockup__bubble about-ai-card-mockup__bubble--user">
                    Find me an apartment with at least 3 bedrooms under ₦50 million in Rivers
                  </div>
                  <div className="about-ai-card-mockup__bubble about-ai-card-mockup__bubble--bot">
                    I found matching listings in Rivers State matching your criteria:
                  </div>
                  <div className="about-ai-card-mockup__preview-card">
                    <div className="about-ai-card-mockup__thumb" />
                    <div className="about-ai-card-mockup__details">
                      <h5>2 Story Building</h5>
                      <span className="about-ai-card-mockup__loc">Port Harcourt, Rivers</span>
                      <span className="about-ai-card-mockup__price">₦2,000,000</span>
                      <span className="about-ai-card-mockup__meta">5 Beds • 3 Baths</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 7. WHERE WE'RE STARTING */}
        <section className="about-section" aria-labelledby="location-heading">
          <div className="about-container">
            <div className="about-section-header">
              <span className="about-section-tag">Coverage</span>
              <h2 id="location-heading" className="about-section-title">Starting in Nigeria.</h2>
              <p className="about-section-subtitle">
                We believe in deep localized execution before broad expansion. SuDomus currently focuses on three key economic and residential centers in Nigeria.
              </p>
            </div>

            <div className="about-locations-grid">
              <div className="about-location-card">
                <div className="about-location-card__header">
                  <MapPin size={22} className="about-loc-pin" />
                  <h3>Lagos State</h3>
                </div>
                <p className="about-location-card__desc">
                  Nigeria's economic and commercial nerve center, featuring high-demand residential and commercial listings across Lekki, Victoria Island, Ikeja, and suburban growth corridors.
                </p>
                <div className="about-location-card__tags">
                  <span>Lekki</span>
                  <span>Victoria Island</span>
                  <span>Ikeja</span>
                </div>
              </div>

              <div className="about-location-card">
                <div className="about-location-card__header">
                  <MapPin size={22} className="about-loc-pin" />
                  <h3>Rivers State</h3>
                </div>
                <p className="about-location-card__desc">
                  The primary industrial and energy hub of the Niger Delta, with key residential and commercial inventory focused in Port Harcourt, GRA, and surrounding industrial zones.
                </p>
                <div className="about-location-card__tags">
                  <span>Port Harcourt</span>
                  <span>Old GRA</span>
                  <span>Trans-Amadi</span>
                </div>
              </div>

              <div className="about-location-card">
                <div className="about-location-card__header">
                  <MapPin size={22} className="about-loc-pin" />
                  <h3>Imo State</h3>
                </div>
                <p className="about-location-card__desc">
                  A prominent southeastern residential and commercial hub, supporting expanding real estate development, plots, and housing in Owerri, Ihiala, and nearby communities.
                </p>
                <div className="about-location-card__tags">
                  <span>Owerri</span>
                  <span>Ihiala Corridor</span>
                  <span>New Owerri</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 8. OUR VISION */}
        <section className="about-section about-section--alt" aria-labelledby="vision-heading">
          <div className="about-container">
            <div className="about-section-header">
              <span className="about-section-tag">Roadmap</span>
              <h2 id="vision-heading" className="about-section-title">Where We're Going</h2>
              <p className="about-section-subtitle">
                Our long-term commitment is to build the comprehensive digital real estate infrastructure for Nigeria and emerging African markets.
              </p>
            </div>

            <div className="about-vision-grid">
              <div className="about-vision-item">
                <Layers size={22} className="about-vision-icon" />
                <h4>Smarter Discovery Infrastructure</h4>
                <p>Continuously evolving recommendation models that match lifestyle requirements, commute distances, and investment yields with precision.</p>
              </div>

              <div className="about-vision-item">
                <ShieldCheck size={22} className="about-vision-icon" />
                <h4>Stronger Verification Standards</h4>
                <p>Partnering with regulatory registries and surveyors to provide automated title validation, land document audits, and verified parcel histories.</p>
              </div>

              <div className="about-vision-item">
                <Sparkles size={22} className="about-vision-icon" />
                <h4>Intelligent Real Estate Advisory</h4>
                <p>Expanding AI capabilities to offer neighborhood price trends, rental yield comparisons, and regulatory guidance for first-time buyers.</p>
              </div>

              <div className="about-vision-item">
                <Users size={22} className="about-vision-icon" />
                <h4>Elevated Agent & Buyer Workflows</h4>
                <p>Equipping certified real estate consultants with digital portfolio tools, appointment scheduling, and customer inquiry management.</p>
              </div>

              <div className="about-vision-item">
                <Lock size={22} className="about-vision-icon" />
                <h4>Blockchain-Enabled Escrow</h4>
                <p>Pioneering smart-contract escrow accounts to protect deposits, ensure milestone releases, and reduce transaction vulnerability.</p>
              </div>

              <div className="about-vision-item">
                <TrendingUp size={22} className="about-vision-icon" />
                <h4>Transparent & Efficient Settlement</h4>
                <p>Shortening the weeks-long closing cycle into clear, documented digital transactions with reduced fees and complete transparency.</p>
              </div>
            </div>
          </div>
        </section>

        {/* 9. FINAL CTA */}
        <section className="about-cta-section" aria-labelledby="cta-heading">
          <div className="about-cta-container">
            <h2 id="cta-heading" className="about-cta-title">
              Find Your Next Property With SuDomus.
            </h2>
            <p className="about-cta-description">
              Explore properties, connect with agents, and let SuDomus help you find what you're looking for.
            </p>
            <div className="about-cta-actions">
              <button 
                type="button" 
                className="about-btn about-btn--primary"
                onClick={() => navigate('/properties')}
              >
                Explore Properties <ArrowRight size={18} />
              </button>
              <button 
                type="button" 
                className="about-btn about-btn--secondary"
                onClick={() => navigate('/ai')}
              >
                Try SuDomus AI
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="about-footer">
        <div className="about-footer-container">
          <div className="about-footer-top">
            <div className="about-footer-brand">
              <h3 className="about-footer-logo">SuDomus</h3>
              <p className="about-footer-description">
                Real estate, reimagined for Nigeria. Discover, verify, and connect with trusted properties across Lagos, Rivers, and Imo.
              </p>
            </div>

            <div className="about-footer-links-group">
              <div className="about-footer-col">
                <h4>Platform</h4>
                <ul>
                  <li><Link to="/">Home</Link></li>
                  <li><Link to="/properties">Browse Properties</Link></li>
                  <li><Link to="/ai">SuDomus AI</Link></li>
                  <li><Link to="/about">About Us</Link></li>
                </ul>
              </div>

              <div className="about-footer-col">
                <h4>Account</h4>
                <ul>
                  <li><Link to="/login">Sign In</Link></li>
                  <li><Link to="/signup">Register</Link></li>
                  <li><Link to="/dashboard">Dashboard</Link></li>
                </ul>
              </div>

              <div className="about-footer-col">
                <h4>Legal</h4>
                <ul>
                  <li><Link to="/privacy">Privacy Policy</Link></li>
                  <li><Link to="/cookies">Cookie Policy</Link></li>
                </ul>
              </div>
            </div>
          </div>

          <div className="about-footer-bottom">
            <p>&copy; {new Date().getFullYear()} SuDomus. All rights reserved.</p>
            <div className="about-footer-badges">
              <span>Ethereum</span>
              <span>Solana</span>
              <span>Web3</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
