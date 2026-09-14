import React, { useCallback, useRef, useState } from "react";
import { X } from "lucide-react";
import ChatWindow from "./ChatWindow.jsx";
import ChatInput from "./ChatInput.jsx";
import { sendChatMessage, SuDomusApiError } from "../../api/aiClient.js";
import "../../styles/ai/SuDomusAI.css";
import "../../styles/ai/SuDomusAI-layout.css";

let messageIdCounter = 0;
const nextId = () => `msg-${Date.now()}-${messageIdCounter++}`;

export default function SuDomusAI({ onClose, isFloating = false }) {
  const [messages, setMessages] = useState([]);
  const [isThinking, setIsThinking] = useState(false);
  const [backendStatus, setBackendStatus] = useState("online"); // "online" | "offline"
  const conversationIdRef = useRef(undefined);

  const appendMessage = useCallback((message) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  const handleSend = useCallback(
    async (text) => {
      const trimmed = text.trim();
      if (!trimmed || isThinking) return;

      appendMessage({
        id: nextId(),
        role: "user",
        text: trimmed,
        timestamp: new Date().toISOString(),
      });
      setIsThinking(true);

      try {
        const data = await sendChatMessage(trimmed, conversationIdRef.current);
        if (data?.conversationId) {
          conversationIdRef.current = data.conversationId;
        }
        setBackendStatus("online");

        const replyText = data?.reply || data?.message || "Here are the matching properties:";

        appendMessage({
          id: nextId(),
          role: "assistant",
          text: replyText,
          timestamp: new Date().toISOString(),
          properties: Array.isArray(data?.properties) ? data.properties : [],
          isPrototypeData: Boolean(data?.isPrototypeData),
        });
      } catch (err) {
        const isApiError = err instanceof SuDomusApiError;
        setBackendStatus(isApiError ? "online" : "offline");
        appendMessage({
          id: nextId(),
          role: "assistant",
          text: isApiError
            ? err.message
            : "I'm having trouble connecting right now. Please check your connection and try again.",
          timestamp: new Date().toISOString(),
          isError: true,
        });
      } finally {
        setIsThinking(false);
      }
    },
    [appendMessage, isThinking]
  );

  const handleReset = () => {
    setMessages([]);
    conversationIdRef.current = undefined;
  };

  return (
    <div className={`sudomus-ai ${isFloating ? "sudomus-ai--floating" : ""}`}>
      <header className="sudomus-ai__header">
        <div className="sudomus-ai__brand">
          <div className="sudomus-ai__mark" aria-hidden="true">SD</div>
          <div>
            <h1 className="sudomus-ai__title">SuDomus AI</h1>
            <p className="sudomus-ai__subtitle">Your intelligent real-estate assistant</p>
          </div>
        </div>

        <div className="sudomus-ai__actions">
          {messages.length > 0 && (
            <button
              type="button"
              className="sudomus-ai__reset-btn"
              onClick={handleReset}
              title="Start a new conversation"
              aria-label="New chat"
            >
              New Chat
            </button>
          )}

          <div
            className={`sudomus-ai__status sudomus-ai__status--${backendStatus}`}
            title={backendStatus === "online" ? "Connected" : "Connection issue"}
          >
            <span className="sudomus-ai__status-dot" />
            {backendStatus === "online" ? "Online" : "Reconnecting"}
          </div>

          {onClose && (
            <button
              type="button"
              className="sudomus-ai__close-btn"
              onClick={onClose}
              aria-label="Close AI Assistant"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </header>

      <ChatWindow
        messages={messages}
        isThinking={isThinking}
        onSuggestionSelect={handleSend}
      />

      <ChatInput onSend={handleSend} disabled={isThinking} />
    </div>
  );
}
