import React, { useState, useEffect } from "react";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../hooks/useAuth";
import UploadModal from "../components/shorts/UploadModal";
import { IoAdd } from "react-icons/io5";

export default function ProfileScreen() {
  const { profile, logOut }   = useAuth();
  const [videos, setVideos]   = useState([]);
  const [showUpload, setShowUpload] = useState(false);

  useEffect(() => {
    if (!profile?.uid) return;
    const q = query(
      collection(db, "videos"),
      where("uid", "==", profile.uid),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, snap => {
      setVideos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, [profile?.uid]);

  return (
    <div style={styles.root}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.avatarBig}>
          {(profile?.username || "?")[0].toUpperCase()}
        </div>
        <div style={styles.userInfo}>
          <div style={styles.username}>@{profile?.username}</div>
          <div style={styles.email}>{profile?.email}</div>
          <div style={styles.stats}>
            <div style={styles.stat}><span style={styles.statNum}>{videos.length}</span><span style={styles.statLabel}>Videos</span></div>
          </div>
        </div>
      </div>

      {/* Upload button */}
      <button onClick={() => setShowUpload(true)} style={styles.uploadBtn}>
        <IoAdd size={20} /> Upload Short
      </button>

      {/* Video grid */}
      <div style={styles.grid}>
        {videos.length === 0 && (
          <p style={styles.empty}>No videos yet. Upload your first short! 🎬</p>
        )}
        {videos.map(v => (
          <div key={v.id} style={styles.thumb}>
            <video src={v.url} style={styles.thumbVideo} muted playsInline />
            {!v.published && (
              <div style={styles.pendingBadge}>⏳ Publishing...</div>
            )}
          </div>
        ))}
      </div>

      {/* Logout */}
      <button onClick={logOut} style={styles.logoutBtn}>Log Out</button>

      {showUpload && <UploadModal onClose={() => setShowUpload(false)} />}
    </div>
  );
}

const styles = {
  root: {
    height:"100%", display:"flex", flexDirection:"column",
    background:"var(--color-bg-primary)", overflowY:"auto",
  },
  header: {
    display:"flex", gap:"16px", alignItems:"center",
    padding:"24px 20px 16px",
  },
  avatarBig: {
    width:"72px", height:"72px", borderRadius:"50%",
    background:"var(--color-accent)",
    display:"flex", alignItems:"center", justifyContent:"center",
    fontFamily:"var(--font-display)", fontSize:"32px", color:"#fff",
    flexShrink:0, boxShadow:"var(--shadow-glow)",
  },
  userInfo: { display:"flex", flexDirection:"column", gap:"4px" },
  username: {
    fontFamily:"var(--font-display)", fontSize:"24px",
    color:"var(--color-accent)",
  },
  email: { color:"var(--color-text-secondary)", fontSize:"13px" },
  stats: { display:"flex", gap:"20px", marginTop:"6px" },
  stat: { display:"flex", flexDirection:"column", alignItems:"center" },
  statNum: { fontFamily:"var(--font-heading)", fontSize:"18px", fontWeight:700, color:"var(--color-text-primary)" },
  statLabel: { fontSize:"11px", color:"var(--color-text-muted)" },
  uploadBtn: {
    margin:"0 20px 16px",
    padding:"12px",
    background:"var(--color-accent)", color:"#fff",
    border:"none", borderRadius:"var(--radius-md)",
    fontSize:"15px", fontWeight:700, fontFamily:"var(--font-heading)",
    display:"flex", alignItems:"center", justifyContent:"center", gap:"8px",
    cursor:"pointer", boxShadow:"var(--shadow-glow)",
  },
  grid: {
    display:"grid", gridTemplateColumns:"repeat(3, 1fr)",
    gap:"2px", padding:"0 2px",
  },
  thumb: {
    aspectRatio:"9/16", background:"var(--color-bg-elevated)",
    position:"relative", overflow:"hidden",
  },
  thumbVideo: {
    width:"100%", height:"100%", objectFit:"cover",
  },
  pendingBadge: {
    position:"absolute", bottom:"6px", left:"6px",
    background:"rgba(0,0,0,0.7)", color:"#fff",
    fontSize:"10px", padding:"2px 6px", borderRadius:"4px",
  },
  empty: {
    gridColumn:"1/-1", textAlign:"center",
    color:"var(--color-text-muted)", fontSize:"14px",
    padding:"40px 20px",
  },
  logoutBtn: {
    margin:"20px", padding:"12px",
    background:"var(--color-bg-card)",
    border:"1px solid var(--color-border)",
    borderRadius:"var(--radius-md)",
    color:"var(--color-text-secondary)", fontSize:"14px", cursor:"pointer",
  },
};