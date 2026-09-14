import React, { useState } from 'react';
import { ChevronDown, HelpCircle, ShieldCheck } from 'lucide-react';
import './FAQSection.css';

const FAQ_DATA = [
  {
    id: 1,
    question: "How does SuDomus verify property listings and title deeds?",
    answer: "SuDomus verifies listings through a structured compliance protocol. Our compliance team inspects land registry documents, Certificates of Occupancy (C of O), Governor's Consents, and approved survey plans. Furthermore, listing agents and property sellers must undergo verified identity KYC. Any property currently under review displays a transparent 'Verification Pending' badge until certified."
  },
  {
    id: 2,
    question: "Can I purchase or rent properties using both Naira (NGN) and cryptocurrency?",
    answer: "Yes. SuDomus is engineered with dual-payment flexibility. Buyers and tenants can transact in traditional Nigerian Naira (NGN) via secure banking rails or connect their Web3 wallets (MetaMask, WalletConnect) to transact using verified digital assets on Ethereum and Polygon with transparent real-time conversion."
  },
  {
    id: 3,
    question: "How do physical inspections and property viewings work?",
    answer: "You can schedule a physical site inspection directly from any property page using the 'Contact Agent' inquiry form. Once submitted, the listing agent receives your request instantly in their dashboard. Authenticated buyers can monitor appointment dates, conversation logs, and viewing confirmations in their SuDomus Dashboard."
  },
  {
    id: 4,
    question: "How are buyer funds and escrow transactions protected before handover?",
    answer: "Every transaction on SuDomus is backed by secure smart contract escrow and licensed custodial safeguards. Buyer funds remain securely locked and are only released to the seller once title deed transfers, physical key handover, and buyer sign-off milestones have been verifiably fulfilled."
  },
  {
    id: 5,
    question: "How can real estate agents and property sellers list verified properties?",
    answer: "Licensed agents, developers, and private sellers can register an account, choose the 'Agent' or 'Seller' role, complete the automated KYC verification, and access the dedicated Agent Dashboard. From there, you can draft listings, upload high-resolution photos, configure amenities, and manage buyer inquiries and analytics."
  }
];

export default function FAQSection() {
  const [openId, setOpenId] = useState(1); // First item open by default

  const toggleFAQ = (id) => {
    setOpenId(openId === id ? null : id);
  };

  return (
    <section className="faq-section" id="faq">
      <div className="faq-container">
        <div className="faq-header">
          <div className="faq-badge">
            <HelpCircle size={15} /> Frequently Asked Questions
          </div>
          <h2 className="faq-title">Everything You Need to Know About SuDomus</h2>
          <p className="faq-subtitle">
            Transparent answers on property verification, payment methods, security, and transactions.
          </p>
        </div>

        <div className="faq-accordion">
          {FAQ_DATA.map((faq) => {
            const isOpen = openId === faq.id;
            return (
              <div 
                key={faq.id} 
                className={`faq-item ${isOpen ? 'open' : ''}`}
              >
                <button
                  type="button"
                  className="faq-question-btn"
                  onClick={() => toggleFAQ(faq.id)}
                  aria-expanded={isOpen}
                >
                  <span className="faq-question-text">{faq.question}</span>
                  <div className={`faq-icon-wrapper ${isOpen ? 'rotated' : ''}`}>
                    <ChevronDown size={20} />
                  </div>
                </button>

                <div className={`faq-answer-collapse ${isOpen ? 'expanded' : ''}`}>
                  <div className="faq-answer-inner">
                    <p>{faq.answer}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="faq-footer-note">
          <ShieldCheck size={18} className="faq-footer-icon" />
          <span>Have more questions? Contact our 24/7 compliance team or reach out to a verified agent.</span>
        </div>
      </div>
    </section>
  );
}
