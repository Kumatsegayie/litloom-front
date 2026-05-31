// index.js
// ----------------------------------------
// App entry point.
// Renders <App /> into the root DOM node.
// Global styles are loaded here to apply
// across the entire application.
// ----------------------------------------

import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

// global styles
import "./styles/global.css";
import "./styles/variables.css";
import "./styles/animations.css";

// i18n
import "./i18n";
import { installFetchFallback } from "./utils/installFetchFallback";

installFetchFallback();

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
