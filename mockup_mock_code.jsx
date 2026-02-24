import { useState, useEffect, useRef } from "react";

const SESSIONS = [
  { id: 1, name: "Login flow broken", time: "2m 34s", status: "complete", url: "app.acme.io/login" },
  { id: 2, name: "Cart not updating", time: "1m 12s", status: "complete", url: "app.acme.io/cart" },
  { id: 3, name: "Dashboard latency", time: "3m 08s", status: "complete", url: "localhost:3000/dash" },
];

const NETWORK_LOGS = [
  { method: "GET", url: "/api/v1/auth/session", status: 200, time: "42ms", size: "1.2 KB", type: "xhr" },
  { method: "POST", url: "/api/v1/cart/update", status: 500, time: "1.8s", size: "0.3 KB", type: "xhr" },
  { method: "GET", url: "/api/v1/products?page=2", status: 200, time: "320ms", size: "14.8 KB", type: "fetch" },
  { method: "GET", url: "/static/js/main.chunk.js", status: 304, time: "12ms", size: "—", type: "script" },
  { method: "POST", url: "/api/v1/cart/update", status: 500, time: "2.1s", size: "0.3 KB", type: "xhr" },
  { method: "GET", url: "/api/v1/user/preferences", status: 200, time: "89ms", size: "0.8 KB", type: "xhr" },
  { method: "OPTIONS", url: "/api/v1/cart/update", status: 204, time: "5ms", size: "—", type: "xhr" },
  { method: "POST", url: "/api/v1/cart/update", status: 500, time: "1.9s", size: "0.3 KB", type: "xhr" },
];

const CONSOLE_LOGS = [
  { type: "error", msg: "Uncaught TypeError: Cannot read property 'items' of undefined", src: "cart.js:142" },
  { type: "warn", msg: "React does not recognize the `isActive` prop on a DOM element.", src: "react-dom.js" },
  { type: "log", msg: "Cart state: { items: [], total: 0 }", src: "store.js:88" },
  { type: "error", msg: "POST /api/v1/cart/update 500 (Internal Server Error)", src: "network" },
  { type: "log", msg: "[HMR] Waiting for update signal from WDS...", src: "webpack" },
  { type: "error", msg: "Failed to update cart: cartId is null after auth refresh", src: "cart.js:156" },
  { type: "warn", msg: "Each child in a list should have a unique \"key\" prop.", src: "ProductList.jsx:34" },
  { type: "log", msg: "Session token refreshed successfully", src: "auth.js:22" },
];

const INTERACTIONS = [
  { time: "00:04", action: "click", target: "Button — \"Add to Cart\"", selector: "#add-to-cart-btn" },
  { time: "00:06", action: "navigate", target: "/cart", selector: "—" },
  { time: "00:11", action: "click", target: "Button — \"Update Quantity\"", selector: ".qty-btn.increment" },
  { time: "00:12", action: "wait", target: "Spinner visible for 2.1s", selector: ".loading-spinner" },
  { time: "00:15", action: "click", target: "Button — \"Update Quantity\" (retry)", selector: ".qty-btn.increment" },
  { time: "00:18", action: "scroll", target: "Page scrolled down 400px", selector: "window" },
  { time: "00:22", action: "click", target: "Link — \"Back to Products\"", selector: "a.nav-back" },
];

const AI_MESSAGES = [
  { role: "system", text: "Session recording analyzed. Processing 2m 34s of interaction data..." },
  { role: "assistant", text: "Found 3 critical issues in this session. Generating report..." },
  { role: "assistant", text: `## Bug Report: Cart Update Failure

**Severity:** High · **Component:** Cart Service

**Summary:** Cart quantity update fails silently with 500 errors. The root cause appears to be a null cartId after auth token refresh — the session state loses cart association.

**Steps to Reproduce:**
1. Add item to cart
2. Navigate to /cart
3. Click "Update Quantity"
4. Observe: spinner hangs, 500 on POST /api/v1/cart/update

**Root Cause (probable):** cart.js:142 throws because \`items\` is undefined — the cart object loses its reference after the auth middleware refreshes the session token (auth.js:22 logs success, but cart.js:156 shows cartId is null).

**Suggested Fix:** Persist cartId independently of session token, or re-hydrate cart state after token refresh.` },
];

function StatusDot({ color }) {
  return (
    <span style={{
      width: 7, height: 7, borderRadius: "50%", display: "inline-block",
      background: color, boxShadow: `0 0 6px ${color}60`,
    }} />
  );
}

function NetworkStatusBadge({ status }) {
  const color = status >= 500 ? "var(--red)" : status >= 400 ? "var(--orange)" : status >= 300 ? "var(--dim)" : "var(--green)";
  return <span style={{ color, fontWeight: status >= 400 ? 700 : 400 }}>{status}</span>;
}

export default function App() {
  const [theme, setTheme] = useState("dark");
  const [recording, setRecording] = useState(false);
  const [activeSession, setActiveSession] = useState(null);
  const [rightTab, setRightTab] = useState("network");
  const [browserUrl, setBrowserUrl] = useState("https://app.acme.io/cart");
  const [showReport, setShowReport] = useState(false);
  const [aiTyping, setAiTyping] = useState(false);
  const [aiMessages, setAiMessages] = useState([]);
  const [micActive, setMicActive] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const [aiInput, setAiInput] = useState("");
  const termRef = useRef(null);

  useEffect(() => {
    let interval;
    if (recording) {
      interval = setInterval(() => setRecordTime(t => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [recording]);

  useEffect(() => {
    if (termRef.current) termRef.current.scrollTop = termRef.current.scrollHeight;
  }, [aiMessages]);

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const handleStopRecording = () => {
    setRecording(false);
    setMicActive(false);
    setAiTyping(true);
    setAiMessages([AI_MESSAGES[0]]);
    setTimeout(() => {
      setAiMessages(m => [...m, AI_MESSAGES[1]]);
      setTimeout(() => {
        setAiMessages(m => [...m, AI_MESSAGES[2]]);
        setAiTyping(false);
        setShowReport(true);
      }, 1800);
    }, 1200);
  };

  const isDark = theme === "dark";

  const vars = isDark ? {
    "--bg": "#0c0c0e", "--bg2": "#141416", "--bg3": "#1a1a1e", "--bg4": "#222226",
    "--border": "#2a2a30", "--border2": "#333339", "--text": "#e8e8ec", "--text2": "#9898a4",
    "--dim": "#5c5c6a", "--accent": "#e05a33", "--accent2": "#e05a3320", "--green": "#34d399",
    "--red": "#f87171", "--orange": "#fb923c", "--blue": "#60a5fa", "--yellow": "#fbbf24",
    "--surface": "#18181b", "--hover": "#ffffff08",
  } : {
    "--bg": "#f5f5f0", "--bg2": "#eeeee8", "--bg3": "#e8e8e2", "--bg4": "#ddddd7",
    "--border": "#d0d0c8", "--border2": "#c0c0b8", "--text": "#1a1a1e", "--text2": "#6a6a74",
    "--dim": "#8a8a94", "--accent": "#d04a23", "--accent2": "#d04a2318", "--green": "#059669",
    "--red": "#dc2626", "--orange": "#ea580c", "--blue": "#2563eb", "--yellow": "#ca8a04",
    "--surface": "#ececea", "--hover": "#00000006",
  };

  return (
    <div style={{
      ...vars, fontFamily: "'DM Sans', 'Söhne', -apple-system, sans-serif",
      background: "var(--bg)", color: "var(--text)", height: "100vh", width: "100vw",
      display: "flex", flexDirection: "column", overflow: "hidden", fontSize: 13,
      transition: "background 0.3s, color 0.3s",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />

      {/* ─── Title Bar ─── */}
      <div style={{
        height: 42, display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 16px", borderBottom: "1px solid var(--border)",
        background: "var(--bg2)", flexShrink: 0, userSelect: "none",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", gap: 6 }}>
            <span style={{ width: 11, height: 11, borderRadius: "50%", background: "#ff5f57" }} />
            <span style={{ width: 11, height: 11, borderRadius: "50%", background: "#febc2e" }} />
            <span style={{ width: 11, height: 11, borderRadius: "50%", background: "#28c840" }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
            </svg>
            <span style={{ fontWeight: 700, fontSize: 14, letterSpacing: "-0.02em" }}>
              recon<span style={{ color: "var(--accent)" }}>.</span>
            </span>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {recording && (
            <div style={{
              display: "flex", alignItems: "center", gap: 8, padding: "4px 12px",
              background: "var(--accent2)", borderRadius: 6, marginRight: 8,
              animation: "pulse 2s ease-in-out infinite",
            }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--accent)", animation: "blink 1s step-end infinite" }} />
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 12, color: "var(--accent)", fontWeight: 500 }}>
                REC {formatTime(recordTime)}
              </span>
              {micActive && (
                <svg width="13" height="13" viewBox="0 0 24 24" fill="var(--accent)" stroke="none">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2" fill="none" stroke="var(--accent)" strokeWidth="2"/>
                </svg>
              )}
            </div>
          )}
          <button onClick={() => setTheme(t => t === "dark" ? "light" : "dark")} style={{
            background: "none", border: "1px solid var(--border)", borderRadius: 6,
            color: "var(--text2)", cursor: "pointer", padding: "4px 8px", fontSize: 12,
            display: "flex", alignItems: "center", gap: 4,
          }}>
            {isDark ? "☀" : "☾"} {isDark ? "Light" : "Dark"}
          </button>
        </div>
      </div>

      {/* ─── Main Layout ─── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}>

        {/* ─── Left Sidebar ─── */}
        <div style={{
          width: 240, borderRight: "1px solid var(--border)", display: "flex",
          flexDirection: "column", background: "var(--bg2)", flexShrink: 0,
        }}>
          {/* Record Button */}
          <div style={{ padding: 14, borderBottom: "1px solid var(--border)" }}>
            {!recording ? (
              <button onClick={() => { setRecording(true); setRecordTime(0); setMicActive(true); setAiMessages([]); setShowReport(false); }} style={{
                width: "100%", padding: "10px 0", borderRadius: 8,
                background: "var(--accent)", color: "#fff", border: "none",
                cursor: "pointer", fontWeight: 600, fontSize: 13, fontFamily: "inherit",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                boxShadow: "0 2px 12px var(--accent)40",
                transition: "transform 0.15s, box-shadow 0.15s",
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="#fff"><circle cx="12" cy="12" r="8"/></svg>
                Start Recording
              </button>
            ) : (
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={handleStopRecording} style={{
                  flex: 1, padding: "10px 0", borderRadius: 8,
                  background: "var(--bg4)", color: "var(--text)", border: "1px solid var(--border2)",
                  cursor: "pointer", fontWeight: 600, fontSize: 13, fontFamily: "inherit",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="var(--accent)"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>
                  Stop
                </button>
                <button onClick={() => setMicActive(m => !m)} style={{
                  width: 40, borderRadius: 8,
                  background: micActive ? "var(--accent2)" : "var(--bg4)",
                  border: `1px solid ${micActive ? "var(--accent)" : "var(--border2)"}`,
                  color: micActive ? "var(--accent)" : "var(--dim)", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2" fill="none" stroke="currentColor" strokeWidth="2"/>
                    <line x1="12" y1="19" x2="12" y2="23" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </button>
              </div>
            )}
          </div>

          {/* Sessions List */}
          <div style={{ padding: "10px 12px 6px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 10, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--dim)" }}>
              Sessions
            </span>
            <span style={{
              fontSize: 10, background: "var(--bg4)", padding: "1px 6px", borderRadius: 4, color: "var(--dim)",
            }}>{SESSIONS.length}</span>
          </div>
          <div style={{ flex: 1, overflow: "auto", padding: "0 8px" }}>
            {SESSIONS.map(s => (
              <div key={s.id} onClick={() => setActiveSession(s.id)} style={{
                padding: "10px 10px", borderRadius: 7, marginBottom: 3, cursor: "pointer",
                background: activeSession === s.id ? "var(--bg4)" : "transparent",
                border: `1px solid ${activeSession === s.id ? "var(--border2)" : "transparent"}`,
                transition: "all 0.15s",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
                  <StatusDot color="var(--green)" />
                  <span style={{ fontWeight: 500, fontSize: 12.5 }}>{s.name}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, paddingLeft: 14 }}>
                  <span style={{ fontSize: 11, color: "var(--dim)", fontFamily: "'DM Mono', monospace" }}>{s.time}</span>
                  <span style={{ fontSize: 10, color: "var(--text2)", opacity: 0.6 }}>{s.url}</span>
                </div>
              </div>
            ))}
            {recording && (
              <div style={{
                padding: "10px 10px", borderRadius: 7, marginBottom: 3,
                background: "var(--accent2)", border: "1px solid var(--accent)30",
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 4 }}>
                  <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--accent)", animation: "blink 1s step-end infinite" }} />
                  <span style={{ fontWeight: 500, fontSize: 12.5, color: "var(--accent)" }}>Recording...</span>
                </div>
                <div style={{ paddingLeft: 14 }}>
                  <span style={{ fontSize: 11, color: "var(--accent)", fontFamily: "'DM Mono', monospace", opacity: 0.7 }}>{formatTime(recordTime)}</span>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Info */}
          <div style={{
            padding: "10px 14px", borderTop: "1px solid var(--border)",
            fontSize: 10, color: "var(--dim)", display: "flex", alignItems: "center", gap: 6,
          }}>
            <StatusDot color="var(--green)" />
            <span>Local · Chromium 122</span>
          </div>
        </div>

        {/* ─── Center + Right ─── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>

          {/* ─── Center: Browser + Right Panel ─── */}
          <div style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}>

            {/* ─── Browser Area ─── */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
              {/* URL Bar */}
              <div style={{
                height: 44, display: "flex", alignItems: "center", gap: 8, padding: "0 12px",
                borderBottom: "1px solid var(--border)", background: "var(--bg2)",
              }}>
                <div style={{ display: "flex", gap: 4, marginRight: 4 }}>
                  {["◀", "▶", "⟳"].map((icon, i) => (
                    <button key={i} style={{
                      width: 26, height: 26, borderRadius: 5, background: "none",
                      border: "1px solid var(--border)", color: "var(--dim)", cursor: "pointer",
                      fontSize: 11, display: "flex", alignItems: "center", justifyContent: "center",
                    }}>{icon}</button>
                  ))}
                </div>
                <div style={{
                  flex: 1, display: "flex", alignItems: "center", gap: 7,
                  background: "var(--bg)", borderRadius: 7, padding: "5px 12px",
                  border: "1px solid var(--border)",
                }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--dim)" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  <input
                    value={browserUrl}
                    onChange={e => setBrowserUrl(e.target.value)}
                    style={{
                      flex: 1, background: "none", border: "none", color: "var(--text)",
                      fontSize: 12.5, fontFamily: "'DM Mono', monospace", outline: "none",
                    }}
                  />
                </div>
              </div>

              {/* Browser Content (Mock) */}
              <div style={{
                flex: 1, overflow: "auto", background: "var(--bg)", position: "relative",
              }}>
                {/* Mock website content */}
                <div style={{ padding: 32, maxWidth: 680, margin: "0 auto" }}>
                  <div style={{
                    background: "var(--bg3)", borderRadius: 10, padding: 24,
                    border: "1px solid var(--border)",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                      <span style={{ fontWeight: 700, fontSize: 18 }}>Shopping Cart</span>
                      <span style={{ fontSize: 12, color: "var(--dim)" }}>2 items</span>
                    </div>

                    {[
                      { name: "Wireless Headphones", price: "$79.99", qty: 1 },
                      { name: "USB-C Hub Adapter", price: "$34.99", qty: 2 },
                    ].map((item, i) => (
                      <div key={i} style={{
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        padding: "14px 0", borderTop: `1px solid var(--border)`,
                      }}>
                        <div>
                          <div style={{ fontWeight: 500, marginBottom: 3 }}>{item.name}</div>
                          <div style={{ color: "var(--dim)", fontSize: 12 }}>{item.price}</div>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <button style={{
                            width: 28, height: 28, borderRadius: 5, background: "var(--bg4)",
                            border: "1px solid var(--border2)", color: "var(--text)", cursor: "pointer",
                            fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center",
                          }}>−</button>
                          <span style={{ fontFamily: "'DM Mono', monospace", width: 20, textAlign: "center" }}>{item.qty}</span>
                          <button style={{
                            width: 28, height: 28, borderRadius: 5, background: "var(--bg4)",
                            border: "1px solid var(--border2)", color: "var(--text)", cursor: "pointer",
                            fontSize: 14, display: "flex", alignItems: "center", justifyContent: "center",
                          }}>+</button>
                        </div>
                      </div>
                    ))}

                    <div style={{
                      marginTop: 16, padding: "14px 0", borderTop: "1px solid var(--border)",
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                    }}>
                      <span style={{ fontWeight: 600 }}>Total</span>
                      <span style={{ fontWeight: 700, fontSize: 16 }}>$149.97</span>
                    </div>

                    {/* Simulated error state */}
                    <div style={{
                      marginTop: 12, padding: "10px 14px", borderRadius: 7,
                      background: isDark ? "#2d1518" : "#fef2f2",
                      border: `1px solid ${isDark ? "#5c2328" : "#fecaca"}`,
                      color: "var(--red)", fontSize: 12, display: "flex", alignItems: "center", gap: 8,
                    }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                      </svg>
                      Failed to update cart. Please try again.
                    </div>

                    <button style={{
                      width: "100%", marginTop: 14, padding: "11px 0", borderRadius: 8,
                      background: "var(--dim)", color: isDark ? "#333" : "#fff", border: "none",
                      fontWeight: 600, fontSize: 13, cursor: "not-allowed", opacity: 0.5, fontFamily: "inherit",
                    }}>
                      Checkout
                    </button>
                  </div>
                </div>

                {/* Recording overlay indicator */}
                {recording && (
                  <div style={{
                    position: "absolute", top: 10, right: 10, padding: "5px 10px",
                    background: "var(--accent)", borderRadius: 6, color: "#fff",
                    fontSize: 10, fontWeight: 600, display: "flex", alignItems: "center", gap: 5,
                    animation: "pulse 2s ease-in-out infinite",
                  }}>
                    <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#fff", animation: "blink 1s step-end infinite" }} />
                    RECORDING
                  </div>
                )}
              </div>
            </div>

            {/* ─── Right Panel: DevTools ─── */}
            <div style={{
              width: 340, borderLeft: "1px solid var(--border)", display: "flex",
              flexDirection: "column", background: "var(--bg2)", flexShrink: 0,
            }}>
              {/* Tabs */}
              <div style={{
                display: "flex", borderBottom: "1px solid var(--border)", overflow: "hidden",
              }}>
                {[
                  { id: "network", label: "Network" },
                  { id: "console", label: "Console" },
                  { id: "interactions", label: "Interactions" },
                ].map(t => (
                  <button key={t.id} onClick={() => setRightTab(t.id)} style={{
                    flex: 1, padding: "9px 0", background: "none", border: "none",
                    borderBottom: rightTab === t.id ? "2px solid var(--accent)" : "2px solid transparent",
                    color: rightTab === t.id ? "var(--text)" : "var(--dim)",
                    fontWeight: rightTab === t.id ? 600 : 400,
                    cursor: "pointer", fontSize: 11.5, fontFamily: "inherit",
                    transition: "all 0.15s",
                  }}>{t.label}</button>
                ))}
              </div>

              {/* Tab Content */}
              <div style={{ flex: 1, overflow: "auto", fontSize: 11.5 }}>
                {rightTab === "network" && (
                  <div>
                    <div style={{
                      display: "grid", gridTemplateColumns: "50px 1fr 38px 50px",
                      padding: "7px 12px", borderBottom: "1px solid var(--border)",
                      color: "var(--dim)", fontSize: 10, fontWeight: 600, textTransform: "uppercase",
                      letterSpacing: "0.05em", position: "sticky", top: 0, background: "var(--bg2)",
                    }}>
                      <span>Method</span><span>URL</span><span>Status</span><span>Time</span>
                    </div>
                    {NETWORK_LOGS.map((log, i) => (
                      <div key={i} style={{
                        display: "grid", gridTemplateColumns: "50px 1fr 38px 50px",
                        padding: "6px 12px", borderBottom: "1px solid var(--border)08",
                        fontFamily: "'DM Mono', monospace", fontSize: 11,
                        background: log.status >= 500 ? (isDark ? "#2d151808" : "#fef2f208") : "transparent",
                      }}>
                        <span style={{ color: log.method === "POST" ? "var(--blue)" : "var(--dim)", fontWeight: 500 }}>{log.method}</span>
                        <span style={{ color: "var(--text2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: 8 }}>{log.url}</span>
                        <NetworkStatusBadge status={log.status} />
                        <span style={{ color: parseFloat(log.time) > 1000 || log.time.includes("s") && !log.time.includes("ms") ? "var(--orange)" : "var(--dim)" }}>{log.time}</span>
                      </div>
                    ))}
                  </div>
                )}

                {rightTab === "console" && (
                  <div style={{ padding: 4 }}>
                    {CONSOLE_LOGS.map((log, i) => (
                      <div key={i} style={{
                        padding: "6px 10px", borderRadius: 4, marginBottom: 2,
                        fontFamily: "'DM Mono', monospace", fontSize: 11, lineHeight: 1.5,
                        background: log.type === "error" ? (isDark ? "#2d151812" : "#fef2f212") : "transparent",
                        borderLeft: `2px solid ${log.type === "error" ? "var(--red)" : log.type === "warn" ? "var(--yellow)" : "var(--dim)30"}`,
                      }}>
                        <div style={{
                          color: log.type === "error" ? "var(--red)" : log.type === "warn" ? "var(--yellow)" : "var(--text2)",
                        }}>
                          {log.msg}
                        </div>
                        <div style={{ color: "var(--dim)", fontSize: 10, marginTop: 2 }}>{log.src}</div>
                      </div>
                    ))}
                  </div>
                )}

                {rightTab === "interactions" && (
                  <div>
                    <div style={{
                      display: "grid", gridTemplateColumns: "44px 60px 1fr",
                      padding: "7px 12px", borderBottom: "1px solid var(--border)",
                      color: "var(--dim)", fontSize: 10, fontWeight: 600, textTransform: "uppercase",
                      letterSpacing: "0.05em", position: "sticky", top: 0, background: "var(--bg2)",
                    }}>
                      <span>Time</span><span>Action</span><span>Target</span>
                    </div>
                    {INTERACTIONS.map((int, i) => (
                      <div key={i} style={{
                        display: "grid", gridTemplateColumns: "44px 60px 1fr",
                        padding: "7px 12px", borderBottom: "1px solid var(--border)08",
                        fontFamily: "'DM Mono', monospace", fontSize: 11,
                      }}>
                        <span style={{ color: "var(--dim)" }}>{int.time}</span>
                        <span style={{
                          color: int.action === "click" ? "var(--blue)" : int.action === "navigate" ? "var(--green)" : int.action === "wait" ? "var(--orange)" : "var(--dim)",
                          fontWeight: 500,
                        }}>{int.action}</span>
                        <span style={{ color: "var(--text2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{int.target}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ─── Bottom: AI Terminal ─── */}
          <div style={{
            height: showReport ? 220 : 160, borderTop: "1px solid var(--border)",
            background: "var(--bg2)", display: "flex", flexDirection: "column", flexShrink: 0,
            transition: "height 0.3s",
          }}>
            {/* Terminal Header */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "6px 14px", borderBottom: "1px solid var(--border)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round">
                  <polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/>
                </svg>
                <span style={{ fontSize: 11, fontWeight: 600, color: "var(--text2)" }}>AI Agent</span>
                <span style={{
                  fontSize: 9, padding: "1px 6px", borderRadius: 3,
                  background: "var(--accent2)", color: "var(--accent)", fontWeight: 600,
                }}>Claude</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {aiTyping && (
                  <span style={{ fontSize: 10, color: "var(--accent)", fontFamily: "'DM Mono', monospace" }}>
                    analyzing<span style={{ animation: "blink 1s step-end infinite" }}>...</span>
                  </span>
                )}
              </div>
            </div>

            {/* Terminal Body */}
            <div ref={termRef} style={{
              flex: 1, overflow: "auto", padding: "8px 14px",
              fontFamily: "'DM Mono', monospace", fontSize: 11.5, lineHeight: 1.7,
            }}>
              {aiMessages.length === 0 && !recording && (
                <div style={{ color: "var(--dim)", padding: "8px 0" }}>
                  <span style={{ color: "var(--accent)" }}>●</span> Start a recording session to capture bugs. The AI agent will analyze the session and generate a report.
                </div>
              )}
              {recording && aiMessages.length === 0 && (
                <div style={{ color: "var(--dim)", padding: "8px 0" }}>
                  <span style={{ color: "var(--accent)" }}>●</span> Recording in progress — capturing interactions, network activity, console logs, and audio...
                </div>
              )}
              {aiMessages.map((msg, i) => (
                <div key={i} style={{ marginBottom: 8 }}>
                  {msg.role === "system" ? (
                    <div style={{ color: "var(--dim)" }}>
                      <span style={{ color: "var(--accent)" }}>→</span> {msg.text}
                    </div>
                  ) : (
                    <div>
                      <div style={{ color: "var(--accent)", fontWeight: 600, marginBottom: 2, fontSize: 10 }}>claude</div>
                      <div style={{
                        color: "var(--text2)", whiteSpace: "pre-wrap",
                        padding: "6px 10px", borderRadius: 6,
                        background: "var(--bg)",
                        border: "1px solid var(--border)",
                        maxHeight: 120, overflow: "auto", fontSize: 11,
                      }}>
                        {msg.text}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Input */}
            <div style={{
              display: "flex", alignItems: "center", gap: 8, padding: "6px 14px",
              borderTop: "1px solid var(--border)",
            }}>
              <span style={{ color: "var(--accent)", fontFamily: "'DM Mono', monospace", fontSize: 12, fontWeight: 700 }}>›</span>
              <input
                placeholder="Ask about the session or request a bug report..."
                value={aiInput}
                onChange={e => setAiInput(e.target.value)}
                style={{
                  flex: 1, background: "none", border: "none", color: "var(--text)",
                  fontSize: 12, fontFamily: "'DM Mono', monospace", outline: "none",
                }}
              />
              <button style={{
                background: "var(--bg4)", border: "1px solid var(--border)", borderRadius: 5,
                color: "var(--dim)", padding: "4px 10px", fontSize: 10, cursor: "pointer",
                fontFamily: "'DM Mono', monospace",
              }}>⏎</button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: var(--border2); }
        input::placeholder { color: var(--dim); }
      `}</style>
    </div>
  );
}