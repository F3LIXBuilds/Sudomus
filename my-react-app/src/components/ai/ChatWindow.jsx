import React, { useEffect, useRef } from "react";
import MessageBubble from "./MessageBubble.jsx";
import TypingIndicator from "./TypingIndicator.jsx";
import SuggestedPrompts from "./SuggestedPrompts.jsx";
import "../../styles/ai/ChatWindow.css";

export default function ChatWindow({ messages, isThinking, onSuggestionSelect }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    const node = scrollRef.current;
    if (node) {
      node.scrollTop = node.scrollHeight;
    }
  }, [messages, isThinking]);

  const isEmpty = messages.length === 0;

  return (
    <div className="chat-window" ref={scrollRef}>
      {isEmpty ? (
        <div className="chat-window__empty">
          <div className="chat-window__empty-heading">
            <h2>Find your next home in Nigeria, faster.</h2>
            <p>Tell me a location, a budget, or a property type — I'll take it from there.</p>
          </div>
          <SuggestedPrompts onSelect={onSuggestionSelect} />
        </div>
      ) : (
        <div className="chat-window__messages">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}
          {isThinking && <TypingIndicator />}
        </div>
      )}
    </div>
  );
}
