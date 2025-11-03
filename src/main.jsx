import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./styles/swiper-parallax.css";
import App from "./App.jsx";
import fontLoader from "./utils/font-loader.js";

// Initialize font loader early for PDF rendering
fontLoader.initialize().catch((error) => {
  console.warn("Font loader initialization failed:", error);
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
