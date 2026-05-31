import React, { useState, useEffect, useRef, useCallback } from "react";
import * as THREE from "three";
import { Settings, RotateCcw, Minus, Plus, X } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  HEWN — production stone prototype (WebGL)                         */
/*  Protein -> material (polish / sheen / reflection).                */
/*  Movement -> form (vertex displacement, rough-hewn -> resolved).   */
/*  Both complete -> 4s present-rotation + warm resolved lighting.    */
/* ------------------------------------------------------------------ */

const C = {
  base: "#F4F1EA", ink: "#1A1815",
  inkMute: "rgba(26,24,21,0.40)", inkFaint: "rgba(26,24,21,0.10)",
  accent: "#BE7A4E", accentSoft: "rgba(190,122,78,0.16)",
};
const lerp = (a, b, t) => a + (b - a) * t;
const easeIO = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/* ---- radial canvas texture (shadow / halo) ------------------------ */
function radialTex(inner, outer) {
  const cv = document.createElement("canvas");
  cv.width = cv.height = 256;
  const g = cv.getContext("2d");
  const grd = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  grd.addColorStop(0, inner); grd.addColorStop(1, outer);
  g.fillStyle = grd; g.fillRect(0, 0, 256, 256);
  return new THREE.CanvasTexture(cv);
}

/* ---- equirect studio gradient for reflections --------------------- */
function studioEquirect() {
  const cv = document.createElement("canvas");
  cv.width = 512; cv.height = 256;
  const g = cv.getContext("2d");
  const grd = g.createLinearGradient(0, 0, 0, 256);
  grd.addColorStop(0.0, "#cfd4d8");   // cool sky
  grd.addColorStop(0.32, "#f1ede3");  // light
  grd.addColorStop(0.55, "#e7dbc4");  // warm
  grd.addColorStop(0.78, "#6b6354");  // ground
  grd.addColorStop(1.0, "#3a352f");   // floor
  g.fillStyle = grd; g.fillRect(0, 0, 512, 256);
  const t = new THREE.CanvasTexture(cv);
  t.mapping = THREE.EquirectangularReflectionMapping;
  return t;
}

/* ---- the WebGL stone ---------------------------------------------- */
function StoneCanvas({ polish, definition, complete }) {
  const mount = useRef(null);
  const api = useRef(null);

  useEffect(() => {
    const node = mount.current;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    node.appendChild(renderer.domElement);
    renderer.domElement.style.display = "block";
    renderer.domElement.style.touchAction = "none";
    renderer.domElement.style.cursor = "grab";

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
    camera.position.set(0, 0.05, 5.2);
    camera.lookAt(0, 0, 0);

    // environment (soft reflections only; background stays transparent)
    const pmrem = new THREE.PMREMGenerator(renderer);
    pmrem.compileEquirectangularShader();
    const eq = studioEquirect();
    const envRT = pmrem.fromEquirectangular(eq);
    scene.environment = envRT.texture;
    eq.dispose();

    // lights
    const hemi = new THREE.HemisphereLight(0xf4efe6, 0x4a4338, 0.55); scene.add(hemi);
    const key = new THREE.DirectionalLight(0xfff6e8, 1.15); key.position.set(-3, 5, 4); scene.add(key);
    const fill = new THREE.DirectionalLight(0xdfe6ee, 0.32); fill.position.set(4, 1, 3); scene.add(fill);
    const rim = new THREE.DirectionalLight(0xffffff, 0.42); rim.position.set(0, 2.5, -5); scene.add(rim);
    const accent = new THREE.DirectionalLight(0xd98a4f, 0.0); accent.position.set(2, 3, 3); scene.add(accent);

    const group = new THREE.Group();
    group.scale.setScalar(0.82);
    scene.add(group);

    // ---- lathe-revolved Brancusi egg / seed --------------------------
    const N = 48, SEG = 72, RMAX = 0.62, yBot = -1.25, yTop = 1.35;
    const pts = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const y = yBot + (yTop - yBot) * t;
      const r = Math.sin(Math.PI * Math.pow(t, 0.7)) * RMAX;
      pts.push(new THREE.Vector2(Math.max(0.0001, r), y));
    }
    const geo = new THREE.LatheGeometry(pts, SEG);
    geo.computeVertexNormals();

    const posAttr = geo.attributes.position, normAttr = geo.attributes.normal;
    const count = posAttr.count;
    const basePos = Float32Array.from(posAttr.array);
    const baseNorm = Float32Array.from(normAttr.array);

    // per-vertex noise + pole weighting
    const MAXAMP = 0.085;
    const noise = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const x = basePos[i * 3], y = basePos[i * 3 + 1], z = basePos[i * 3 + 2];
      let n = 0.55 * Math.sin(3.1 * x + 1.7) * Math.cos(2.7 * y)
        + 0.30 * Math.sin(5.3 * y + 0.6) * Math.sin(4.1 * z)
        + 0.22 * Math.sin(7.0 * (x + z) + 2.0);
      const radial = Math.sqrt(x * x + z * z);
      const w = Math.min(1, radial / 0.22);            // calm the poles
      noise[i] = n * w;
    }
    // rough-state normals (for shading the lumps correctly)
    const roughGeo = geo.clone();
    const rp = roughGeo.attributes.position.array;
    for (let i = 0; i < count; i++) {
      for (let c = 0; c < 3; c++) {
        rp[i * 3 + c] = basePos[i * 3 + c] + baseNorm[i * 3 + c] * noise[i] * MAXAMP;
      }
    }
    roughGeo.computeVertexNormals();
    const roughNorm = Float32Array.from(roughGeo.attributes.normal.array);
    roughGeo.dispose();

    const mat = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#dad2c0"), metalness: 0.0, roughness: 0.92,
      clearcoat: 0.0, clearcoatRoughness: 0.6, envMapIntensity: 0.15,
    });
    const stone = new THREE.Mesh(geo, mat);
    group.add(stone);

    // plinth
    const plinth = new THREE.Mesh(
      new THREE.CylinderGeometry(0.66, 0.7, 0.1, 64),
      new THREE.MeshStandardMaterial({ color: "#a99c83", roughness: 0.75, metalness: 0 })
    );
    plinth.position.y = yBot - 0.06;
    group.add(plinth);

    // contact shadow
    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(2.4, 2.4),
      new THREE.MeshBasicMaterial({ map: radialTex("rgba(20,18,14,0.42)", "rgba(20,18,14,0)"), transparent: true, depthWrite: false })
    );
    shadow.rotation.x = -Math.PI / 2; shadow.position.y = yBot - 0.11;
    group.add(shadow);

    // completion halo (behind, additive)
    const halo = new THREE.Mesh(
      new THREE.PlaneGeometry(4, 4),
      new THREE.MeshBasicMaterial({ map: radialTex("rgba(190,122,78,0.5)", "rgba(190,122,78,0)"), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0 })
    );
    halo.position.set(0, 0.05, -0.6);
    group.add(halo);

    // ---- geometry displacement update --------------------------------
    let lastT = -1;
    const tmp = new THREE.Vector3();
    function applyForm(t) { // t: 0 smooth .. 1 rough
      if (Math.abs(t - lastT) < 0.003) return;
      lastT = t;
      const pa = posAttr.array, na = normAttr.array;
      for (let i = 0; i < count; i++) {
        const k = i * 3, amp = noise[i] * MAXAMP * t;
        pa[k] = basePos[k] + baseNorm[k] * amp;
        pa[k + 1] = basePos[k + 1] + baseNorm[k + 1] * amp;
        pa[k + 2] = basePos[k + 2] + baseNorm[k + 2] * amp;
        tmp.set(
          lerp(baseNorm[k], roughNorm[k], t),
          lerp(baseNorm[k + 1], roughNorm[k + 1], t),
          lerp(baseNorm[k + 2], roughNorm[k + 2], t)
        ).normalize();
        na[k] = tmp.x; na[k + 1] = tmp.y; na[k + 2] = tmp.z;
      }
      posAttr.needsUpdate = true; normAttr.needsUpdate = true;
    }

    // ---- state / loop ------------------------------------------------
    const S = {
      pTar: 0, dTar: 0, cTar: false,   // targets from React
      p: 0, d: 0, warm: 0,             // eased
      presenting: false, presentEl: 0, prevC: false,
      rot: 0, t0: performance.now(),
      dragging: false, tiltTX: 0, tiltTY: 0, tiltX: 0, tiltY: 0,
    };
    api.current = (pol, def, comp) => { S.pTar = pol; S.dTar = def; S.cTar = comp; };

    // ---- gentle tip-and-return touch interaction ---------------------
    const el = renderer.domElement;
    const TILT_MAX = 0.20, K = 0.006;
    let px = 0, py = 0;
    const onDown = (e) => {
      S.dragging = true; px = e.clientX; py = e.clientY;
      el.setPointerCapture?.(e.pointerId); el.style.cursor = "grabbing";
      navigator.vibrate?.(6);
    };
    const onMove = (e) => {
      if (!S.dragging) return;
      const dx = e.clientX - px, dy = e.clientY - py; px = e.clientX; py = e.clientY;
      S.tiltTY = Math.max(-TILT_MAX, Math.min(TILT_MAX, S.tiltTY + dx * K));
      S.tiltTX = Math.max(-TILT_MAX, Math.min(TILT_MAX, S.tiltTX + dy * K));
    };
    const onUp = () => { S.dragging = false; S.tiltTX = 0; S.tiltTY = 0; el.style.cursor = "grab"; };
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);

    const colRaw = new THREE.Color("#dad2c0");
    const colPol = new THREE.Color("#ece3d0");
    const colWarm = new THREE.Color("#f1e2c6");

    let raf;
    function frame() {
      const now = performance.now();
      const dt = Math.min(0.05, (now - S.t0) / 1000); S.t0 = now;
      const time = now / 1000;

      // ease material + form
      S.p = lerp(S.p, S.pTar, 0.10);
      S.d = lerp(S.d, S.dTar, 0.10);
      const warmGoal = S.cTar ? 1 : 0;
      S.warm = lerp(S.warm, warmGoal, 0.06);

      // protein -> material
      mat.roughness = lerp(0.92, 0.16, S.p);
      mat.clearcoat = lerp(0.0, 0.5, S.p);
      mat.clearcoatRoughness = lerp(0.6, 0.12, S.p);
      mat.envMapIntensity = lerp(0.15, 1.0, S.p);
      mat.color.copy(colRaw).lerp(colPol, S.p).lerp(colWarm, S.warm * 0.5);

      // movement -> form
      applyForm(1 - S.d);

      // completion present
      if (S.cTar && !S.prevC) { S.presenting = true; S.presentEl = 0; }
      S.prevC = S.cTar;

      accent.intensity = S.warm * 0.9;
      halo.material.opacity = S.warm * 0.6;

      S.rot += (S.dragging ? 0.02 : 0.16) * dt; // idle turn nearly pauses while held
      let spin = 0;
      if (S.presenting) {
        S.presentEl += dt;
        const pr = Math.min(1, S.presentEl / 4);
        spin = easeIO(pr) * Math.PI * 2;
        if (pr >= 1) { S.presenting = false; S.rot += Math.PI * 2; }
      }
      // tip-and-return: ease toward target (0 when released), no overshoot
      S.tiltX = lerp(S.tiltX, S.tiltTX, 0.12);
      S.tiltY = lerp(S.tiltY, S.tiltTY, 0.12);
      group.rotation.x = S.tiltX;
      group.rotation.y = S.rot + spin + S.tiltY;
      group.scale.setScalar(0.82 * (1 + 0.012 * Math.sin(time * (Math.PI * 2) / 6)));

      renderer.render(scene, camera);
      raf = requestAnimationFrame(frame);
    }
    raf = requestAnimationFrame(frame);

    // ---- resize ------------------------------------------------------
    function resize() {
      const w = node.clientWidth, h = node.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h, false);
      camera.aspect = w / h; camera.updateProjectionMatrix();
    }
    resize();
    const ro = new ResizeObserver(resize); ro.observe(node);

    return () => {
      cancelAnimationFrame(raf); ro.disconnect();
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
      geo.dispose(); mat.dispose();
      plinth.geometry.dispose(); plinth.material.dispose();
      shadow.geometry.dispose(); shadow.material.map.dispose(); shadow.material.dispose();
      halo.geometry.dispose(); halo.material.map.dispose(); halo.material.dispose();
      envRT.texture.dispose(); pmrem.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
    };
  }, []);

  useEffect(() => { api.current?.(polish, definition, complete); }, [polish, definition, complete]);

  return <div ref={mount} style={{ width: "100%", height: "100%" }} />;
}

/* ---- UI primitives ------------------------------------------------ */
function ProgressLine({ pct }) {
  return (
    <div style={{ position: "relative", height: 1.5, background: C.inkFaint, borderRadius: 2 }}>
      <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${pct * 100}%`, background: C.accent, borderRadius: 2, transition: "width 420ms cubic-bezier(.25,.1,.25,1)" }} />
    </div>
  );
}
function Chip({ label, onTap, dim }) {
  const [press, setPress] = useState(false);
  return (
    <button onPointerDown={() => setPress(true)} onPointerUp={() => setPress(false)} onPointerLeave={() => setPress(false)} onClick={onTap} disabled={dim}
      style={{ flex: 1, height: 58, border: "none", borderRadius: 16, cursor: dim ? "default" : "pointer",
        background: press ? C.accentSoft : "rgba(26,24,21,0.045)", color: dim ? C.inkMute : C.ink,
        fontFamily: "'Hanken Grotesk', sans-serif", fontSize: 17, fontWeight: 500, letterSpacing: "0.01em",
        opacity: dim ? 0.45 : 1, transition: "background 160ms ease, transform 160ms cubic-bezier(.25,.1,.25,1)",
        transform: press ? "scale(0.97)" : "scale(1)", WebkitTapHighlightColor: "transparent" }}>
      {label}
    </button>
  );
}
function Metric({ name, value, target, unit, chips, onAdd, done }) {
  const pct = Math.min(1, value / target);
  return (
    <div>
      <div style={{ fontFamily: "'Hanken Grotesk', sans-serif", fontSize: 11.5, fontWeight: 600, letterSpacing: "0.22em", textTransform: "uppercase", color: C.inkMute, marginBottom: 6 }}>{name}</div>
      <div style={{ fontFamily: "'Fraunces', serif", fontSize: 42, fontWeight: 400, lineHeight: 1, marginBottom: 14 }}>
        <span style={{ color: C.ink }}>{Math.round(value)}</span>
        <span style={{ color: C.inkMute, fontSize: 26 }}> / {target} {unit}</span>
      </div>
      <ProgressLine pct={pct} />
      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
        {chips.map((c) => <Chip key={c} label={`+${c}`} dim={done} onTap={() => onAdd(c)} />)}
      </div>
    </div>
  );
}
function Stepper({ value, step, unit, onChange }) {
  const btn = { width: 40, height: 40, borderRadius: 12, border: "none", cursor: "pointer", background: "rgba(26,24,21,0.05)", color: C.ink, display: "grid", placeItems: "center" };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
      <button style={btn} onClick={() => onChange(-step)}><Minus size={16} /></button>
      <div style={{ fontFamily: "'Fraunces', serif", fontSize: 22, minWidth: 78, textAlign: "center" }}>{value} {unit}</div>
      <button style={btn} onClick={() => onChange(step)}><Plus size={16} /></button>
    </div>
  );
}

/* ---- app ---------------------------------------------------------- */
export default function Hewn() {
  const [pTarget, setPTarget] = useState(100);
  const [mTarget, setMTarget] = useState(30);
  const [pTo, setPTo] = useState(0);
  const [mTo, setMTo] = useState(0);
  const [p, setP] = useState(0);
  const [m, setM] = useState(0);
  const [toast, setToast] = useState(null);
  const [settings, setSettings] = useState(false);
  const undo = useRef([]); const toastT = useRef(null); const raf = useRef(null);

  useEffect(() => {
    const tick = () => {
      setP((v) => (Math.abs(pTo - v) < 0.25 ? pTo : lerp(v, pTo, 0.14)));
      setM((v) => (Math.abs(mTo - v) < 0.05 ? mTo : lerp(v, mTo, 0.14)));
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [pTo, mTo]);

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
    undo.current.push(["p", pTo]); setPTo(next); navigator.vibrate?.(8); flash("Logged", true);
  };
  const addM = (min) => {
    const next = Math.min(mTarget, mTo + min);
    if (next === mTo) { flash("Enough for now", false); return; }
    undo.current.push(["m", mTo]); setMTo(next); navigator.vibrate?.(8); flash("Logged", true);
  };
  const doUndo = () => {
    const last = undo.current.pop(); if (!last) return;
    if (last[0] === "p") setPTo(last[1]); else setMTo(last[1]); setToast(null);
  };
  const newDay = () => { setPTo(0); setMTo(0); undo.current = []; setToast(null); };

  const pDone = pTo >= pTarget - 0.5;
  const mDone = mTo >= mTarget - 0.5;
  const complete = pDone && mDone;
  const headline = complete ? "Enough for now" : "Today is still open";
  const sub = complete ? "Saved to your collection" : null;

  return (
    <div style={{ minHeight: "100vh", width: "100%", background: "#2A2722", display: "grid", placeItems: "center", padding: "28px 0", fontFamily: "'Hanken Grotesk', sans-serif" }}>
      <style>{`
        @keyframes hewnFade { from{opacity:0;transform:translateY(4px)} to{opacity:1;transform:translateY(0)} }
        button:focus { outline: none; }
      `}</style>

      <div style={{ position: "relative", width: 375, height: 760, background: C.base, color: C.ink, borderRadius: 44, overflow: "hidden", boxShadow: "0 40px 90px rgba(0,0,0,0.45)", display: "flex", flexDirection: "column", padding: "22px 26px 26px" }}>
        {/* grain */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.05, mixBlendMode: "multiply",
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")", zIndex: 2 }} />

        <button onClick={() => setSettings(true)} style={{ position: "absolute", top: 22, right: 24, border: "none", background: "none", color: C.inkMute, cursor: "pointer", padding: 4, zIndex: 3 }}>
          <Settings size={18} strokeWidth={1.6} />
        </button>

        <div style={{ marginTop: 14 }}>
          <Metric name="Protein" value={p} target={pTarget} unit="g" chips={[10, 20, 30]} onAdd={addP} done={pDone} />
        </div>

        <div style={{ flex: 1, margin: "2px 0", minHeight: 0 }}>
          <StoneCanvas polish={Math.min(1, pTo / pTarget)} definition={Math.min(1, mTo / mTarget)} complete={complete} />
        </div>

        <div style={{ textAlign: "center", marginBottom: 16, minHeight: 34 }}>
          <div style={{ fontFamily: "'Fraunces', serif", fontSize: 17, color: complete ? C.accent : C.inkMute, transition: "color 600ms" }}>{headline}</div>
          {sub && <div style={{ fontSize: 12, color: C.inkMute, marginTop: 3, animation: "hewnFade 700ms ease" }}>{sub}</div>}
        </div>

        <Metric name="Movement" value={m} target={mTarget} unit="min" chips={[5, 10, 15]} onAdd={addM} done={mDone} />

        <button onClick={newDay} style={{ marginTop: 16, alignSelf: "center", border: "none", background: "none", cursor: "pointer", color: C.inkMute, fontSize: 12, letterSpacing: "0.04em", display: "flex", alignItems: "center", gap: 6 }}>
          <RotateCcw size={12} /> New day
        </button>

        {toast && (
          <div style={{ position: "absolute", left: "50%", bottom: 96, transform: "translateX(-50%)", display: "flex", alignItems: "center", gap: 14, padding: "10px 18px", background: "rgba(26,24,21,0.9)", color: C.base, borderRadius: 100, zIndex: 4, fontSize: 13.5, animation: "hewnFade 240ms ease", backdropFilter: "blur(6px)" }}>
            <span>{toast.msg}</span>
            {toast.withUndo && <button onClick={doUndo} style={{ border: "none", background: "none", color: C.accent, cursor: "pointer", fontSize: 13.5, fontWeight: 600, padding: 0 }}>Undo</button>}
          </div>
        )}

        {settings && (
          <>
            <div onClick={() => setSettings(false)} style={{ position: "absolute", inset: 0, background: "rgba(26,24,21,0.25)", zIndex: 5 }} />
            <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, zIndex: 6, background: C.base, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: "26px 26px 34px", boxShadow: "0 -20px 50px rgba(0,0,0,0.2)", animation: "hewnFade 260ms ease" }}>
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
              <div style={{ marginTop: 28, fontSize: 12.5, color: C.inkMute, lineHeight: 1.5 }}>A gentle reminder, off by default. These are set — change them anytime.</div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
