import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { ShieldCheck, Calendar, ArrowLeft, Cookie, Info } from 'lucide-react';
import './Legal.css';

export default function CookiePolicy() {
  const lastUpdated = "September 6, 2026";

  return (
    <>
      <Navbar />
      <div className="legal-page">
        <div className="legal-container">
          {/* Breadcrumb Nav */}
          <div className="legal-nav">
            <Link to="/" className="legal-back-btn">
              <ArrowLeft size={16} /> Return to Home
            </Link>
            <div className="legal-breadcrumb">
              <Link to="/">Home</Link>
              <span>/</span>
              <span className="current">Cookie Policy</span>
            </div>
          </div>

          {/* Legal Document Card */}
          <div className="legal-document-card">
            <header className="legal-header">
              <div className="legal-badge">
                <Cookie size={14} /> SuDomus Transparency & Technology
              </div>
              <h1 className="legal-title">Cookies & Storage Policy</h1>
              <div className="legal-meta-row">
                <div className="legal-meta-item">
                  <Calendar size={15} /> Last Updated: {lastUpdated}
                </div>
                <div className="legal-meta-item">
                  <ShieldCheck size={15} /> Transparent Cookie Usage
                </div>
              </div>
            </header>

            <div className="legal-callout-box">
              <Info size={22} className="legal-callout-icon" />
              <p className="legal-callout-text">
                This Cookies Policy explains how SuDomus uses cookies, local browser storage, and related web technologies
                to provide secure account sessions, preserve your favorite properties, and deliver a smooth marketplace experience.
              </p>
            </div>

            <div className="legal-body">
              <section className="legal-section">
                <h2><span className="section-num">1.</span> What Are Cookies and Local Storage?</h2>
                <p>
                  Cookies are small text files placed on your computer or mobile device when you visit a website.
                  Similarly, modern web applications utilize <strong>HTML5 LocalStorage</strong> and <strong>SessionStorage</strong>
                  to keep you safely logged in and remember your preferences without transmitting unnecessary data on every HTTP network request.
                </p>
              </section>

              <section className="legal-section">
                <h2><span className="section-num">2.</span> How SuDomus Uses Cookies & Storage</h2>
                <p>We classify our browser storage mechanisms into three straightforward categories:</p>

                <div className="legal-table-wrapper">
                  <table className="legal-table">
                    <thead>
                      <tr>
                        <th>Storage Type</th>
                        <th>Purpose</th>
                        <th>Category</th>
                        <th>Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td><code>token</code> (LocalStorage)</td>
                        <td>Stores your secure JWT session token to authenticate your requests to the API.</td>
                        <td>Strictly Necessary</td>
                        <td>Persistent until logout</td>
                      </tr>
                      <tr>
                        <td><code>viewed_*</code> (SessionStorage)</td>
                        <td>Deduplicates listing view analytics to ensure honest view counts without duplicate triggers.</td>
                        <td>Performance</td>
                        <td>Browser session</td>
                      </tr>
                      <tr>
                        <td><code>wallet_connected</code></td>
                        <td>Remembers previously authorized Web3 wallet connection state.</td>
                        <td>Functional</td>
                        <td>Persistent</td>
                      </tr>
                      <tr>
                        <td><code>marketplace_filters</code></td>
                        <td>Preserves your selected property type, budget, and location search parameters.</td>
                        <td>Functional</td>
                        <td>Session</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              <section className="legal-section">
                <h2><span className="section-num">3.</span> Third-Party Services & Integrations</h2>
                <p>
                  SuDomus integrates with vetted third-party partners to provide core real estate functionality:
                </p>
                <ul className="legal-list">
                  <li>
                    <strong>OpenStreetMap & Mapnik:</strong> Used to display property location coordinates without commercial tracking.
                  </li>
                  <li>
                    <strong>Cloudinary:</strong> Used for fast, CDN-cached delivery of high-resolution property photos.
                  </li>
                  <li>
                    <strong>Blockchain RPC Providers:</strong> Used to query on-chain escrow contract status when you interact with Web3 features.
                  </li>
                </ul>
              </section>

              <section className="legal-section">
                <h2><span className="section-num">4.</span> Managing & Disabling Cookies</h2>
                <p>
                  Most web browsers automatically accept cookies, but you can modify your browser settings to decline cookies
                  or clear your stored browser data at any time:
                </p>
                <ul className="legal-list">
                  <li><strong>Google Chrome:</strong> Settings &gt; Privacy and Security &gt; Cookies and other site data</li>
                  <li><strong>Mozilla Firefox:</strong> Settings &gt; Privacy &amp; Security &gt; Cookies and Site Data</li>
                  <li><strong>Apple Safari:</strong> Preferences &gt; Privacy &gt; Manage Website Data</li>
                  <li><strong>Microsoft Edge:</strong> Settings &gt; Cookies and site permissions</li>
                </ul>
                <p>
                  <em>Note:</em> Because your JWT login token is stored securely in local browser storage, disabling web storage
                  will prevent you from logging into your account, managing property listings, or accessing your saved favorites.
                </p>
              </section>

              <section className="legal-section">
                <h2><span className="section-num">5.</span> Updates to This Policy</h2>
                <p>
                  We may periodically revise this Cookies Policy to reflect new regulatory requirements, enhanced platform features,
                  or updated storage methods. Any updates will be posted on this page with an updated revision date.
                </p>
              </section>

              <div className="legal-footer-contact">
                <h3>Questions About Our Cookie Policy?</h3>
                <p>
                  Reach out to our security & compliance team at{' '}
                  <a href="mailto:sudomus.ng@gmail.com">sudomus.ng@gmail.com</a>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
