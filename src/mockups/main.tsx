import React from "react";
import { createRoot } from "react-dom/client";
import { MotionConfig } from "motion/react";
import "./fonts.css";
import { DirectionA } from "./DirectionA";
import { DirectionB } from "./DirectionB";
import { LoginA, LoginB } from "./Logins";
import { AppB2 } from "./b2/AppB2";
import { LoginB2 } from "./b2/LoginB2";

// Página solo para enseñar las propuestas: /mockups.html?v=a | ?v=b  (&m=1 para móvil)
const q = new URLSearchParams(location.search);
const v = q.get("v") ?? "a";
const mobile = q.get("m") === "1";
const login = q.get("p") === "login";
const page = q.get("page") ?? undefined;
const sub = q.get("sub") ?? undefined;
const dark = q.get("t") === "dark";

createRoot(document.getElementById("root")!).render(
  <MotionConfig reducedMotion="user">
    {v === "b2" ? (login ? <LoginB2 initialDark={dark} /> : <AppB2 mobile={mobile} initialPage={page} initialSub={sub} initialDark={dark} />)
      : login ? (v === "a" ? <LoginA /> : <LoginB mobile={mobile} />) : v === "a" ? <DirectionA mobile={mobile} /> : <DirectionB mobile={mobile} initialPage={page} initialSub={sub} />}
  </MotionConfig>
);
