import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

const originTrials = [
  { name: "translator-token", content: import.meta.env.VITE_TRANSLATOR_TOKEN },
  {
    name: "language-detector-token",
    content: import.meta.env.VITE_LANGUAGE_DETECTOR_TOKEN,
  },
  { name: "summarizer-token", content: import.meta.env.VITE_SUMMARIZER_TOKEN },
];

originTrials.forEach(({ content }) => {
  if (content) {
    const metaTag = document.createElement("meta");
    metaTag.httpEquiv = "origin-trial";
    metaTag.content = content;
    document.head.appendChild(metaTag);
  }
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
