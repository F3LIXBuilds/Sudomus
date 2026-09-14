import React from "react";
import PropertyRecommendation from "./PropertyRecommendation.jsx";
import "../../styles/ai/MessageBubble.css";

function formatTime(isoString) {
  try {
    return new Date(isoString).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

export default function MessageBubble({ message }) {
  const isUser = message.role === "user";
  const hasProperties = Array.isArray(message.properties) && message.properties.length > 0;

  return (
    <div className={`message-row ${isUser ? "message-row--user" : "message-row--assistant"}`}>
      {!isUser && <div className="message-row__avatar" aria-hidden="true">SD</div>}

      <div className="message-row__content">
        <div
          className={[
            "message-bubble",
            isUser ? "message-bubble--user" : "message-bubble--assistant",
            message.isError ? "message-bubble--error" : "",
          ].join(" ").trim()}
        >
          <p className="message-bubble__text">{message.text}</p>
        </div>
        <span className="message-row__timestamp">{formatTime(message.timestamp)}</span>

        {hasProperties && (
          <div className="message-row__properties">
            {message.isPrototypeData && (
              <p className="message-row__prototype-note">
                Prototype listings — shown for demo purposes, not live SuDomus inventory.
              </p>
            )}
            <div className="message-row__property-grid">
              {message.properties.map((property) => (
                <PropertyRecommendation key={property.id} property={property} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
