import React from "react";
import { useAuth } from "../hooks/useAuth";

export default function HomeScreen() {
  const { profile } = useAuth();
  return (
    <div style={styles.root}>
      <div style={styles.header}>
        <span style={styles.logo}>M24 <span style={styles.kenzo}>KENZO</span></span>
      </div>
      <div style={styles.body}>
        <p style={styles.welcome}>Welcome back, <span style={styles.accent}>@{profile?.username}</span> 👋</p>
        <p style={styles.sub}>Your feed is loading soon...</p>
      </div>
    </div>
  );
}

const styles = {
  root: { height:"100%", display:"flex", flexDirection:"column", background:"var(--color-bg-primary)", overflow:"auto" },
  header: { padding:"16px 20px", borderBottom:"1px solid var(--color-border)" },
  logo: { fontFamily:"var(--font-display)", fontSize:"28px", color:"var(--color-text-primary)" },
  kenzo: { color:"var(--color-accent)" },
  body: { flex:1, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:"12px" },
  welcome: { fontSize:"20px", color:"var(--color-text-primary)", fontFamily:"var(--font-heading)" },
  accent: { color:"var(--color-accent)" },
  sub: { color:"var(--color-text-secondary)", fontSize:"14px" },
};
