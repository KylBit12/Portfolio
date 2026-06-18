import { useState, useEffect, useRef } from "react";
import { motion, useInView, useAnimation } from "motion/react";
import { ImageWithFallback } from "./components/figma/ImageWithFallback";
import avatarImg from "../imports/avatar.jpg";
import fpsVideo from "../imports/fps_shooter.mp4";
import fpvVideo from "../imports/fpv_drone.mp4";

// ─── Design tokens ────────────────────────────────────────────────────────────

const G = {
  green: "#00ff41",
  cyan: "#00d4ff",
  dim: "#4d7a4d",
  dimmer: "#1e2e1e",
  bg: "#080c08",
  card: "#0d120d",
  border: "rgba(0,255,65,0.15)",
  borderHover: "rgba(0,255,65,0.45)",
  text: "#b8f0b8",
  red: "#ff3333",
  yellow: "#ffcc00",
};

// ─── Global styles ────────────────────────────────────────────────────────────

const globalStyles = `
@keyframes pulse {
  0%, 100% { opacity: 1; box-shadow: 0 0 6px #00ff41; }
  50%       { opacity: 0.4; box-shadow: 0 0 2px #00ff41; }
}
@keyframes blink {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0; }
}
@keyframes matrix-rain {
  0%   { transform: translateY(-100%); opacity: 1; }
  100% { transform: translateY(100vh); opacity: 0; }
}
@keyframes glow-pulse {
  0%, 100% { text-shadow: 0 0 20px rgba(0,255,65,0.4), 0 0 60px rgba(0,255,65,0.1); }
  50%       { text-shadow: 0 0 40px rgba(0,255,65,0.7), 0 0 100px rgba(0,255,65,0.25); }
}
@keyframes scan-line {
  0%   { top: -10%; }
  100% { top: 110%; }
}
@keyframes flicker {
  0%,100% { opacity: 1; }
  92% { opacity: 1; }
  93% { opacity: 0.6; }
  94% { opacity: 1; }
  96% { opacity: 0.8; }
  97% { opacity: 1; }
}
`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function useFadeUp(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: threshold });
  return { ref, inView };
}

// ─── Scanlines ────────────────────────────────────────────────────────────────

function Scanlines() {
  return (
    <>
      {/* Static scan texture */}
      <div
        style={{
          position: "fixed", inset: 0, zIndex: 9998, pointerEvents: "none",
          backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.07) 2px, rgba(0,0,0,0.07) 4px)",
        }}
      />
      {/* Moving scan line */}
      <div
        style={{
          position: "fixed", left: 0, right: 0, height: "3px", zIndex: 9999, pointerEvents: "none",
          background: "linear-gradient(to bottom, transparent, rgba(0,255,65,0.06) 50%, transparent)",
          animation: "scan-line 8s linear infinite",
        }}
      />
    </>
  );
}

// ─── Cursor ───────────────────────────────────────────────────────────────────

function Cursor({ color = G.green }: { color?: string }) {
  return (
    <span
      style={{
        display: "inline-block", width: "0.55em", height: "1em",
        background: color, verticalAlign: "text-bottom",
        animation: "blink 1.06s step-end infinite", marginLeft: 2,
      }}
    />
  );
}

// ─── Terminal window chrome ───────────────────────────────────────────────────

function TermWindow({
  title, children, className, style,
}: {
  title: string; children: React.ReactNode; className?: string; style?: React.CSSProperties;
}) {
  return (
    <div
      className={className}
      style={{
        background: G.card, border: `1px solid ${G.border}`, borderRadius: "0.5rem",
        overflow: "hidden", boxShadow: "0 0 40px rgba(0,255,65,0.04), 0 4px 32px rgba(0,0,0,0.6)",
        animation: "flicker 10s infinite", ...style,
      }}
    >
      <div style={{ background: "#0a0f0a", borderBottom: `1px solid ${G.border}`, padding: "0.5rem 1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: G.red, display: "inline-block" }} />
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: G.yellow, display: "inline-block" }} />
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: G.green, display: "inline-block" }} />
        <span style={{ flex: 1, textAlign: "center", fontSize: "0.65rem", color: G.dim, letterSpacing: "0.08em" }}>{title}</span>
      </div>
      {children}
    </div>
  );
}

// ─── Prompt ───────────────────────────────────────────────────────────────────

function Prompt({ cmd, output }: { cmd: string; output?: string }) {
  return (
    <div style={{ marginBottom: output ? "0.5rem" : 0 }}>
      <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
        <span style={{ color: G.green }}>alex@linux</span>
        <span style={{ color: G.dim }}>:~$</span>
        <span style={{ color: G.text }}>{cmd}</span>
      </div>
      {output && <div style={{ color: G.dim, marginTop: "0.2rem", lineHeight: 1.6 }}>{output}</div>}
    </div>
  );
}

// ─── Section label ────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "2.5rem" }}>
      <span style={{ color: G.green, fontSize: "0.85rem" }}>$</span>
      <span style={{ color: G.text, fontSize: "0.9rem", fontWeight: 600 }}>{children}</span>
      <span style={{ flex: 1, height: 1, background: G.dimmer, marginLeft: "0.5rem" }} />
    </div>
  );
}

// ─── Term button ──────────────────────────────────────────────────────────────

function TermBtn({ children, onClick, primary }: { children: React.ReactNode; onClick?: () => void; primary?: boolean }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: primary ? (hov ? G.green : "rgba(0,255,65,0.08)") : "transparent",
        border: `1px solid ${hov ? G.green : G.border}`,
        color: primary ? (hov ? G.bg : G.green) : G.dim,
        borderRadius: "0.25rem", padding: "0.6rem 1.25rem",
        fontSize: "0.75rem", fontWeight: 600, cursor: "pointer",
        letterSpacing: "0.04em", fontFamily: "inherit",
        transition: "all 0.2s ease",
        boxShadow: hov && primary ? "0 0 20px rgba(0,255,65,0.3)" : "none",
      }}
    >
      {children}
    </button>
  );
}

// ─── Nav ──────────────────────────────────────────────────────────────────────

function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const links = ["about-me", "skills", "web-dev", "websites", "game-dev", "contact"];
  const labels: Record<string, string> = {
    "about-me": "about_me", "skills": "skills", "web-dev": "web_dev",
    "websites": "websites", "game-dev": "game_dev", "contact": "contact",
  };

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <motion.header
      initial={{ y: -60, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        background: scrolled ? "rgba(8,12,8,0.95)" : "transparent",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        borderBottom: scrolled ? `1px solid ${G.border}` : "none",
        transition: "background 0.3s, border-color 0.3s",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 1.5rem", height: "3.5rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ color: G.green, fontSize: "0.9rem", fontWeight: 700, letterSpacing: "0.04em" }}>
          alex@linux<span style={{ color: G.dim }}>:~$</span>
        </span>
        <nav style={{ display: "flex", gap: "2rem", alignItems: "center" }} className="hidden md:flex">
          {links.map((id) => (
            <button
              key={id}
              onClick={() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })}
              style={{ background: "none", border: "none", cursor: "pointer", color: G.dim, fontSize: "0.72rem", letterSpacing: "0.06em", padding: 0, fontFamily: "inherit", transition: "color 0.2s" }}
              onMouseEnter={(e) => ((e.target as HTMLElement).style.color = G.green)}
              onMouseLeave={(e) => ((e.target as HTMLElement).style.color = G.dim)}
            >
              ./{labels[id]}
            </button>
          ))}
        </nav>
        <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)} style={{ background: "none", border: "none", cursor: "pointer", color: G.green, fontSize: "1.2rem" }}>
          {menuOpen ? "✕" : "☰"}
        </button>
      </div>
      {menuOpen && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ background: "rgba(8,12,8,0.98)", borderBottom: `1px solid ${G.border}`, padding: "1rem 1.5rem" }}
          className="md:hidden"
        >
          {links.map((id) => (
            <button key={id} onClick={() => { setMenuOpen(false); document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }); }}
              style={{ display: "block", background: "none", border: "none", cursor: "pointer", color: G.dim, fontSize: "0.85rem", padding: "0.5rem 0", width: "100%", textAlign: "left", fontFamily: "inherit" }}>
              $ ./{labels[id]}
            </button>
          ))}
        </motion.div>
      )}
    </motion.header>
  );
}

// ─── Animated code lines (Hero right panel) ───────────────────────────────────

const codeLines = [
  { t: "comment", v: "// alex.portfolio.ts" },
  { t: "blank", v: "" },
  { t: "keyword", v: "class", rest: " Developer {" },
  { t: "prop", v: "  name", rest: ' = "Alex";' },
  { t: "prop", v: "  focus", rest: ' = ["web", "gamedev"];' },
  { t: "prop", v: "  os", rest: ' = "Arch Linux";' },
  { t: "prop", v: "  editor", rest: ' = "Neovim";' },
  { t: "blank", v: "" },
  { t: "method", v: "  build", rest: "(idea: string): App {" },
  { t: "body", v: "    return ship(idea);" },
  { t: "body", v: "  }" },
  { t: "body", v: "}" },
  { t: "blank", v: "" },
  { t: "comment", v: "// currently: open to work 🟢" },
];

function CodePanel() {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    if (shown >= codeLines.length) return;
    const t = setTimeout(() => setShown((n) => n + 1), shown === 0 ? 400 : 120);
    return () => clearTimeout(t);
  }, [shown]);

  const color = (t: string) => {
    if (t === "comment") return "#4d7a4d";
    if (t === "keyword") return "#c084fc";
    if (t === "method") return G.cyan;
    if (t === "prop") return G.cyan;
    if (t === "body") return G.dim;
    return G.text;
  };

  return (
    <TermWindow title="alex.portfolio.ts — neovim" style={{ width: "100%", maxWidth: 420 }}>
      <div style={{ padding: "1.25rem 1.5rem", fontSize: "0.78rem", lineHeight: 2, minHeight: 320 }}>
        {codeLines.slice(0, shown).map((l, i) => (
          <div key={i} style={{ display: "flex", gap: "1.5rem" }}>
            <span style={{ color: G.dimmer, userSelect: "none", minWidth: "1.5rem", textAlign: "right", fontSize: "0.65rem" }}>{l.t !== "blank" ? i + 1 : ""}</span>
            <span style={{ color: color(l.t) }}>
              {l.v}
              {l.rest && <span style={{ color: G.text }}>{l.rest}</span>}
            </span>
          </div>
        ))}
        {shown >= codeLines.length && (
          <div style={{ display: "flex", gap: "1.5rem" }}>
            <span style={{ color: G.dimmer, userSelect: "none", minWidth: "1.5rem", textAlign: "right", fontSize: "0.65rem" }}>{codeLines.length + 1}</span>
            <Cursor />
          </div>
        )}
      </div>
    </TermWindow>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function Hero() {
  const bootLines = [
    { cmd: "whoami", out: "alex — developer, builder, game creator" },
    { cmd: "cat experience.txt", out: "3+ years: web solutions & game experiences" },
    { cmd: "ls skills/", out: "react/  nodejs/  unity/  unreal/  typescript/" },
  ];
  const [visibleLines, setVisibleLines] = useState(0);

  useEffect(() => {
    bootLines.forEach((_, i) => {
      setTimeout(() => setVisibleLines(i + 1), 400 + i * 900);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section style={{ minHeight: "100vh", display: "flex", alignItems: "center", padding: "0 1.5rem", paddingTop: "5rem" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", width: "100%", display: "grid", gridTemplateColumns: "1fr auto", gap: "4rem", alignItems: "center" }}>

        {/* Left */}
        <div>
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.7 }}>
            <p style={{ color: G.dim, fontSize: "0.72rem", letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: "0.75rem" }}>
              # root access granted
            </p>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.75 }}
            style={{
              fontSize: "clamp(3rem, 9vw, 7rem)", fontWeight: 800, lineHeight: 1,
              letterSpacing: "-0.03em", margin: 0,
              color: G.green,
              animation: "glow-pulse 4s ease-in-out infinite",
            }}
          >
            ALEX
          </motion.h1>

          <motion.h2
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.55, duration: 0.6 }}
            style={{ fontSize: "clamp(1rem, 3vw, 1.75rem)", fontWeight: 400, color: G.cyan, margin: "0.5rem 0 2rem", letterSpacing: "0.12em", textShadow: "0 0 20px rgba(0,212,255,0.4)" }}
          >
            &gt;&gt; DEVELOPER<Cursor color={G.cyan} />
          </motion.h2>

          {/* Boot terminal */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7, duration: 0.5 }}>
            <TermWindow title="alex@linux: ~/portfolio" style={{ maxWidth: 500 }}>
              <div style={{ padding: "1.1rem 1.4rem", lineHeight: 2, fontSize: "0.78rem" }}>
                {bootLines.map((l, i) =>
                  i < visibleLines ? <Prompt key={i} cmd={l.cmd} output={l.out} /> : null
                )}
                {visibleLines < bootLines.length && (
                  <div style={{ display: "flex", gap: "0.4rem" }}>
                    <span style={{ color: G.green }}>alex@linux</span>
                    <span style={{ color: G.dim }}>:~$</span>
                    <Cursor />
                  </div>
                )}
                {visibleLines >= bootLines.length && (
                  <div style={{ display: "flex", gap: "0.4rem", marginTop: "0.25rem" }}>
                    <span style={{ color: G.green }}>alex@linux</span>
                    <span style={{ color: G.dim }}>:~$</span>
                    <Cursor />
                  </div>
                )}
              </div>
            </TermWindow>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.1, duration: 0.5 }}
            style={{ display: "flex", gap: "1rem", marginTop: "1.75rem", flexWrap: "wrap" }}
          >
            <TermBtn primary onClick={() => document.getElementById("web-dev")?.scrollIntoView({ behavior: "smooth" })}>
              ./view_projects.sh
            </TermBtn>
            <TermBtn onClick={() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" })}>
              ./contact.sh
            </TermBtn>
          </motion.div>
        </div>

        {/* Right: code panel only (no avatar here) */}
        <motion.div
          className="hidden lg:block"
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
        >
          <CodePanel />
        </motion.div>
      </div>
    </section>
  );
}

// ─── Avatar frame (used ONCE in About) ───────────────────────────────────────

function AvatarFrame() {
  const [hovered, setHovered] = useState(false);
  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} style={{ position: "relative", width: 280, margin: "0 auto" }}>
      {/* Glitch on hover */}
      {hovered && (
        <>
          <div style={{ position: "absolute", inset: 0, borderRadius: "0.75rem", overflow: "hidden", transform: "translate(5px,-2px)", opacity: 0.35, mixBlendMode: "screen", zIndex: 2, pointerEvents: "none" }}>
            <ImageWithFallback src={avatarImg} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top", filter: "hue-rotate(130deg)" }} />
          </div>
          <div style={{ position: "absolute", inset: 0, borderRadius: "0.75rem", overflow: "hidden", transform: "translate(-5px,2px)", opacity: 0.28, mixBlendMode: "screen", zIndex: 2, pointerEvents: "none" }}>
            <ImageWithFallback src={avatarImg} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top", filter: "hue-rotate(260deg)" }} />
          </div>
        </>
      )}

      {/* Corner brackets */}
      {[0,1,2,3].map((i) => (
        <div key={i} style={{
          position: "absolute", width: 22, height: 22,
          borderTop: i < 2 ? `2px solid ${G.green}` : "none",
          borderBottom: i >= 2 ? `2px solid ${G.green}` : "none",
          borderLeft: i % 2 === 0 ? `2px solid ${G.green}` : "none",
          borderRight: i % 2 === 1 ? `2px solid ${G.green}` : "none",
          top: i < 2 ? -6 : "auto", bottom: i >= 2 ? -6 : "auto",
          left: i % 2 === 0 ? -6 : "auto", right: i % 2 === 1 ? -6 : "auto",
          zIndex: 3, boxShadow: hovered ? `0 0 8px ${G.green}` : "none",
          transition: "box-shadow 0.3s",
        }} />
      ))}

      <div style={{
        borderRadius: "0.75rem", overflow: "hidden", position: "relative", zIndex: 1,
        border: `1px solid ${hovered ? G.green : G.border}`,
        boxShadow: hovered ? "0 0 40px rgba(0,255,65,0.25), 0 0 80px rgba(0,255,65,0.08)" : "none",
        transition: "all 0.3s ease",
      }}>
        <ImageWithFallback
          src={avatarImg}
          alt="Alex — developer with Joker face paint"
          style={{ width: 280, height: 340, objectFit: "cover", objectPosition: "top", display: "block", filter: hovered ? "saturate(1.15)" : "saturate(0.85)", transition: "filter 0.3s" }}
        />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 55%, rgba(0,255,65,0.1) 100%)", pointerEvents: "none" }} />
      </div>

      {/* Status badge */}
      <div style={{
        position: "absolute", bottom: -14, left: "50%", transform: "translateX(-50%)",
        background: G.card, border: `1px solid ${G.border}`, borderRadius: "2rem",
        padding: "0.3rem 0.9rem", fontSize: "0.62rem", color: G.green,
        letterSpacing: "0.1em", display: "flex", alignItems: "center", gap: "0.5rem",
        whiteSpace: "nowrap", zIndex: 4,
      }}>
        <span style={{ width: 6, height: 6, background: G.green, borderRadius: "50%", animation: "pulse 2s infinite", flexShrink: 0 }} />
        ONLINE · AVAILABLE
      </div>
    </div>
  );
}

// ─── About ────────────────────────────────────────────────────────────────────

function About() {
  const { ref, inView } = useFadeUp();
  return (
    <section id="about-me" style={{ padding: "7rem 1.5rem", borderTop: `1px solid ${G.border}` }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <SectionLabel>cat about_me.txt</SectionLabel>
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, ease: "easeOut" }}
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4rem", alignItems: "start" }}
          className="grid-cols-1 md:grid-cols-2"
        >
          <TermWindow title="~/about_me.txt">
            <div style={{ padding: "1.5rem", fontSize: "0.8rem", lineHeight: 2, color: G.text }}>
              <Prompt cmd="cat about_me.txt" />
              <div style={{ marginTop: "1rem", color: G.dim }}>
                <p style={{ marginBottom: "1rem" }}><span style={{ color: G.green }}># </span>Full-stack developer with 3+ years shipping production web apps and interactive game titles.</p>
                <p style={{ marginBottom: "1rem" }}><span style={{ color: G.green }}># </span>Operating at the intersection of systems engineering and creative world-building. Web by day, game dev by night.</p>
                <p style={{ marginBottom: "1.5rem" }}><span style={{ color: G.green }}># </span>UE5 + C++ for FPS and simulation. React + TypeScript + Node.js for scalable web platforms.</p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                  {["arch linux", "neovim", "tmux", "git", "docker", "zsh", "btop"].map((t) => (
                    <span key={t} style={{ border: `1px solid ${G.dimmer}`, color: G.dim, borderRadius: "0.2rem", padding: "0.15rem 0.5rem", fontSize: "0.68rem" }}>{t}</span>
                  ))}
                </div>
              </div>
            </div>
          </TermWindow>

          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2rem" }}>
            <AvatarFrame />
            <div style={{ marginTop: "1rem", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem", width: "100%", maxWidth: 280 }}>
              {[{ val: "3+", label: "yrs_exp" }, { val: "12+", label: "projects" }, { val: "2", label: "domains" }].map((s) => (
                <div key={s.label} style={{ background: G.card, border: `1px solid ${G.border}`, borderRadius: "0.35rem", padding: "0.875rem", textAlign: "center" }}>
                  <p style={{ fontSize: "1.4rem", fontWeight: 800, color: G.green, lineHeight: 1, textShadow: "0 0 16px rgba(0,255,65,0.5)" }}>{s.val}</p>
                  <p style={{ fontSize: "0.6rem", color: G.dim, marginTop: "0.3rem", letterSpacing: "0.06em" }}>{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ─── Skills ───────────────────────────────────────────────────────────────────

const skills = [
  { name: "React", cat: "frontend", lvl: 92 },
  { name: "TypeScript", cat: "language", lvl: 90 },
  { name: "Node.js", cat: "backend", lvl: 85 },
  { name: "Python", cat: "language", lvl: 78 },
  { name: "Unity", cat: "game_engine", lvl: 88 },
  { name: "CSS", cat: "language", lvl: 86 },
  { name: "Unreal 5", cat: "game_engine", lvl: 82 },
  { name: "C++", cat: "language", lvl: 75 },
  { name: "PostgreSQL", cat: "database", lvl: 80 },
  { name: "Docker", cat: "devops", lvl: 76 },
  { name: "Next.js", cat: "framework", lvl: 88 },
  { name: "JS", cat: "language", lvl: 65 },
];

function Skills() {
  const { ref, inView } = useFadeUp();
  return (
    <section id="skills" style={{ padding: "7rem 1.5rem", borderTop: `1px solid ${G.border}` }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <SectionLabel>ls -la skills/</SectionLabel>
        <motion.div ref={ref} initial={{ opacity: 0, y: 40 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7 }}>
          <TermWindow title="~/skills — htop">
            <div style={{ padding: "1.5rem", fontSize: "0.78rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 7rem 4rem", gap: "1rem", color: G.dim, marginBottom: "0.75rem", paddingBottom: "0.5rem", borderBottom: `1px solid ${G.dimmer}` }}>
                <span>NAME</span><span>CATEGORY</span><span style={{ textAlign: "right" }}>LVL</span>
              </div>
              {skills.map((s, i) => (
                <motion.div
                  key={s.name}
                  initial={{ opacity: 0, x: -16 }}
                  animate={inView ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: i * 0.05, duration: 0.4 }}
                >
                  <SkillRow {...s} />
                </motion.div>
              ))}
            </div>
          </TermWindow>
        </motion.div>
      </div>
    </section>
  );
}

function SkillRow({ name, cat, lvl }: { name: string; cat: string; lvl: number }) {
  const [hov, setHov] = useState(false);
  const filled = Math.round(lvl / 10);
  const bar = "█".repeat(filled) + "░".repeat(10 - filled);
  return (
    <div
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: "grid", gridTemplateColumns: "1fr 7rem 4rem", gap: "1rem", padding: "0.45rem 0.5rem", borderRadius: "0.2rem", background: hov ? "rgba(0,255,65,0.04)" : "transparent", transition: "background 0.15s", alignItems: "center" }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <span style={{ color: hov ? G.green : G.text, transition: "color 0.15s", fontWeight: hov ? 600 : 400 }}>{name}</span>
        <span style={{ color: hov ? G.green : G.dimmer, fontSize: "0.65rem" }}>{bar}</span>
      </div>
      <span style={{ color: G.dim, fontSize: "0.7rem" }}>{cat}</span>
      <span style={{ color: lvl >= 85 ? G.green : G.cyan, textAlign: "right", fontWeight: 600 }}>{lvl}%</span>
    </div>
  );
}

// ─── Web Dev ──────────────────────────────────────────────────────────────────

const webProjects = [
  { id: "proj_001", title: "SaaS Analytics Platform", stack: ["Next.js", "TypeScript", "PostgreSQL", "Prisma"], desc: "End-to-end B2B analytics dashboard. Real-time event tracking, funnel visualization, cohort analysis. Handles 2M+ daily events with sub-100ms query times via materialized views.", role: "Lead Full-Stack", status: "PRODUCTION" },
  { id: "proj_002", title: "Developer CLI Toolchain", stack: ["Node.js", "TypeScript", "Rust/WASM"], desc: "Open-source CLI automating dev environment setup, secret management, and deployment pipelines. npm package with 1,400+ weekly downloads. Plugin architecture for extensibility.", role: "Solo Dev", status: "OSS" },
  { id: "proj_003", title: "Headless E-Commerce Storefront", stack: ["React", "GraphQL", "Shopify", "Redis"], desc: "High-performance headless commerce front-end. SSR/ISR for SEO, cart persistence via Redis, custom CMS integration. Lighthouse 98, +40% conversion rate.", role: "Frontend Engineer", status: "PRODUCTION" },
  { id: "proj_004", title: "Real-time Collaboration Tool", stack: ["React", "WebSockets", "Node.js", "MongoDB"], desc: "Multiplayer browser whiteboard with shared canvas, live cursors, and OT-based conflict resolution. Presence awareness, session persistence.", role: "Full-Stack Dev", status: "PRODUCTION" },
];

function WebDev() {
  const { ref, inView } = useFadeUp();
  return (
    <section id="web-dev" style={{ padding: "7rem 1.5rem", borderTop: `1px solid ${G.border}` }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <SectionLabel>cat web_projects.log</SectionLabel>
        <motion.div ref={ref} initial={{ opacity: 0, y: 40 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7 }}>
          <TermWindow title="~/web_projects.log — tail -f">
            <div style={{ padding: "0.5rem 0" }}>
              {webProjects.map((p, i) => (
                <WebRow key={p.id} project={p} index={i} last={i === webProjects.length - 1} />
              ))}
            </div>
          </TermWindow>
        </motion.div>
      </div>
    </section>
  );
}

function WebRow({ project, index, last }: { project: typeof webProjects[0]; index: number; last: boolean }) {
  const [open, setOpen] = useState(false);
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)} style={{ borderBottom: last ? "none" : `1px solid ${G.dimmer}` }}>
      <button
        onClick={() => setOpen(!open)}
        style={{ width: "100%", background: hov ? "rgba(0,255,65,0.03)" : "transparent", border: "none", padding: "1rem 1.5rem", cursor: "pointer", display: "grid", gridTemplateColumns: "2rem 1fr auto auto", gap: "1rem", alignItems: "center", textAlign: "left", fontFamily: "inherit", transition: "background 0.15s" }}
      >
        <span style={{ color: G.dimmer, fontSize: "0.7rem" }}>{String(index + 1).padStart(2, "0")}</span>
        <span style={{ color: hov ? G.green : G.text, fontSize: "0.875rem", fontWeight: 600, transition: "color 0.15s" }}>{project.title}</span>
        <span style={{ fontSize: "0.6rem", color: project.status === "OSS" ? G.cyan : G.green, border: `1px solid ${project.status === "OSS" ? "rgba(0,212,255,0.25)" : "rgba(0,255,65,0.2)"}`, padding: "0.15rem 0.5rem", borderRadius: "0.15rem", letterSpacing: "0.06em" }}>{project.status}</span>
        <span style={{ color: G.dimmer, fontSize: "0.8rem", transition: "transform 0.25s", transform: open ? "rotate(90deg)" : "none", display: "inline-block" }}>▶</span>
      </button>
      {open && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25 }}
          style={{ padding: "0 1.5rem 1.5rem 4rem", borderTop: `1px solid ${G.dimmer}` }}>
          <div style={{ paddingTop: "1rem", fontSize: "0.8rem", lineHeight: 1.8 }}>
            <p style={{ color: G.dim, marginBottom: "0.75rem" }}>{project.desc}</p>
            <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginBottom: "0.5rem" }}>
              {project.stack.map((t) => (
                <span key={t} style={{ fontSize: "0.67rem", color: G.cyan, border: "1px solid rgba(0,212,255,0.2)", padding: "0.15rem 0.5rem", borderRadius: "0.15rem" }}>{t}</span>
              ))}
            </div>
            <p style={{ color: G.dimmer, fontSize: "0.68rem" }}>role: {project.role}</p>
          </div>
        </motion.div>
      )}
    </div>
  );
}

// ─── Website Showcase ─────────────────────────────────────────────────────────

const showcaseSites = [
  {
    id: "site_001",
    name: "DevMetrics",
    tagline: "SaaS Analytics Dashboard",
    description: "A real-time developer analytics platform built for engineering teams. Tracks deployments, error rates, performance budgets, and team velocity in one unified command-center interface.",
    tech: ["Next.js", "TypeScript", "Recharts", "Supabase"],
    accent: "#00d4ff",
    preview: "dashboard",
  },
  {
    id: "site_002",
    name: "PixelShop",
    tagline: "Headless E-Commerce",
    description: "A blazing-fast headless storefront for a streetwear brand. Perfect Lighthouse score, 3D product previews, and a custom checkout flow that reduced cart abandonment by 32%.",
    tech: ["React", "Three.js", "Shopify API", "Redis"],
    accent: "#c084fc",
    preview: "ecommerce",
  },
  {
    id: "site_003",
    name: "DocuFlow",
    tagline: "Documentation Platform",
    description: "An MDX-powered docs site with AI search, code playground, and version control. Adopted by 3 open-source projects — 40k monthly visitors, <1s TTFB on every page.",
    tech: ["Next.js", "MDX", "Algolia", "Vercel"],
    accent: "#00ff41",
    preview: "docs",
  },
];

/* Mini browser mockup rendered purely in CSS/JSX */
function BrowserMockup({ type, accent }: { type: string; accent: string }) {
  if (type === "dashboard") return (
    <div style={{ width: "100%", padding: "0.75rem", fontSize: "0.55rem", color: "#fff", display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      {/* Top stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: "0.35rem" }}>
        {[["2.4M", "Requests"], ["99.9%", "Uptime"], ["42ms", "P95 Lat"], ["0.02%", "Error rate"]].map(([v, l]) => (
          <div key={l} style={{ background: "rgba(255,255,255,0.05)", borderRadius: "0.2rem", padding: "0.35rem 0.4rem" }}>
            <div style={{ color: accent, fontWeight: 700, fontSize: "0.65rem" }}>{v}</div>
            <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.5rem", marginTop: "0.1rem" }}>{l}</div>
          </div>
        ))}
      </div>
      {/* Chart bars */}
      <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: "0.2rem", padding: "0.5rem 0.4rem", display: "flex", alignItems: "flex-end", gap: "0.2rem", height: 50 }}>
        {[60, 80, 45, 90, 70, 85, 55, 95, 65, 75, 88, 72].map((h, i) => (
          <div key={i} style={{ flex: 1, background: accent, borderRadius: "0.1rem", height: `${h}%`, opacity: 0.6 + (i % 3) * 0.13 }} />
        ))}
      </div>
      {/* Table rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.2rem" }}>
        {["/api/events", "/api/users", "/api/metrics"].map((r) => (
          <div key={r} style={{ display: "flex", justifyContent: "space-between", background: "rgba(255,255,255,0.03)", padding: "0.25rem 0.4rem", borderRadius: "0.15rem", color: "rgba(255,255,255,0.45)" }}>
            <span>{r}</span><span style={{ color: accent }}>200</span>
          </div>
        ))}
      </div>
    </div>
  );

  if (type === "ecommerce") return (
    <div style={{ width: "100%", padding: "0.75rem", fontSize: "0.55rem", color: "#fff" }}>
      {/* Hero banner */}
      <div style={{ background: `linear-gradient(135deg, ${accent}22, ${accent}08)`, border: `1px solid ${accent}30`, borderRadius: "0.25rem", padding: "0.75rem", marginBottom: "0.5rem", textAlign: "center" }}>
        <div style={{ color: accent, fontWeight: 700, fontSize: "0.7rem" }}>NEW DROP</div>
        <div style={{ color: "rgba(255,255,255,0.5)", fontSize: "0.5rem" }}>SS24 Collection</div>
      </div>
      {/* Product grid */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.35rem" }}>
        {[["HOODIE", "$89"], ["TEE", "$34"], ["CAP", "$28"]].map(([name, price]) => (
          <div key={name} style={{ background: "rgba(255,255,255,0.04)", borderRadius: "0.2rem", padding: "0.4rem", border: "1px solid rgba(255,255,255,0.06)" }}>
            <div style={{ height: 28, background: `${accent}15`, borderRadius: "0.15rem", marginBottom: "0.3rem" }} />
            <div style={{ color: "rgba(255,255,255,0.7)", fontSize: "0.5rem" }}>{name}</div>
            <div style={{ color: accent, fontWeight: 700, fontSize: "0.55rem" }}>{price}</div>
          </div>
        ))}
      </div>
      {/* CTA */}
      <div style={{ marginTop: "0.5rem", background: accent, borderRadius: "0.15rem", padding: "0.3rem", textAlign: "center", color: "#000", fontWeight: 700, fontSize: "0.55rem" }}>
        ADD TO CART
      </div>
    </div>
  );

  // docs
  return (
    <div style={{ width: "100%", padding: "0.75rem", fontSize: "0.55rem", color: "#fff", display: "flex", gap: "0.5rem" }}>
      {/* Sidebar */}
      <div style={{ width: 55, flexShrink: 0, display: "flex", flexDirection: "column", gap: "0.25rem" }}>
        {["Getting Started", "Installation", "API Reference", "Components", "Changelog"].map((item, i) => (
          <div key={item} style={{ padding: "0.2rem 0.35rem", borderRadius: "0.15rem", background: i === 0 ? `${accent}20` : "transparent", color: i === 0 ? accent : "rgba(255,255,255,0.3)", fontSize: "0.48rem", borderLeft: i === 0 ? `2px solid ${accent}` : "2px solid transparent" }}>
            {item}
          </div>
        ))}
      </div>
      {/* Content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.35rem" }}>
        <div style={{ color: accent, fontWeight: 700, fontSize: "0.65rem" }}>Getting Started</div>
        <div style={{ height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 2, width: "90%" }} />
        <div style={{ height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 2, width: "75%" }} />
        <div style={{ background: "rgba(0,0,0,0.4)", borderRadius: "0.2rem", padding: "0.35rem", marginTop: "0.15rem" }}>
          <div style={{ color: accent, fontSize: "0.48rem", fontFamily: "monospace" }}>$ npm install docuflow</div>
          <div style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.48rem", fontFamily: "monospace", marginTop: "0.15rem" }}>✓ installed in 2.3s</div>
        </div>
        <div style={{ height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 2, width: "80%" }} />
      </div>
    </div>
  );
}

function WebsiteCard({ site, index }: { site: typeof showcaseSites[0]; index: number }) {
  const { ref, inView } = useFadeUp(0.1);
  const [hov, setHov] = useState(false);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6, delay: index * 0.15 }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: G.card,
        border: `1px solid ${hov ? site.accent + "60" : G.border}`,
        borderRadius: "0.5rem",
        overflow: "hidden",
        transition: "all 0.3s ease",
        boxShadow: hov ? `0 0 40px ${site.accent}18, 0 8px 32px rgba(0,0,0,0.5)` : "none",
        transform: hov ? "translateY(-6px)" : "none",
      }}
    >
      {/* Browser chrome */}
      <div style={{ background: "#0a0f0a", borderBottom: `1px solid ${G.border}`, padding: "0.5rem 1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: G.red }} />
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: G.yellow }} />
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: G.green }} />
        {/* URL bar */}
        <div style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: `1px solid ${G.dimmer}`, borderRadius: "0.2rem", padding: "0.15rem 0.5rem", marginLeft: "0.5rem", fontSize: "0.6rem", color: G.dim, display: "flex", alignItems: "center", gap: "0.3rem" }}>
          <span style={{ color: G.green }}>●</span>
          alex.dev/{site.name.toLowerCase()}
        </div>
      </div>

      {/* Preview area */}
      <div style={{ background: "#0a0c10", minHeight: 180, position: "relative", overflow: "hidden" }}>
        {/* Scanlines on preview */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.1) 3px, rgba(0,0,0,0.1) 4px)", zIndex: 2, pointerEvents: "none" }} />
        {/* Glow on hover */}
        <motion.div
          animate={{ opacity: hov ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          style={{ position: "absolute", inset: 0, background: `radial-gradient(ellipse at top, ${site.accent}10 0%, transparent 70%)`, zIndex: 1, pointerEvents: "none" }}
        />
        <BrowserMockup type={site.preview} accent={site.accent} />
      </div>

      {/* Content */}
      <div style={{ padding: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
          <div>
            <p style={{ fontSize: "0.65rem", color: site.accent, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.25rem" }}>{site.tagline}</p>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: G.text, margin: 0 }}>{site.name}</h3>
          </div>
          <div style={{ width: 36, height: 36, background: `${site.accent}18`, border: `1px solid ${site.accent}30`, borderRadius: "0.35rem", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ color: site.accent, fontSize: "0.9rem" }}>↗</span>
          </div>
        </div>
        <p style={{ fontSize: "0.78rem", color: G.dim, lineHeight: 1.75, marginBottom: "1rem" }}>{site.description}</p>
        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
          {site.tech.map((t) => (
            <span key={t} style={{ fontSize: "0.62rem", color: site.accent, border: `1px solid ${site.accent}30`, padding: "0.15rem 0.5rem", borderRadius: "0.15rem", fontFamily: "monospace" }}>{t}</span>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function WebsiteShowcase() {
  const { ref, inView } = useFadeUp();
  return (
    <section id="websites" style={{ padding: "7rem 1.5rem", borderTop: `1px solid ${G.border}`, background: "#0a0f0a" }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <motion.div ref={ref} initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6 }}>
          <SectionLabel>ls -la websites/</SectionLabel>
          <div style={{ marginBottom: "2.5rem" }}>
            <p style={{ fontSize: "0.82rem", color: G.dim, lineHeight: 1.8, maxWidth: 560 }}>
              <span style={{ color: G.green }}># </span>
              A sample of live web products I've shipped — each one a complete system from database schema to deployment pipeline.
            </p>
          </div>
        </motion.div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))", gap: "1.25rem" }}>
          {showcaseSites.map((site, i) => (
            <WebsiteCard key={site.id} site={site} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Game Dev ─────────────────────────────────────────────────────────────────

const gameProjects = [
  { id: "game_001", title: "Shooter", subtitle: "Tactical FPS · Unreal Engine 5", desc: "Fast-paced tactical FPS with destructible environments, Lumen GI, and custom AI squad mechanics. Procedural levels, 16-player multiplayer in C++ with Blueprint designer tooling.", tags: ["Unreal Engine 5", "C++", "Multiplayer", "Lumen GI"], video: fpsVideo },
  { id: "game_002", title: "Drone", subtitle: "Drone Racing Sim · Unreal Engine 5", desc: "Hyper-realistic FPV drone simulator tuned from real Betaflight parameters. Custom flight controller physics, track editor, ghost replay, and global leaderboard.", tags: ["Unreal Engine 5", "C#", "Physics", "Simulation"], video: fpvVideo },
];

function GameDev() {
  const { ref, inView } = useFadeUp();
  return (
    <section id="game-dev" style={{ padding: "7rem 1.5rem", borderTop: `1px solid ${G.border}` }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <SectionLabel>ls -la game_projects/</SectionLabel>
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 480px), 1fr))", gap: "1.5rem" }}
        >
          {gameProjects.map((g, i) => (
            <motion.div key={g.id} initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ delay: i * 0.2, duration: 0.5 }}>
              <GameCard project={g} />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function GameCard({ project }: { project: typeof gameProjects[0] }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [hov, setHov] = useState(false);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (playing) { videoRef.current.pause(); setPlaying(false); }
    else { videoRef.current.play(); setPlaying(true); }
  };

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{ background: G.card, border: `1px solid ${hov ? G.borderHover : G.border}`, borderRadius: "0.5rem", overflow: "hidden", transition: "all 0.25s ease", boxShadow: hov ? "0 0 32px rgba(0,255,65,0.08)" : "none" }}
    >
      <div style={{ background: "#0a0f0a", borderBottom: `1px solid ${G.border}`, padding: "0.5rem 1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: G.red }} />
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: G.yellow }} />
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: G.green }} />
        <span style={{ flex: 1, textAlign: "center", fontSize: "0.62rem", color: G.dim }}>{project.id} — mpv</span>
      </div>

      <div style={{ position: "relative", aspectRatio: "16/9", background: "#000", overflow: "hidden" }}>
        <video ref={videoRef} src={project.video} loop playsInline style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.1) 3px, rgba(0,0,0,0.1) 4px)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", inset: 0, background: playing ? "transparent" : "rgba(8,12,8,0.6)", display: "flex", alignItems: "center", justifyContent: "center", transition: "background 0.3s" }}>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={togglePlay}
            style={{ width: 56, height: 56, borderRadius: "50%", background: playing ? (hov ? "rgba(0,255,65,0.2)" : "transparent") : "rgba(0,255,65,0.15)", border: `1px solid ${playing ? (hov ? G.green : "transparent") : G.green}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", opacity: playing ? (hov ? 1 : 0) : 1, transition: "opacity 0.2s, background 0.2s", boxShadow: playing ? "none" : "0 0 24px rgba(0,255,65,0.3)" }}
          >
            {playing
              ? <svg width="18" height="18" viewBox="0 0 18 18" fill={G.green}><rect x="3" y="2" width="4" height="14" rx="1"/><rect x="11" y="2" width="4" height="14" rx="1"/></svg>
              : <svg width="18" height="18" viewBox="0 0 18 18" fill={G.green} style={{ marginLeft: 3 }}><polygon points="4,2 16,9 4,16"/></svg>
            }
          </motion.button>
        </div>
        <div style={{ position: "absolute", top: "0.6rem", right: "0.6rem", background: "rgba(0,0,0,0.75)", color: G.green, fontSize: "0.58rem", padding: "0.2rem 0.5rem", borderRadius: "0.15rem", letterSpacing: "0.08em", border: `1px solid ${G.border}` }}>
          {playing ? "▶ PLAYING" : "⏸ TRAILER"}
        </div>
      </div>

      <div style={{ padding: "1.5rem" }}>
        <p style={{ fontSize: "0.65rem", color: G.dim, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "0.3rem" }}>{project.subtitle}</p>
        <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: G.green, marginBottom: "0.75rem", textShadow: "0 0 16px rgba(0,255,65,0.3)" }}>{project.title}</h3>
        <p style={{ fontSize: "0.78rem", color: G.dim, lineHeight: 1.8, marginBottom: "1rem" }}>{project.desc}</p>
        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap", marginBottom: "1.25rem" }}>
          {project.tags.map((t) => (
            <span key={t} style={{ fontSize: "0.62rem", color: G.cyan, border: "1px solid rgba(0,212,255,0.2)", padding: "0.15rem 0.5rem", borderRadius: "0.15rem" }}>{t}</span>
          ))}
        </div>
        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={togglePlay}
          style={{ background: "transparent", border: `1px solid ${G.border}`, color: G.green, borderRadius: "0.25rem", padding: "0.55rem 1.1rem", fontSize: "0.72rem", fontWeight: 600, cursor: "pointer", fontFamily: "inherit", letterSpacing: "0.04em", display: "flex", alignItems: "center", gap: "0.5rem" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(0,255,65,0.08)"; e.currentTarget.style.borderColor = G.green; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = G.border; }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><polygon points="2,1 11,6 2,11"/></svg>
          Watch Trailer
        </motion.button>
      </div>
    </div>
  );
}

// ─── Footer / Contact ─────────────────────────────────────────────────────────

function Footer() {
  const { ref, inView } = useFadeUp();
  return (
    <footer id="contact" style={{ padding: "6rem 1.5rem 3rem", borderTop: `1px solid ${G.border}` }}>
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <SectionLabel>./contact.sh</SectionLabel>
        <motion.div
          ref={ref}
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7 }}
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4rem" }}
          className="grid-cols-1 md:grid-cols-2"
        >
          <TermWindow title="~/contact.sh">
            <div style={{ padding: "1.5rem", fontSize: "0.78rem", lineHeight: 2 }}>
              <Prompt cmd="./contact.sh --init" />
              <div style={{ marginTop: "1rem", color: G.dim }}>
                <p><span style={{ color: G.green }}>&gt;</span> Open to full-time roles, freelance, and</p>
                <p><span style={{ color: G.green }}>&gt;</span> interesting open-source collaborations.</p>
                <p style={{ marginTop: "0.5rem" }}><span style={{ color: G.green }}>&gt;</span> Response time usually &lt; 24h.</p>
              </div>
              <div style={{ marginTop: "1.5rem" }}>
                <Prompt cmd="echo $STATUS" output="ONLINE · AVAILABLE " />
              </div>
            </div>
          </TermWindow>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {[
              { icon: "✉", label: "email", value: "glebovpeta4@gmail.com", href: "mailto:alex@dev.io" },
              { icon: "⌥", label: "github", value: "github.com/KylBit", href: "mailto:github.com/KylBit" },
              { icon: "in", label: "linkedin", value: "linkedin.com/in/alexdev", href: "#" },
              { icon: "✈", label: "telegram", value: "@LiveCoderCSS", href: "#" },
            ].map((l) => (
              <motion.a
                key={l.label}
                href={l.href}
                whileHover={{ x: 4 }}
                style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "0.875rem 1.25rem", background: G.card, border: `1px solid ${G.border}`, borderRadius: "0.35rem", textDecoration: "none", transition: "border-color 0.2s" }}
                onMouseEnter={(e) => { e.currentTarget.style.borderColor = G.green; }}
                onMouseLeave={(e) => { e.currentTarget.style.borderColor = G.border; }}
              >
                <span style={{ width: 32, height: 32, background: "rgba(0,255,65,0.08)", border: `1px solid ${G.border}`, borderRadius: "0.25rem", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", color: G.green, flexShrink: 0 }}>{l.icon}</span>
                <div>
                  <p style={{ fontSize: "0.62rem", color: G.dimmer, marginBottom: "0.1rem", letterSpacing: "0.06em" }}>{l.label}</p>
                  <p style={{ fontSize: "0.8rem", color: G.text }}>{l.value}</p>
                </div>
              </motion.a>
            ))}
          </div>
        </motion.div>

        <div style={{ marginTop: "4rem", paddingTop: "1.5rem", borderTop: `1px solid ${G.dimmer}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem", fontSize: "0.7rem", color: G.dimmer }}>
          <span style={{ color: G.green, fontWeight: 700 }}>alex@linux:~$</span>
          <span>© 2024 alex </span>
          <span>uptime: 3+ years</span>
        </div>
      </div>
    </footer>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <div style={{ background: G.bg, minHeight: "100vh", color: G.text, fontFamily: "'JetBrains Mono', monospace" }}>
      {/* MARKER-MAKE-KIT-INVOKED */}
      <style>{globalStyles}</style>
      <Scanlines />
      <Nav />
      <Hero />
      <About />
      <Skills />
      <WebDev />
      <WebsiteShowcase />
      <GameDev />
      <Footer />
    </div>
  );
}
