import React from "react";
import Navbar from "../components/Navbar";
import SuDomusAI from "../components/ai/SuDomusAI";
import "../styles/ai/SuDomusAI.css";
import "./AIAssistant.css";

export default function AIAssistant() {
  return (
    <div className="ai-page-container">
      <Navbar />
      <main className="app-shell-ai">
        <SuDomusAI />
      </main>
    </div>
  );
}
