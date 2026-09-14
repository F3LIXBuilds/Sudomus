import React, { useRef, useState } from "react";
import "../../styles/ai/ChatInput.css";

export default function ChatInput({ onSend, disabled }) {
  const [value, setValue] = useState("");
  const textareaRef = useRef(null);

  const resize = () => {
    const node = textareaRef.current;
    if (!node) return;
    node.style.height = "auto";
    node.style.height = `${Math.min(node.scrollHeight, 140)}px`;
  };

  const submit = () => {
    if (!value.trim() || disabled) return;
    onSend(value);
    setValue("");
    requestAnimationFrame(resize);
  };

  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  };

  return (
    <div className="chat-input">
      <div className="chat-input__field">
        <textarea
          ref={textareaRef}
          className="chat-input__textarea"
          placeholder="Ask me to find a property..."
          rows={1}
          value={value}
          disabled={disabled}
          onChange={(event) => {
            setValue(event.target.value);
            resize();
          }}
          onKeyDown={handleKeyDown}
        />
        <button
          type="button"
          className="chat-input__send"
          onClick={submit}
          disabled={disabled || !value.trim()}
          aria-label="Send message"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4 12L20 4L14 20L11 13L4 12Z" fill="currentColor" />
          </svg>
        </button>
      </div>
      <p className="chat-input__hint">Press Enter to send. Use Shift+Enter for a new line.</p>
    </div>
  );
}
