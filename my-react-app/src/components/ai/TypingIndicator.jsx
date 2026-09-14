import React from "react";
import "../../styles/ai/TypingIndicator.css";

export default function TypingIndicator() {
  return (
    <div className="message-row message-row--assistant">
      <div className="message-row__avatar" aria-hidden="true">SD</div>
      <div className="typing-indicator">
        <span className="typing-indicator__text">SuDomus AI is thinking</span>
        <span className="typing-indicator__dots" aria-hidden="true">
          <span />
          <span />
          <span />
        </span>
      </div>
    </div>
  );
}
