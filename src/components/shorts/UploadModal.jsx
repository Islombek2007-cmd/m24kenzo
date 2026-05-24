import React, { useState, useRef } from "react";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase/config";
import { useAuth } from "../../hooks/useAuth";
import { uploadToCatbox, validateVideoFile } from "../../utils/catbox";
import { IoClose, IoCloudUpload, IoCheckmarkCircle } from "react-icons/io5";

export default function UploadModal({ onClose }) {
  const { user, profile }       = useAuth();
  const [file, setFile]         = useState(null);
  const [caption, setCaption]   = useState("");
  const [progress, setProgress] = useState(0);
  const [status, setStatus]     = useState("idle"); // idle|uploading|processing|done|error
  const [error, setError]       = useState("");
  const inputRef                = useRef(null);

  function pickFile(e) {
    const f = e.target.files[0];
    if (!f) return;
    const err = validateVideoFile(f);
    if (err) { setError(err); return; }
    setFile(f);
    setError("");
  }

  async function upload() {
    if (!file || !user) return;
    setStatus("uploading");
    setError("");
    try {
      // 1. Upload to Catbox
      const url = await uploadToCatbox(file, setProgress);

      // 2. Save to Firestore — unpublished first
      setStatus("processing");
      const videoDoc = {
        url,
        uid:          user.uid,
        username:     profile?.username || "user",
        caption:      caption.trim(),
        likes:        0,
        commentCount: 0,
        createdAt:    serverTimestamp(),
        publishedAt:  null,   // not live yet
        published:    false,
      };
      const ref = await addDoc(collection(db, "videos"), videoDoc);

      // 3. After 5 seconds → mark as published
      setTimeout(async () => {
        const { updateDoc, doc } = await import("firebase/firestore");
        await updateDoc(doc(db, "videos", ref.id), {
          published:   true,
          publishedAt: serverTimestamp(),
        });
      }, 5000);

      setStatus("done");
    } catch (e) {
      console.error(e);
      setError("Upload failed: " + e.message);
      setStatus("error");
    }
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        {/* Header */}
        <div style={styles.header}>
          <span style={styles.title}>Upload Short</span>
          <button onClick={onClose} style={styles.closeBtn}><IoClose size={22} /></button>
        </div>

        {status === "done" ? (
          <div style={styles.successBox}>
            <IoCheckmarkCircle size={56} color="var(--color-accent)" />
            <p style={styles.successText}>Uploaded! 🎉</p>
            <p style={styles.successSub}>Your short will go live in a few seconds.</p>
            <button onClick={onClose} style={styles.doneBtn}>Done</button>
          </div>
        ) : (
          <>
            {/* File picker */}
            <div style={styles.dropZone} onClick={() => inputRef.current?.click()}>
              {file ? (
                <div style={styles.fileInfo}>
                  <span style={styles.fileName}>📹 {file.name}</span>
                  <span style={styles.fileSize}>{(file.size / 1024 / 1024).toFixed(1)} MB</span>
                </div>
              ) : (
                <>
                  <IoCloudUpload size={40} color="var(--color-accent)" />
                  <p style={styles.dropText}>Tap to pick a video</p>
                  <p style={styles.dropSub}>Max 200 MB · Any video format</p>
                </>
              )}
              <input
                ref={inputRef}
                type="file"
                accept="video/*"
                style={{ display:"none" }}
                onChange={pickFile}
              />
            </div>

            {/* Caption */}
            <textarea
              style={styles.caption}
              value={caption}
              onChange={e => setCaption(e.target.value)}
              placeholder="Add a caption..."
              rows={2}
              maxLength={150}
            />

            {/* Progress */}
            {status === "uploading" && (
              <div style={styles.progressWrap}>
                <div style={styles.progressBar}>
                  <div style={{ ...styles.progressFill, width:`${progress}%` }} />
                </div>
                <span style={styles.progressText}>{progress}%</span>
              </div>
            )}
            {status === "processing" && (
              <p style={styles.processingText}>⏳ Processing... goes live in 5 seconds</p>
            )}

            {error && <p style={styles.error}>{error}</p>}

            <button
              onClick={upload}
              disabled={!file || status === "uploading" || status === "processing"}
              style={{
                ...styles.uploadBtn,
                opacity: (!file || status !== "idle") ? 0.5 : 1,
              }}>
              {status === "uploading" ? `Uploading ${progress}%...`
                : status === "processing" ? "Publishing..."
                : "Upload Short"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position:"fixed", inset:0, zIndex:200,
    background:"rgba(0,0,0,0.75)",
    display:"flex", alignItems:"flex-end",
  },
  modal: {
    width:"100%",
    background:"var(--color-bg-card)",
    borderRadius:"20px 20px 0 0",
    padding:"20px",
    maxHeight:"85vh", overflowY:"auto",
  },
  header: {
    display:"flex", justifyContent:"space-between", alignItems:"center",
    marginBottom:"20px",
  },
  title: {
    fontFamily:"var(--font-heading)", fontSize:"18px",
    fontWeight:700, color:"var(--color-text-primary)",
  },
  closeBtn: {
    background:"none", border:"none", cursor:"pointer",
    color:"var(--color-text-secondary)",
  },
  dropZone: {
    border:"2px dashed var(--color-border)",
    borderRadius:"var(--radius-lg)",
    padding:"32px 20px",
    textAlign:"center", cursor:"pointer",
    marginBottom:"14px",
    transition:"border-color var(--transition-fast)",
  },
  dropText: {
    color:"var(--color-text-primary)", fontFamily:"var(--font-heading)",
    fontSize:"16px", marginTop:"10px",
  },
  dropSub: {
    color:"var(--color-text-muted)", fontSize:"12px", marginTop:"4px",
  },
  fileInfo: { display:"flex", flexDirection:"column", gap:"6px" },
  fileName: { color:"var(--color-text-primary)", fontSize:"14px", wordBreak:"break-all" },
  fileSize: { color:"var(--color-text-secondary)", fontSize:"12px" },
  caption: {
    width:"100%", background:"var(--color-bg-elevated)",
    border:"1px solid var(--color-border)", borderRadius:"var(--radius-md)",
    padding:"12px", color:"var(--color-text-primary)",
    fontSize:"14px", fontFamily:"var(--font-body)",
    resize:"none", marginBottom:"14px",
  },
  progressWrap: {
    display:"flex", alignItems:"center", gap:"10px", marginBottom:"12px",
  },
  progressBar: {
    flex:1, height:"6px", background:"var(--color-border)",
    borderRadius:"3px", overflow:"hidden",
  },
  progressFill: {
    height:"100%", background:"var(--color-accent)",
    borderRadius:"3px", transition:"width 0.3s ease",
  },
  progressText: { color:"var(--color-text-secondary)", fontSize:"12px", minWidth:"36px" },
  processingText: {
    color:"var(--color-accent)", fontSize:"13px",
    textAlign:"center", marginBottom:"12px",
  },
  error: { color:"var(--color-danger)", fontSize:"13px", marginBottom:"10px" },
  uploadBtn: {
    width:"100%", padding:"14px",
    background:"var(--color-accent)", color:"#fff",
    border:"none", borderRadius:"var(--radius-md)",
    fontSize:"15px", fontWeight:700, fontFamily:"var(--font-heading)",
    letterSpacing:"1px", cursor:"pointer",
    boxShadow:"var(--shadow-glow)",
  },
  successBox: {
    display:"flex", flexDirection:"column", alignItems:"center",
    padding:"30px 0", gap:"10px",
  },
  successText: {
    fontFamily:"var(--font-display)", fontSize:"28px",
    color:"var(--color-text-primary)",
  },
  successSub: { color:"var(--color-text-secondary)", fontSize:"14px" },
  doneBtn: {
    marginTop:"10px", padding:"12px 40px",
    background:"var(--color-accent)", color:"#fff",
    border:"none", borderRadius:"var(--radius-full)",
    fontWeight:700, fontSize:"15px", cursor:"pointer",
  },
};