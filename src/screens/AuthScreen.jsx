import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/config";

export default function AuthScreen() {
  const { signUp, logIn } = useAuth();
  const [mode, setMode]       = useState("login"); // "login" | "signup"
  const [email, setEmail]     = useState("");
  const [password, setPass]   = useState("");
  const [username, setUser]   = useState("");
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "signup") {
        if (!username.trim()) { setError("Username is required"); setLoading(false); return; }
        if (username.length < 3) { setError("Username must be at least 3 characters"); setLoading(false); return; }
        // Check username taken
        const snap = await getDoc(doc(db, "usernames", username.trim().toLowerCase()));
        if (snap.exists()) { setError("Username already taken"); setLoading(false); return; }
        await signUp(email, password, username.trim().toLowerCase());
      } else {
        await logIn(email, password);
      }
    } catch (err) {
      setError(friendlyError(err.code));
      setLoading(false);
    }
  }

  return (
    <div style={styles.root}>
      {/* BG glow blobs */}
      <div style={styles.blob1} />
      <div style={styles.blob2} />

      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logo}>
          <span style={styles.logoText}>M24</span>
          <span style={styles.logoSub}>KENZO</span>
        </div>
        <p style={styles.tagline}>Short videos. Big moments.</p>

        {/* Tabs */}
        <div style={styles.tabs}>
          {["login","signup"].map(t => (
            <button key={t} onClick={() => { setMode(t); setError(""); }}
              style={{ ...styles.tab, ...(mode===t ? styles.tabActive : {}) }}>
              {t === "login" ? "Log In" : "Sign Up"}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={styles.form}>
          {mode === "signup" && (
            <div style={styles.field}>
              <label style={styles.label}>Username</label>
              <input
                style={styles.input}
                value={username}
                onChange={e => setUser(e.target.value)}
                placeholder="@yourname"
                autoComplete="off"
                maxLength={24}
              />
            </div>
          )}
          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input
              style={styles.input}
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@email.com"
              autoComplete="email"
            />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              style={styles.input}
              type="password"
              value={password}
              onChange={e => setPass(e.target.value)}
              placeholder="••••••••"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
            />
          </div>

          {error && <p style={styles.error}>{error}</p>}

          <button type="submit" style={styles.submit} disabled={loading}>
            {loading ? "..." : mode === "login" ? "Log In" : "Create Account"}
          </button>
        </form>

        <p style={styles.switch}>
          {mode === "login" ? "Don't have an account? " : "Already have one? "}
          <span style={styles.switchLink} onClick={() => { setMode(mode==="login"?"signup":"login"); setError(""); }}>
            {mode === "login" ? "Sign Up" : "Log In"}
          </span>
        </p>
      </div>
    </div>
  );
}

function friendlyError(code) {
  const map = {
    "auth/email-already-in-use":    "Email already in use.",
    "auth/invalid-email":           "Invalid email address.",
    "auth/weak-password":           "Password must be at least 6 characters.",
    "auth/user-not-found":          "No account with that email.",
    "auth/wrong-password":          "Incorrect password.",
    "auth/too-many-requests":       "Too many attempts. Try again later.",
    "auth/invalid-credential":      "Invalid email or password.",
  };
  return map[code] || "Something went wrong. Try again.";
}

const styles = {
  root: {
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "var(--color-bg-primary)",
    padding: "20px",
    position: "relative",
    overflow: "hidden",
  },
  blob1: {
    position: "absolute", top: "-80px", right: "-80px",
    width: "280px", height: "280px", borderRadius: "50%",
    background: "var(--color-accent-glow)", filter: "blur(60px)", pointerEvents:"none",
  },
  blob2: {
    position: "absolute", bottom: "-60px", left: "-60px",
    width: "220px", height: "220px", borderRadius: "50%",
    background: "rgba(37,244,238,0.12)", filter: "blur(50px)", pointerEvents:"none",
  },
  card: {
    width: "100%", maxWidth: "360px",
    background: "var(--color-bg-card)",
    border: "1px solid var(--color-border)",
    borderRadius: "var(--radius-xl)",
    padding: "36px 28px",
    boxShadow: "var(--shadow-card)",
    position: "relative", zIndex: 1,
  },
  logo: { display:"flex", alignItems:"baseline", gap:"6px", marginBottom:"4px" },
  logoText: {
    fontFamily: "var(--font-display)", fontSize: "48px",
    color: "var(--color-accent)", lineHeight: 1,
    textShadow: "var(--shadow-glow)",
  },
  logoSub: {
    fontFamily: "var(--font-display)", fontSize: "28px",
    color: "var(--color-text-primary)", letterSpacing:"4px",
  },
  tagline: {
    color: "var(--color-text-secondary)", fontSize: "13px",
    marginBottom: "28px", fontFamily: "var(--font-body)",
  },
  tabs: {
    display:"flex", gap:"8px", marginBottom:"24px",
    background: "var(--color-bg-secondary)",
    borderRadius: "var(--radius-full)", padding:"4px",
  },
  tab: {
    flex:1, padding:"8px", borderRadius:"var(--radius-full)",
    fontSize:"13px", fontWeight:600, fontFamily:"var(--font-body)",
    color:"var(--color-text-secondary)", background:"transparent",
    transition: "all var(--transition-fast)",
  },
  tabActive: {
    background:"var(--color-accent)", color:"#fff",
    boxShadow: "var(--shadow-glow)",
  },
  form: { display:"flex", flexDirection:"column", gap:"14px" },
  field: { display:"flex", flexDirection:"column", gap:"6px" },
  label: { fontSize:"12px", fontWeight:600, color:"var(--color-text-secondary)", letterSpacing:"0.5px" },
  input: {
    background:"var(--color-bg-elevated)",
    border:"1px solid var(--color-border)",
    borderRadius:"var(--radius-md)",
    padding:"12px 14px", fontSize:"14px",
    color:"var(--color-text-primary)",
    transition:"border-color var(--transition-fast)",
  },
  error: { color:"var(--color-danger)", fontSize:"13px", textAlign:"center" },
  submit: {
    background:"var(--color-accent)", color:"#fff",
    padding:"14px", borderRadius:"var(--radius-md)",
    fontSize:"15px", fontWeight:700, fontFamily:"var(--font-heading)",
    letterSpacing:"1px", marginTop:"4px",
    boxShadow:"var(--shadow-glow)",
    transition:"opacity var(--transition-fast)",
  },
  switch: { textAlign:"center", fontSize:"13px", color:"var(--color-text-secondary)", marginTop:"20px" },
  switchLink: { color:"var(--color-accent)", fontWeight:700, cursor:"pointer" },
};
