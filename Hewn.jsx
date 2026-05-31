import React, { useState, useEffect, useRef, useCallback } from "react";
import { Settings, RotateCcw, Minus, Plus, X } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  HEWN — interactive home-screen prototype                          */
/*  Two habits, one stone. Protein polishes the surface; movement     */
/*  sharpens the form; both complete resolves the lighting.           */
/*                                                                    */
/*  Maps 1:1 to FMS components:                                       */
/*  MetricBlock · ProgressLine · ChipRow · QuickAddChip · Artifact    */
/*  · ConfirmationToast · SettingsSheet                               */
/* ------------------------------------------------------------------ */

const C = {
  base: "#F4F1EA",
  ink: "#1A1815",
  inkMute: "rgba(26,24,21,0.40)",
  inkFaint: "rgba(26,24,21,0.10)",
  accent: "#BE7A4E",
  accentSoft: "rgba(190,122,78,0.16)",
};

function lerp(a, b, t) { return a + (b - a) * t; }

/* ---- the stone ---------------------------------------------------- */
function Stone({ polish, definition, complete }) {
  // protein -> polish (surface luminosity), movement -> definition (edge crispness)
  const disp = (1 - (polish * 0.5 + definition * 0.5)) * 5.5; // raw wobble from both
  const edgeBlur = (1 - definition) * 1.35 + 0.15;            // movement crisps silhouette
  const chalk = (1 - polish) * 0.82;                          // protein washes off chalk
  const spec = polish * 0.72;                                 // specular grows with polish
  const glow = complete ? 1 : 0;

  return (
    <svg viewBox="0 0 200 300" width="100%" height="100%" style={{ display: "block" }}>
      <defs>
        <radialGradient id="marble" cx="38%" cy="28%" r="78%">
          <stop offset="0%" stopColor="#F1ECE1" />
          <stop offset="48%" stopColor="#CBC0A9" />
          <stop offset="100%" stopColor="#8F8369" />
        </radialGradient>
        <radialGradient id="halo" cx="50%" cy="42%" r="60%">
          <stop offset="0%" stopColor="rgba(190,122,78,0.30)" />
          <stop offset="100%" stopColor="rgba(190,122,78,0)" />
        </radialGradient>
        <filter id="stone" x="-25%" y="-25%" width="150%" height="150%">
          <feTurbulence type="fractalNoise" baseFrequency="0.82" numOctaves="2" seed="7" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale={disp}
            xChannelSelector="R" yChannelSelector="G" result="d" />
          <feGaussianBlur in="d" stdDeviation={edgeBlur} />
        </filter>
        <filter id="soft"><feGaussianBlur stdDeviation="6" /></filter>
      </defs>

      {/* completion halo */}
      <ellipse cx="100" cy="128" rx="92" ry="104" fill="url(#halo)"
        style={{ opacity: glow, transition: "opacity 1400ms ease" }} />

      {/* grounding shadow */}
      <ellipse cx="100" cy="270" rx="50" ry="7" fill="#1A1815"
        filter="url(#soft)" opacity="0.18" />
      {/* plinth */}
      <rect x="56" y="256" width="88" height="9" rx="3" fill="#a99c83" />
      <rect x="56" y="256" width="88" height="3" rx="2" fill="#c5b99f" />

      {/* the form */}
      <g filter="url(#stone)"
        style={{ transition: "filter 60ms linear", transformOrigin: "100px 145px" }}
        className={complete ? "hewn-settle" : ""}>
        <path
          d="M100 32 C124 32 143 70 147 120 C151 168 138 213 116 241 C108 251 92 251 84 241 C62 213 49 168 53 120 C57 70 76 32 100 32 Z"
          fill="url(#marble)" />
        {/* chalk wash (raw matte) */}
        <path
          d="M100 32 C124 32 143 70 147 120 C151 168 138 213 116 241 C108 251 92 251 84 241 C62 213 49 168 53 120 C57 70 76 32 100 32 Z"
          fill="#DED7C7" style={{ opacity: chalk, transition: "opacity 90ms linear" }} />
        {/* specular */}
        <ellipse cx="80" cy="92" rx="20" ry="34" fill="#FFFDF6"
          style={{ opacity: spec, transition: "opacity 90ms linear" }}
          transform="rotate(-18 80 92)" filter="url(#soft)" />
      </g>
    </svg>
  );
}

/* ---- progress line ------------------------------------------------ */
function ProgressLine({ pct }) {
  return (
    <div style={{ position: "relative", height: 1.5, background: C.inkFaint, borderRadius: 2 }}>
      <div style={{
        position: "absolute", left: 0, top: 0, bottom: 0, width: `${pct * 100}%`,
        background: C.accent, borderRadius: 2, transition: "width 420ms cubic-bezier(.25,.1,.25,1)",
      }} />
    </div>
  );
}

/* ---- quick-add chip ----------------------------------------------- */
function Chip({ label, onTap, dim }) {
  const [press, setPress] = useState(false);
  return (
    <button
      onPointerDown={() => setPress(true)}
      onPointerUp={() => setPress(false)}
      onPointerLeave={() => setPress(false)}
      onClick={onTap}
      disabled={dim}
      style={{
        flex: 1, height: 58, border: "none", borderRadius: 16, cursor: dim ? "default" : "pointer",
        background: press ? C.accentSoft : "rgba(26,24,21,0.045)",
        color: dim ? C.inkMute : C.ink,
        fontFamily: "'Hanken Grotesk', sans-serif", fontSize: 17, fontWeight: 500,
        letterSpacing: "0.01em", opacity: dim ? 0.45 : 1,
        transition: "background 160ms ease, transform 160ms cubic-bezier(.25,.1,.25,1)",
        transform: press ? "scale(0.97)" : "scale(1)",
        WebkitTapHighlightColor: "transparent",
      }}>
      {label}
    </button>
  );
}

/* ---- metric block ------------------------------------------------- */
function Metric({ name, value, target, unit, chips, onAdd, done }) {
  const pct = Math.min(1, value / target);
  return (
    <div>
      <div style={{
        fontFamily: "'Hanken Grotesk', sans-serif", fontSize: 11.5, fontWeight: 600,
        letterSpacing: "0.22em", textTransform: "uppercase", color: C.inkMute, marginBottom: 6,
      }}>{name}</div>
      <div style={{ fontFamily: "'Fraunces', serif", fontSize: 42, fontWeight: 400, lineHeight: 1, marginBottom: 14 }}>
        <span style={{ color: C.ink }}>{Math.round(value)}</span>
        <span style={{ color: C.inkMute, fontSize: 26 }}> / {target} {unit}</span>
      </div>
      <ProgressLine pct={pct} />
      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
        {chips.map((c) => (
          <Chip key={c} label={`+${c}`} dim={done} onTap={() => onAdd(c)} />
        ))}
      </div>
    </div>
  );
}

/* ---- settings sheet ----------------------------------------------- */
function Stepper({ value, step, unit, onChange }) {
  const btn = {
    width: 40, height: 40, borderRadius: 12, border: "none", cursor: "pointer",
    background: "rgba(26,24,21,0.05)", color: C.ink, display: "grid", placeItems: "center",
  };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      <button style={btn} onClick={() => onChange(-step)}><Minus size={16} /></button>
      <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, minWidth: 78, textAlign: "center" }}>
        {value} {unit}
      </div>
      <button style={btn} onClick={() => onChange(step)}><Plus size={16} /></button>
    </div>
  );
}

/* ---- app ---------------------------------------------------------- */
export default function Hewn() {
  const [pTarget, setPTarget] = useState(100);
  const [mTarget, setMTarget] = useState(30);
  const [pTo, setPTo] = useState(0);   // target value (where animation heads)
  const [mTo, setMTo] = useState(0);
  const [p, setP] = useState(0);       // animated displayed value
  const [m, setM] = useState(0);
  const [toast, setToast] = useState(null);
  const [settings, setSettings] = useState(false);
  const undo = useRef([]);
  const toastT = useRef(null);
  const raf = useRef(null);

  // eased animation loop
  useEffect(() => {
    const tick = () => {
      setP((v) => (Math.abs(pTo - v) < 0.25 ? pTo : lerp(v, pTo, 0.14)));
      setM((v) => (Math.abs(mTo - v) < 0.05 ? mTo : lerp(v, mTo, 0.14)));
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [pTo, mTo]);

  // load fonts
  useEffect(() => {
    const l = document.createElement("link");
    l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500&family=Hanken+Grotesk:wght@500;600&display=swap";
    document.head.appendChild(l);
    return () => { document.head.removeChild(l); };
  }, []);

  const flash = useCallback((msg, withUndo) => {
    setToast({ msg, withUndo });
    clearTimeout(toastT.current);
    toastT.current = setTimeout(() => setToast(null), 1700);
  }, []);

  const addP = (g) => {
    const next = Math.min(pTarget, pTo + g);
    if (next === pTo) { flash("Enough for now", false); return; }
    undo.current.push(["p", pTo]); setPTo(next);
    navigator.vibrate?.(8); flash("Logged", true);
  };
  const addM = (min) => {
    const next = Math.min(mTarget, mTo + min);
    if (next === mTo) { flash("Enough for now", false); return; }
    undo.current.push(["m", mTo]); setMTo(next);
    navigator.vibrate?.(8); flash("Logged", true);
  };
  const doUndo = () => {
    const last = undo.current.pop();
    if (!last) return;
    if (last[0] === "p") setPTo(last[1]); else setMTo(last[1]);
    setToast(null);
  };
  const newDay = () => { setPTo(0); setMTo(0); undo.current = []; setToast(null); };

  const pDone = p >= pTarget - 0.5;
  const mDone = m >= mTarget - 0.5;
  const complete = pDone && mDone;
  const headline = complete ? "Enough for now" : "Today is still open";
  const sub = complete ? "Saved to your collection" : null;

  return (
    <div style={{
      minHeight: "100vh", width: "100%", background: "#2A2722",
      display: "grid", placeItems: "center", padding: "28px 0",
      fontFamily: "'Hanken Grotesk', sans-serif",
    }}>
      <style>{`
        @keyframes hewnBreathe { 0%,100%{transform:scale(1)} 50%{transform:scale(1.012)} }
        .hewn-breathe { animation: hewnBreathe 6s ease-in-out infinite; transform-origin:center; }
        @keyframes hewnSettle { 0%{transform:rotate(-1.5deg)} 60%{transform:rotate(1deg)} 100%{transform:rotate(0)} }
        .hewn-settle { animation: hewnSettle 3.6s cubic-bezier(.25,.1,.25,1); }
        @keyframes hewnFade { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
        button:focus { outline: none; }
      `}</style>

      {/* device frame */}
      <div style={{
        position: "relative", width: 375, height: 760, background: C.base, color: C.ink,
        borderRadius: 44, overflow: "hidden", boxShadow: "0 40px 90px rgba(0,0,0,0.45)",
        display: "flex", flexDirection: "column", padding: "22px 26px 26px",
      }}>
        {/* grain */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.05, mixBlendMode: "multiply",
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
        }} />

        {/* settings glyph */}
        <button onClick={() => setSettings(true)} style={{
          position: "absolute", top: 22, right: 24, border: "none", background: "none",
          color: C.inkMute, cursor: "pointer", padding: 4, zIndex: 3,
        }}><Settings size={18} strokeWidth={1.6} /></button>

        {/* protein */}
        <div style={{ marginTop: 14 }}>
          <Metric name="Protein" value={p} target={pTarget} unit="g"
            chips={[10, 20, 30]} onAdd={addP} done={pDone} />
        </div>

        {/* stone */}
        <div className="hewn-breathe" style={{ flex: 1, margin: "4px 0", minHeight: 0 }}>
          <Stone polish={Math.min(1, p / pTarget)} definition={Math.min(1, m / mTarget)} complete={complete} />
        </div>

        {/* calm status line */}
        <div style={{ textAlign: "center", marginBottom: 18, minHeight: 34 }}>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 17, color: complete ? C.accent : C.inkMute, transition: "color 600ms" }}>
            {headline}
          </div>
          {sub && <div style={{ fontSize: 12, color: C.inkMute, marginTop: 3, animation: "hewnFade 700ms ease" }}>{sub}</div>}
        </div>

        {/* movement */}
        <Metric name="Movement" value={m} target={mTarget} unit="min"
          chips={[5, 10, 15]} onAdd={addM} done={mDone} />

        {/* new-day (prototype control) */}
        <button onClick={newDay} style={{
          marginTop: 16, alignSelf: "center", border: "none", background: "none", cursor: "pointer",
          color: C.inkMute, fontSize: 12, letterSpacing: "0.04em", display: "flex", alignItems: "center", gap: 6,
        }}><RotateCcw size={12} /> New day</button>

        {/* toast */}
        {toast && (
          <div style={{
            position: "absolute", left: "50%", bottom: 96, transform: "translateX(-50%)",
            display: "flex", alignItems: "center", gap: 14, padding: "10px 18px",
            background: "rgba(26,24,21,0.9)", color: C.base, borderRadius: 100, zIndex: 4,
            fontSize: 13.5, animation: "hewnFade 240ms ease", backdropFilter: "blur(6px)",
          }}>
            <span>{toast.msg}</span>
            {toast.withUndo && (
              <button onClick={doUndo} style={{
                border: "none", background: "none", color: C.accent, cursor: "pointer",
                fontSize: 13.5, fontWeight: 600, padding: 0,
              }}>Undo</button>
            )}
          </div>
        )}

        {/* settings sheet */}
        {settings && (
          <>
            <div onClick={() => setSettings(false)} style={{ position: "absolute", inset: 0, background: "rgba(26,24,21,0.25)", zIndex: 5 }} />
            <div style={{
              position: "absolute", left: 0, right: 0, bottom: 0, zIndex: 6, background: C.base,
              borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: "26px 26px 34px",
              boxShadow: "0 -20px 50px rgba(0,0,0,0.2)", animation: "hewnFade 260ms ease",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 26 }}>
                <span style={{ fontFamily: "'Fraunces', serif", fontSize: 22 }}>Targets</span>
                <button onClick={() => setSettings(false)} style={{ border: "none", background: "none", cursor: "pointer", color: C.inkMute }}><X size={18} /></button>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22 }}>
                <span style={{ fontSize: 11.5, letterSpacing: "0.18em", textTransform: "uppercase", color: C.inkMute }}>Protein</span>
                <Stepper value={pTarget} step={5} unit="g" onChange={(d) => setPTarget((v) => Math.max(20, v + d))} />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 11.5, letterSpacing: "0.18em", textTransform: "uppercase", color: C.inkMute }}>Movement</span>
                <Stepper value={mTarget} step={5} unit="min" onChange={(d) => setMTarget((v) => Math.max(5, v + d))} />
              </div>
              <div style={{ marginTop: 28, fontSize: 12.5, color: C.inkMute, lineHeight: 1.5 }}>
                A gentle reminder, off by default. These are set — change them anytime.
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
