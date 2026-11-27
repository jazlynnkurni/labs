import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import App from "./App.jsx";
import "./index.css";
import { IntroGate } from "./intro/Intro.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <IntroGate>
      <App />
    </IntroGate>
  </StrictMode>,
);
