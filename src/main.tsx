import React from "react";
import { createRoot } from "react-dom/client";
import App from "./app/App";
import "./styles/index.css";

document.documentElement.classList.toggle(
  "dark",
  localStorage.getItem("quicksplitTheme") === "dark"
);

createRoot(document.getElementById("root")!).render(<App />);
