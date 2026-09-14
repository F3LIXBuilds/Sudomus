import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import { MessageSquare } from "lucide-react";
import SuDomusAI from "./SuDomusAI.jsx";
import "../../styles/ai/AIFloatingWidget.css";

export default function AIFloatingWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  // If the user is already on the dedicated AI page, do not render the floating widget
  if (location.pathname === "/ai" || location.pathname === "/assistant") {
    return null;
  }

  return (
    <div className="sudomus-ai-widget">
      {isOpen && (
        <div className="sudomus-ai-drawer" role="dialog" aria-label="SuDomus AI Chat">
          <SuDomusAI onClose={() => setIsOpen(false)} isFloating={true} />
        </div>
      )}

      <button
        type="button"
        className="sudomus-ai-launcher"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? "Close SuDomus AI" : "Open SuDomus AI Assistant"}
        title="Chat with SuDomus AI"
      >
        <div className="sudomus-ai-launcher__icon-wrap">
          <MessageSquare size={16} />
        </div>
        <span className="sudomus-ai-launcher__label">
          {isOpen ? "Close Assistant" : "SuDomus AI"}
        </span>
      </button>
    </div>
  );
}
