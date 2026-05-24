import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  collection, query, orderBy, limit,
  onSnapshot, doc, updateDoc, increment,
  addDoc, serverTimestamp, getDoc, setDoc, deleteDoc,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../hooks/useAuth";
import ProfileScreen from "./ProfileScreen";
import { AiFillHeart, AiOutlineHeart } from "react-icons/ai";
import { FaCommentDots, FaShare, FaEllipsisV } from "react-icons/fa";
import { IoClose, IoPaperPlane, IoChevronDown, IoMusicalNotes } from "react-icons/io5";
import { MdOutlineBookmark } from "react-icons/md";

// ─── Main Screen ───────────────────────────────────────────────
export default function ShortsScreen() {
  const [videos, setVideos]           = useState([]);
  const [current, setCurrent]         = useState(0);
  const [loading, setLoading]         = useState(true);
  const [activeTab, setActiveTab]     = useState("forYou");
  // Tapped username → show their profile
  const [viewingProfile, setViewingProfile] = useState(null); // { uid, username }
  const containerRef                  = useRef(null);
  const touchStartY                   = useRef(null);

  useEffect(() => {
    const q = query(
      collection(db, "videos"),
      orderBy("publishedAt", "desc"),
      limit(20)
    );
    const unsub = onSnapshot(q, (snap) => {
      setVideos(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return unsub;
  }, []);

  const goNext = useCallback(() => {
    setCurrent(c => Math.min(c + 1, videos.length - 1));
  }, [videos.length]);

  const goPrev = useCallback(() => {
    setCurrent(c => Math.max(c - 1, 0));
  }, []);

  const onTouchStart = (e) => { touchStartY.current = e.touches[0].clientY; };
  const onTouchEnd   = (e) => {
    if (touchStartY.current === null) return;
    const diff = touchStartY.current - e.changedTouches[0].clientY;
    if (Math.abs(diff) > 50) diff > 0 ? goNext() : goPrev();
    touchStartY.current = null;
  };

  const onWheel = useCallback((e) => {
    e.preventDefault();
    if (e.deltaY > 40)  goNext();
    if (e.deltaY < -40) goPrev();
  }, [goNext, goPrev]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [onWheel]);

  // ── Show someone's profile overlay ──
  if (viewingProfile) {
    return (
      <ProfileScreen
        userId={viewingProfile.uid}
        onBack={() => setViewingProfile(null)}
      />
    );
  }

  if (loading) return <LoadingView />;
  if (!videos.length) return <EmptyView />;

  return (
    <div ref={containerRef} style={s.root}
      onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>

      {/* ── Top Tab Bar ── */}
      <div style={s.topBar}>
        {[
          { key: "following", label: "Following" },
          { key: "forYou",   label: "For You"   },
          { key: "live",     label: "🔴 LIVE"   },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              ...s.tabBtn,
              color: activeTab === tab.key ? "#fff" : "rgba(255,255,255,0.45)",
              borderBottom: activeTab === tab.key
                ? "2px solid #fe2c55"
                : "2px solid transparent",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Video Slides ── */}
      {videos.map((video, i) => (
        <VideoSlide
          key={video.id}
          video={video}
          active={i === current}
          index={i}
          current={current}
          onNext={goNext}
          onPrev={goPrev}
          hasNext={current < videos.length - 1}
          hasPrev={current > 0}
          onViewProfile={(uid) => setViewingProfile({ uid })}
        />
      ))}

      {/* ── Side Progress Dots ── */}
      <div style={s.dots}>
        {videos.slice(0, 8).map((_, i) => (
          <div
            key={i}
            style={{
              ...s.dot,
              opacity:    i === current ? 1 : 0.25,
              height:     i === current ? "20px" : "4px",
              background: i === current ? "#fe2c55" : "rgba(255,255,255,0.7)",
              boxShadow:  i === current ? "0 0 6px #fe2c55" : "none",
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Single Video Slide ─────────────────────────────────────────
function VideoSlide({ video, active, index, current, onNext, hasPrev, hasNext, onViewProfile }) {
  const { user, profile } = useAuth();
  const videoRef = useRef(null);

  const [playing, setPlaying]           = useState(false);
  const [liked, setLiked]               = useState(false);
  const [likeCount, setLikeCount]       = useState(null);
  const [showComments, setShowComments] = useState(false);
  const [commentCount, setCommentCount] = useState(video.commentCount || 0);
  const [progress, setProgress]         = useState(0);
  const [following, setFollowing]       = useState(false);
  const [bookmarked, setBookmarked]     = useState(false);

  useEffect(() => {
    if (!video.id) return;
    const unsub = onSnapshot(doc(db, "videos", video.id), (snap) => {
      if (snap.exists()) setLikeCount(snap.data().likes ?? 0);
    });
    return unsub;
  }, [video.id]);

  useEffect(() => {
    if (!user || !video.id) return;
    getDoc(doc(db, "likes", `${video.id}_${user.uid}`))
      .then(snap => setLiked(snap.exists()));
  }, [user, video.id]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (active) {
      v.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    } else {
      v.pause();
      v.currentTime = 0;
      setPlaying(false);
      setProgress(0);
    }
  }, [active]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || !active) return;
    const tick = () => {
      if (v.duration) setProgress(v.currentTime / v.duration);
    };
    v.addEventListener("timeupdate", tick);
    return () => v.removeEventListener("timeupdate", tick);
  }, [active]);

  function togglePlay() {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play(); setPlaying(true); }
    else          { v.pause(); setPlaying(false); }
  }

  async function toggleLike() {
    if (!user) return;
    const likeId      = `${video.id}_${user.uid}`;
    const likeRef     = doc(db, "likes", likeId);
    const videoDocRef = doc(db, "videos", video.id);
    if (liked) {
      setLiked(false);
      try {
        await deleteDoc(likeRef);
        await updateDoc(videoDocRef, { likes: increment(-1) });
      } catch { setLiked(true); }
    } else {
      setLiked(true);
      try {
        await setDoc(likeRef, { uid: user.uid, videoId: video.id, createdAt: serverTimestamp() });
        await updateDoc(videoDocRef, { likes: increment(1) });
      } catch { setLiked(false); }
    }
  }

  const offset = (index - current) * 100;

  return (
    <div style={{ ...s.slide, transform: `translateY(${offset}%)` }}>

      <video
        ref={videoRef}
        src={video.url}
        style={s.video}
        loop playsInline
        poster={video.thumbnail || ""}
        onClick={togglePlay}
      />

      {!playing && (
        <div style={s.playOverlay} onClick={togglePlay}>
          <div style={s.playCircle}>
            <span style={{ fontSize: 28, marginLeft: 4 }}>▶</span>
          </div>
        </div>
      )}

      <div style={s.progressTrack}>
        <div style={{ ...s.progressFill, width: `${progress * 100}%` }} />
      </div>

      <div style={s.gradient} />

      {/* ── Bottom Info ── */}
      <div style={s.info}>
        <div style={s.creatorRow}>
          {/* ── Tappable avatar + username → opens profile ── */}
          <div
            style={s.creatorAvatar}
            onClick={() => onViewProfile(video.uid)}
          >
            <span style={s.creatorAvatarText}>
              {(video.username || "?")[0].toUpperCase()}
            </span>
          </div>
          <span
            style={{ ...s.username, cursor: "pointer", textDecoration: "underline" }}
            onClick={() => onViewProfile(video.uid)}
          >
            @{video.username}
          </span>
          <button
            onClick={() => setFollowing(f => !f)}
            style={{
              ...s.followPill,
              background:  following ? "rgba(255,255,255,0.15)" : "rgba(254,44,85,0.15)",
              borderColor: following ? "rgba(255,255,255,0.3)"  : "rgba(254,44,85,0.5)",
              color:       following ? "#fff"                   : "#fe2c55",
            }}
          >
            {following ? "✓ Following" : "+ Follow"}
          </button>
        </div>

        <p style={s.caption}>{video.caption || ""}</p>

        <div style={s.soundRow}>
          <div style={s.soundDisc}>
            <IoMusicalNotes size={10} color="#fff" />
          </div>
          <div style={s.soundTickerWrap}>
            <span style={s.soundText}>{video.soundName || "Original Sound"}</span>
          </div>
        </div>
      </div>

      {/* ── Right Actions ── */}
      <div style={s.actions}>
        <ActionBtn
          icon={liked
            ? <AiFillHeart size={30} color="#fe2c55" />
            : <AiOutlineHeart size={30} color="#fff" />}
          label={likeCount === null ? "…" : fmtNum(likeCount)}
          onClick={toggleLike}
          glow={liked ? "rgba(254,44,85,0.45)" : null}
        />
        <ActionBtn
          icon={<FaCommentDots size={27} color="#fff" />}
          label={fmtNum(commentCount)}
          onClick={() => setShowComments(true)}
        />
        <ActionBtn
          icon={<MdOutlineBookmark size={30} color={bookmarked ? "#f0c040" : "#fff"} />}
          label="Save"
          onClick={() => setBookmarked(b => !b)}
          glow={bookmarked ? "rgba(240,192,64,0.4)" : null}
        />
        


        
        <ActionBtn
          icon={<FaEllipsisV size={22} color="#fff" />}
          label=""
          onClick={() => {}}
        />
      </div>

      {hasNext && !showComments && (
        <div style={s.swipeHint}>
          <span style={s.swipeArrow}>⌃</span>
          <span style={s.swipeLabel}>swipe up</span>
        </div>
      )}

      {showComments && (
        <CommentsPanel
          videoId={video.id}
          onClose={() => setShowComments(false)}
          onCountChange={setCommentCount}
        />
      )}
    </div>
  );
}

// ─── Action Button ──────────────────────────────────────────────
function ActionBtn({ icon, label, onClick, glow }) {
  const [pop, setPop] = useState(false);
  function handle() {
    setPop(true);
    setTimeout(() => setPop(false), 280);
    onClick?.();
  }
  return (
    <button onClick={handle} style={s.actionBtn}>
      <div style={{
        ...s.actionIconWrap,
        transform:   pop  ? "scale(1.32)" : "scale(1)",
        boxShadow:   glow ? `0 0 16px ${glow}` : "none",
        borderColor: glow ? glow : "rgba(255,255,255,0.12)",
        background:  glow ? `${glow.replace("0.45","0.14")}` : "rgba(255,255,255,0.08)",
      }}>
        {icon}
      </div>
      {label ? <span style={s.actionLabel}>{label}</span> : null}
    </button>
  );
}

// ─── Comments Panel ─────────────────────────────────────────────
function CommentsPanel({ videoId, onClose, onCountChange }) {
  const { user, profile } = useAuth();
  const [comments, setComments] = useState([]);
  const [text, setText]         = useState("");
  const [replyTo, setReplyTo]   = useState(null);
  const bottomRef               = useRef(null);

  useEffect(() => {
    const q = query(collection(db, "comments"), orderBy("createdAt", "asc"));
    return onSnapshot(q, (snap) => {
      const all = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(c => c.videoId === videoId);
      setComments(all);
      onCountChange(all.filter(c => !c.parentId).length);
    });
  }, [videoId]);

  async function send() {
    if (!text.trim() || !user) return;
    await addDoc(collection(db, "comments"), {
      videoId,
      uid:       user.uid,
      username:  profile?.username || "user",
      text:      text.trim(),
      parentId:  replyTo?.id || null,
      createdAt: serverTimestamp(),
      likes:     0,
    });
    setText("");
    setReplyTo(null);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 150);
  }

  const topLevel = comments.filter(c => !c.parentId);
  const replies  = (pid) => comments.filter(c => c.parentId === pid);

  return (
    <div style={s.commentsOverlay} onClick={e => e.stopPropagation()}>
      <div style={s.commentsPanel}>
        <div style={s.handleBar} />
        <div style={s.commentsHeader}>
          <span style={s.commentsTitle}>{fmtNum(topLevel.length)} Comments</span>
          <button onClick={onClose} style={s.closeBtn}>
            <IoClose size={22} color="var(--color-text-secondary, #aaa)" />
          </button>
        </div>
        <div style={s.commentsList}>
          {topLevel.length === 0 && (
            <p style={s.noComments}>No comments yet. Be the first! 👇</p>
          )}
          {topLevel.map(c => (
            <CommentItem
              key={c.id}
              comment={c}
              replies={replies(c.id)}
              onReply={() => setReplyTo({ id: c.id, username: c.username })}
            />
          ))}
          <div ref={bottomRef} />
        </div>
        <div style={s.inputRow}>
          {replyTo && (
            <div style={s.replyBadge}>
              <span>Replying to <b>@{replyTo.username}</b></span>
              <button onClick={() => setReplyTo(null)} style={s.cancelReply}>✕</button>
            </div>
          )}
          <div style={s.inputWrap}>
            <div style={s.inputAvatar}>
              {(profile?.username || "U")[0].toUpperCase()}
            </div>
            <input
              style={s.commentInput}
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder={replyTo ? `Reply to @${replyTo.username}…` : "Add a comment…"}
              onKeyDown={e => e.key === "Enter" && send()}
            />
            <button onClick={send} style={s.sendBtn}>
              <IoPaperPlane size={20} color={text.trim() ? "#fe2c55" : "#444"} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CommentItem({ comment, replies, onReply }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div style={s.commentItem}>
      <div style={s.commentAvatar}>{comment.username[0].toUpperCase()}</div>
      <div style={{ flex: 1 }}>
        <div style={s.commentMeta}>
          <span style={s.commentUser}>@{comment.username}</span>
        </div>
        <p style={s.commentText}>{comment.text}</p>
        <button onClick={onReply} style={s.replyBtn}>Reply</button>
        {replies.length > 0 && (
          <div>
            <button onClick={() => setExpanded(e => !e)} style={s.viewReplies}>
              <IoChevronDown size={12} style={{ transform: expanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
              {expanded ? "Hide" : `View ${replies.length}`} {replies.length === 1 ? "reply" : "replies"}
            </button>
            {expanded && replies.map(r => (
              <div key={r.id} style={s.replyItem}>
                <div style={{ ...s.commentAvatar, width: 26, height: 26, fontSize: 10 }}>
                  {r.username[0].toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <span style={s.commentUser}>@{r.username}</span>
                  <p style={{ ...s.commentText, marginTop: 2 }}>{r.text}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function fmtNum(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function LoadingView() {
  return (
    <div style={s.center}>
      <div style={s.spinner} />
    </div>
  );
}

function EmptyView() {
  return (
    <div style={s.center}>
      <div style={{ fontSize: 48 }}>🎬</div>
      <p style={{ color: "#aaa", fontSize: 18, marginTop: 12, fontFamily: "var(--font-heading)" }}>No shorts yet</p>
      <p style={{ color: "#555", fontSize: 13, marginTop: 6 }}>Be the first to upload!</p>
    </div>
  );
}

const s = {
  root: { position: "relative", width: "100%", height: "100%", overflow: "hidden", background: "#000" },
  topBar: {
    position: "absolute", top: 0, left: 0, right: 0, zIndex: 30,
    display: "flex", justifyContent: "center", alignItems: "center",
    gap: 28, paddingTop: 14, paddingBottom: 10,
    background: "linear-gradient(to bottom, rgba(0,0,0,0.65) 0%, transparent 100%)",
  },
  tabBtn: {
    background: "none", border: "none", borderBottom: "2px solid transparent",
    paddingBottom: 4, cursor: "pointer",
    fontFamily: "'Rajdhani', 'Arial Narrow', sans-serif",
    fontSize: 15, fontWeight: 700, letterSpacing: "0.5px",
    textTransform: "uppercase", transition: "color 0.2s, border-color 0.2s",
  },
  slide: {
    position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
    transition: "transform 0.42s cubic-bezier(0.25,0.46,0.45,0.94)", background: "#000",
  },
  video: { width: "100%", height: "100%", objectFit: "cover", display: "block" },
  playOverlay: {
    position: "absolute", inset: 0, display: "flex",
    alignItems: "center", justifyContent: "center",
    background: "rgba(0,0,0,0.25)", cursor: "pointer",
  },
  playCircle: {
    width: 72, height: 72, borderRadius: "50%",
    background: "rgba(255,255,255,0.15)", backdropFilter: "blur(10px)",
    border: "1.5px solid rgba(255,255,255,0.25)",
    display: "flex", alignItems: "center", justifyContent: "center", color: "#fff",
  },
  progressTrack: { position: "absolute", top: 0, left: 0, right: 0, height: 2, background: "rgba(255,255,255,0.18)", zIndex: 20 },
  progressFill: { height: "100%", background: "#fe2c55", boxShadow: "0 0 6px #fe2c55", borderRadius: "0 2px 2px 0", transition: "width 0.25s linear" },
  gradient: { position: "absolute", bottom: 0, left: 0, right: 0, height: "65%", background: "linear-gradient(transparent, rgba(0,0,0,0.9))", pointerEvents: "none" },
  info: { position: "absolute", bottom: 88, left: 16, right: 78, zIndex: 10 },
  creatorRow: { display: "flex", alignItems: "center", gap: 8, marginBottom: 10 },
  creatorAvatar: {
    width: 34, height: 34, borderRadius: "50%", background: "#fe2c55",
    border: "2px solid rgba(255,255,255,0.8)",
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0, cursor: "pointer",
  },
  creatorAvatarText: { color: "#fff", fontWeight: 700, fontSize: 14, fontFamily: "'Rajdhani', sans-serif" },
  username: { color: "#fff", fontFamily: "'Rajdhani', 'Arial Narrow', sans-serif", fontSize: 15, fontWeight: 700, letterSpacing: "0.3px", flex: 1 },
  followPill: {
    borderRadius: 20, border: "1px solid rgba(254,44,85,0.5)",
    padding: "3px 10px", fontSize: 11, fontFamily: "'Rajdhani', sans-serif",
    fontWeight: 700, cursor: "pointer", letterSpacing: "0.4px",
    transition: "all 0.2s ease", whiteSpace: "nowrap",
  },
  caption: { color: "rgba(255,255,255,0.88)", fontSize: 13, lineHeight: 1.5, fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif", marginBottom: 10 },
  soundRow: { display: "flex", alignItems: "center", gap: 7, overflow: "hidden" },
  soundDisc: { width: 22, height: 22, borderRadius: "50%", background: "#222", border: "1.5px solid #444", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, animation: "spinDisc 4s linear infinite" },
  soundTickerWrap: { overflow: "hidden", flex: 1 },
  soundText: { color: "rgba(255,255,255,0.7)", fontSize: 12, fontFamily: "'DM Sans', sans-serif", display: "inline-block", whiteSpace: "nowrap", animation: "ticker 10s linear infinite" },
  actions: { position: "absolute", right: 12, bottom: 90, display: "flex", flexDirection: "column", alignItems: "center", gap: 16, zIndex: 10 },
  actionBtn: { background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 5, padding: 4 },
  actionIconWrap: { width: 48, height: 48, borderRadius: "50%", background: "rgba(255,255,255,0.08)", backdropFilter: "blur(10px)", border: "1px solid rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center", transition: "transform 0.15s ease, box-shadow 0.2s ease, background 0.2s ease" },
  actionLabel: { color: "#fff", fontSize: 11, fontFamily: "'DM Sans', sans-serif", fontWeight: 500, textShadow: "0 1px 4px rgba(0,0,0,0.9)" },
  dots: { position: "absolute", right: 4, top: "50%", transform: "translateY(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, zIndex: 20 },
  dot: { width: 3, borderRadius: 3, transition: "all 0.3s ease" },
  swipeHint: { position: "absolute", bottom: 74, left: "50%", transform: "translateX(-50%)", display: "flex", flexDirection: "column", alignItems: "center", gap: 1, zIndex: 10, animation: "floatHint 2.2s ease-in-out infinite", pointerEvents: "none" },
  swipeArrow: { fontSize: 16, color: "rgba(255,255,255,0.45)" },
  swipeLabel: { fontSize: 10, color: "rgba(255,255,255,0.35)", fontFamily: "'DM Sans', sans-serif", letterSpacing: "0.5px" },
  commentsOverlay: { position: "absolute", inset: 0, background: "rgba(0,0,0,0.55)", display: "flex", alignItems: "flex-end", zIndex: 50 },
  commentsPanel: { width: "100%", height: "72%", background: "var(--color-bg-card, #1a1a1a)", borderRadius: "22px 22px 0 0", display: "flex", flexDirection: "column", overflow: "hidden", animation: "slideUp 0.28s cubic-bezier(0.25,0.46,0.45,0.94)" },
  handleBar: { width: 38, height: 4, borderRadius: 4, background: "rgba(255,255,255,0.2)", margin: "10px auto 0", flexShrink: 0 },
  commentsHeader: { display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 20px", borderBottom: "1px solid var(--color-border, #2a2a2a)", flexShrink: 0 },
  commentsTitle: { fontFamily: "'Rajdhani', sans-serif", fontSize: 16, fontWeight: 700, color: "var(--color-text-primary, #fff)", letterSpacing: "0.4px" },
  closeBtn: { background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 4 },
  commentsList: { flex: 1, overflowY: "auto", padding: "12px 16px", display: "flex", flexDirection: "column", gap: 16 },
  noComments: { textAlign: "center", color: "var(--color-text-muted, #555)", fontSize: 14, marginTop: 40 },
  commentItem: { display: "flex", gap: 10, alignItems: "flex-start" },
  commentAvatar: { width: 34, height: 34, borderRadius: "50%", background: "#fe2c55", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#fff", flexShrink: 0, fontFamily: "'Rajdhani', sans-serif" },
  commentMeta: { display: "flex", alignItems: "center", gap: 8, marginBottom: 3 },
  commentUser: { color: "#fe2c55", fontSize: 12, fontWeight: 700, fontFamily: "'Rajdhani', sans-serif" },
  commentText: { color: "var(--color-text-primary, #fff)", fontSize: 13, lineHeight: 1.45, fontFamily: "'DM Sans', sans-serif" },
  replyBtn: { background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted, #555)", fontSize: 12, marginTop: 4, padding: 0, fontFamily: "'DM Sans', sans-serif" },
  viewReplies: { background: "none", border: "none", cursor: "pointer", color: "#25f4ee", fontSize: 12, display: "flex", alignItems: "center", gap: 4, marginTop: 6, padding: 0, fontFamily: "'DM Sans', sans-serif" },
  replyItem: { display: "flex", gap: 8, alignItems: "flex-start", marginTop: 8, paddingLeft: 8, borderLeft: "2px solid var(--color-border, #2a2a2a)" },
  inputRow: { padding: "10px 16px 14px", borderTop: "1px solid var(--color-border, #2a2a2a)", flexShrink: 0 },
  replyBadge: { fontSize: 11, color: "var(--color-text-secondary, #aaa)", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6, paddingLeft: 4 },
  cancelReply: { background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted, #555)", fontSize: 13 },
  inputWrap: { display: "flex", alignItems: "center", gap: 8, background: "var(--color-bg-elevated, #222)", borderRadius: 9999, padding: "8px 12px", border: "1px solid var(--color-border, #2a2a2a)" },
  inputAvatar: { width: 28, height: 28, borderRadius: "50%", background: "#fe2c55", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff", flexShrink: 0, fontFamily: "'Rajdhani', sans-serif" },
  commentInput: { flex: 1, background: "none", border: "none", outline: "none", color: "var(--color-text-primary, #fff)", fontSize: 14, fontFamily: "'DM Sans', sans-serif" },
  sendBtn: { background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", padding: 2 },
  center: { height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#000" },
  spinner: { width: 40, height: 40, borderRadius: "50%", border: "3px solid #222", borderTopColor: "#fe2c55", animation: "spinDisc 0.8s linear infinite" },
};