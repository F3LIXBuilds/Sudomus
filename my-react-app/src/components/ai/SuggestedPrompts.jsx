import React from "react";
import "../../styles/ai/SuggestedPrompts.css";

const PROMPTS = [
  "Find me a 2-bedroom apartment in Lagos",
  "Show properties under ₦5 million",
  "What documents do I need to rent a property?",
  "Find properties around Lekki",
  "Help me choose between renting and buying",
];

export default function SuggestedPrompts({ onSelect }) {
  return (
    <div className="suggested-prompts">
      {PROMPTS.map((prompt) => (
        <button
          key={prompt}
          type="button"
          className="suggested-prompts__chip"
          onClick={() => onSelect(prompt)}
        >
          {prompt}
        </button>
      ))}
    </div>
  );
}
