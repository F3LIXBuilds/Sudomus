import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { ShieldCheck, Calendar, ArrowLeft, Lock, Info, Mail } from 'lucide-react';
import './Legal.css';

export default function PrivacyPolicy() {
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
              <span className="current">Privacy Policy</span>
            </div>
          </div>

          {/* Legal Document Card */}
          <div className="legal-document-card">
            <header className="legal-header">
              <div className="legal-badge">
                <ShieldCheck size={14} /> SuDomus Compliance & Governance
              </div>
              <h1 className="legal-title">Privacy Policy</h1>
              <div className="legal-meta-row">
                <div className="legal-meta-item">
                  <Calendar size={15} /> Last Updated: {lastUpdated}
                </div>
                <div className="legal-meta-item">
                  <Lock size={15} /> NDPR & Global Best Practices Aligned
                </div>
              </div>
            </header>

            <div className="legal-callout-box">
              <Info size={22} className="legal-callout-icon" />
              <p className="legal-callout-text">
                At SuDomus, we are committed to protecting your personal data, identity, and financial privacy.
                This Privacy Policy explains what information we collect, how it is processed across our real estate
                marketplace and Web3 services, and your rights as a buyer, agent, or property seller.
              </p>
            </div>

            <div className="legal-body">
              <section className="legal-section">
                <h2><span className="section-num">1.</span> Introduction</h2>
                <p>
                  SuDomus ("we", "us", or "our") operates the real estate platform accessible at sudomus.com and related
                  interfaces. We provide a marketplace connecting prospective property buyers, tenants, licensed real estate
                  agents, and verified property sellers. We respect individual privacy and are dedicated to adhering to the
                  Nigeria Data Protection Regulation (NDPR) and international privacy frameworks.
                </p>
              </section>

              <section className="legal-section">
                <h2><span className="section-num">2.</span> Information We Collect</h2>
                <p>Depending on how you interact with SuDomus, we collect the following types of information:</p>
                <ul className="legal-list">
                  <li>
                    <strong>Account Information:</strong> When you register as a buyer, seller, or agent, we collect your name,
                    email address, password (stored strictly as salted cryptographic hashes), role, and contact phone number.
                  </li>
                  <li>
                    <strong>Property Inquiries:</strong> When you contact an agent through our listing pages, we process your name,
                    email, optional phone number, and message content to deliver your inquiry.
                  </li>
                  <li>
                    <strong>KYC & Verification Records:</strong> For verified agents and sellers, we collect government-issued ID,
                    real estate license credentials, and proof of property title deeds for compliance verification.
                  </li>
                  <li>
                    <strong>Blockchain Wallet Addresses:</strong> If you choose to connect a Web3 wallet (e.g. MetaMask), we record
                    your public wallet address to verify on-chain ownership and facilitate escrow transactions. We never access your private keys or seed phrases.
                  </li>
                  <li>
                    <strong>Usage Data:</strong> We record anonymous listing views and filter interactions to improve our search recommendations
                    and analytics metrics for property owners.
                  </li>
                </ul>
              </section>

              <section className="legal-section">
                <h2><span className="section-num">3.</span> How We Use Your Information</h2>
                <p>We use collected data solely for legitimate business purposes, including:</p>
                <ul className="legal-list">
                  <li>Facilitating direct communication between buyers and verified property representatives.</li>
                  <li>Preventing fraudulent property advertisements, identity spoofing, and duplicate listings.</li>
                  <li>Maintaining accurate dashboard metrics (property views, saved favorites, scheduled viewing appointments).</li>
                  <li>Executing smart contract escrow and milestone verification upon mutual agreement.</li>
                  <li>Complying with regulatory obligations and legal disclosures under applicable property laws.</li>
                </ul>
              </section>

              <section className="legal-section">
                <h2><span className="section-num">4.</span> Public Ledger & Blockchain Notice</h2>
                <p>
                  Please be aware that blockchain transactions (including smart contracts, tokenized deed records, and wallet connections)
                  are inherently public and permanent. When you initiate a transaction on Ethereum, Polygon, or any distributed ledger,
                  your public wallet address and transaction hash become immutable records of that network. SuDomus does not have the ability
                  to modify, erase, or alter records stored on public blockchains.
                </p>
              </section>

              <section className="legal-section">
                <h2><span className="section-num">5.</span> Sharing and Disclosure</h2>
                <p>
                  <strong>We do not sell your personal information.</strong> We only share data in the following transparent circumstances:
                </p>
                <ul className="legal-list">
                  <li>
                    <strong>With Listing Agents & Owners:</strong> When you submit a property inquiry, your provided name, email, and message
                    are forwarded to the agent representing that listing.
                  </li>
                  <li>
                    <strong>With Service Providers:</strong> Trusted cloud infrastructure (e.g. PostgreSQL hosting, secure image delivery)
                    bound by strict confidentiality agreements.
                  </li>
                  <li>
                    <strong>Legal & Regulatory Compliance:</strong> In response to valid legal processes, court orders, or law enforcement requests
                    concerning verified fraudulent activity.
                  </li>
                </ul>
              </section>

              <section className="legal-section">
                <h2><span className="section-num">6.</span> Data Security & Retention</h2>
                <p>
                  SuDomus implements technical safeguards including industry-standard SSL/TLS encryption, JWT token authorization,
                  isolated cloud database clusters, and strict role-based access control. Sensitive data is stored securely and retained
                  only for as long as your account remains active or as required by real-estate financial compliance standards.
                </p>
              </section>

              <section className="legal-section">
                <h2><span className="section-num">7.</span> Your Privacy Rights</h2>
                <p>Under applicable data protection laws, you possess the right to:</p>
                <ul className="legal-list">
                  <li>Request access to the personal data we maintain about you.</li>
                  <li>Request corrections to inaccurate or incomplete profile records.</li>
                  <li>Request account deactivation and data erasure, subject to mandatory legal real estate audit requirements.</li>
                  <li>Withdraw consent for optional analytics or marketing communications at any time.</li>
                </ul>
              </section>

              <div className="legal-footer-contact">
                <h3>Have Questions Regarding Privacy?</h3>
                <p>
                  Our team can be reached directly at{' '}
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
