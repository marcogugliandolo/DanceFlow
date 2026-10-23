import React from "react";
import { createRoot } from "react-dom/client";
import { MotionConfig } from "motion/react";
import "./fonts.css";
import { DirectionA } from "./DirectionA";
import { DirectionB } from "./DirectionB";
import { LoginA, LoginB } from "./Logins";

// Página solo para enseñar las propuestas: /mockups.html?v=a | ?v=b  (&m=1 para móvil)
const q = new URLSearchParams(location.search);
const v = q.get("v") ?? "a";
const mobile = q.get("m") === "1";
const login = q.get("p") === "login";

createRoot(document.getElementById("root")!).render(
  <MotionConfig reducedMotion="user">
    {login ? (v === "a" ? <LoginA /> : <LoginB mobile={mobile} />) : v === "a" ? <DirectionA mobile={mobile} /> : <DirectionB mobile={mobile} />}
  </MotionConfig>
);
