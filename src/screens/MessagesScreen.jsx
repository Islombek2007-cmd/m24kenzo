import { useState, useEffect, useRef, useCallback } from "react";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  getDocs,
  doc,
  setDoc,
  limit,
  or,
} from "firebase/firestore";
import { db } from "../firebase/config";
import { useAuth } from "../hooks/useAuth";

/* ─────────────────────────────────────────────
   Helpers
───────────────────────────────────────────── */
function conversationId(uid1, uid2) {
  return [uid1, uid2].sort().join("_");
}

function fmtTime(ts) {
  if (!ts) return "";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  const now = new Date();
  const diff = (now - d) / 1000;
  if (diff < 60) return "now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function fmtFullTime(ts) {
  if (!ts) return "";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

/* ─────────────────────────────────────────────
   Styles
───────────────────────────────────────────── */
const S = {
  root: {
    display: "flex",
    flexDirection: "column",
    height: "100dvh",
    background: "#0a0a0a",
    color: "#f0f0f0",
    fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
    overflow: "hidden",
  },
  topBar: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "18px 20px 14px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    flexShrink: 0,
  },
  topTitle: {
    fontSize: 20, fontWeight: 700,
    letterSpacing: "-0.4px", margin: 0,
  },
  searchWrap: { padding: "12px 16px 8px", flexShrink: 0 },
  searchInput: {
    width: "100%", boxSizing: "border-box",
    background: "rgba(255,255,255,0.06)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 12, padding: "10px 14px", fontSize: 14,
    color: "#f0f0f0", outline: "none",
    transition: "border-color 0.2s",
  },
  list: { flex: 1, overflowY: "auto", padding: "4px 0" },
  row: {
    display: "flex", alignItems: "center", gap: 12,
    padding: "10px 16px", cursor: "pointer",
    transition: "background 0.15s",
  },
  avatar: (size = 44) => ({
    width: size, height: size, borderRadius: "50%",
    background: "linear-gradient(135deg, #fe2c55, #ff6b6b)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: size * 0.38, fontWeight: 700, flexShrink: 0,
    color: "#fff", border: "2px solid rgba(254,44,85,0.3)",
    textTransform: "uppercase",
  }),
  userMeta: { display: "flex", flexDirection: "column", gap: 2 },
  userName: { fontSize: 15, fontWeight: 600 },
  userSub: { fontSize: 12, opacity: 0.45 },
  convMeta: { flex: 1, minWidth: 0 },
  convName: { fontSize: 15, fontWeight: 600, marginBottom: 2 },
  convPreview: {
    fontSize: 13, opacity: 0.45,
    whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
  },
  convTime: {
    fontSize: 11, opacity: 0.35,
    flexShrink: 0, alignSelf: "flex-start", marginTop: 2,
  },
  empty: {
    flex: 1, display: "flex", flexDirection: "column",
    alignItems: "center", justifyContent: "center",
    opacity: 0.4, gap: 10, padding: 32, textAlign: "center",
  },
  emptyIcon: { fontSize: 36 },
  emptyTitle: { fontSize: 15, fontWeight: 600 },
  emptySub: { fontSize: 13, lineHeight: 1.5 },
  unreadDot: {
    width: 8, height: 8, borderRadius: "50%",
    background: "#fe2c55", flexShrink: 0,
  },

  /* ── Chat ── */
  chatRoot: {
    display: "flex", flexDirection: "column", height: "100dvh",
    background: "#0a0a0a", color: "#f0f0f0",
    fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
  },
  chatHeader: {
    display: "flex", alignItems: "center", gap: 12,
    padding: "14px 16px",
    borderBottom: "1px solid rgba(255,255,255,0.06)",
    flexShrink: 0,
  },
  backBtn: {
    background: "none", border: "none", color: "#f0f0f0",
    cursor: "pointer", padding: 4,
    display: "flex", alignItems: "center", borderRadius: 6,
  },
  chatHeaderInfo: { flex: 1 },
  chatHeaderName: { fontSize: 16, fontWeight: 700 },
  chatHeaderSub: { fontSize: 11, opacity: 0.4, marginTop: 1 },

  msgList: {
    flex: 1, overflowY: "auto",
    padding: "16px 14px",
    display: "flex", flexDirection: "column", gap: 2,
  },

  /* date divider */
  dateDivider: {
    textAlign: "center", fontSize: 11,
    color: "rgba(255,255,255,0.3)",
    margin: "12px 0 8px",
    display: "flex", alignItems: "center", gap: 10,
  },
  dateLine: { flex: 1, height: 1, background: "rgba(255,255,255,0.08)" },

  msgGroup: { display: "flex", flexDirection: "column", gap: 2, marginBottom: 8 },
  msgGroupLabel: {
    fontSize: 11, opacity: 0.35, marginBottom: 4,
    paddingInline: 4,
  },

  msgWrap: (mine) => ({
    display: "flex",
    justifyContent: mine ? "flex-end" : "flex-start",
    alignItems: "flex-end",
    gap: 6,
  }),
  bubble: (mine) => ({
    maxWidth: "72%", padding: "9px 13px",
    borderRadius: mine ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
    background: mine ? "#fe2c55" : "rgba(255,255,255,0.09)",
    color: mine ? "#fff" : "#f0f0f0",
    fontSize: 14, lineHeight: 1.5, wordBreak: "break-word",
  }),
  bubbleMeta: (mine) => ({
    fontSize: 10, opacity: 0.35, marginTop: 2,
    textAlign: mine ? "right" : "left",
    paddingInline: 4,
    display: "flex",
    justifyContent: mine ? "flex-end" : "flex-start",
    alignItems: "center",
    gap: 4,
  }),
  statusTick: { fontSize: 10, opacity: 0.5 },

  inputBar: {
    display: "flex", alignItems: "flex-end", gap: 10,
    padding: "10px 14px 14px",
    borderTop: "1px solid rgba(255,255,255,0.06)",
    flexShrink: 0,
  },
  msgInput: {
    flex: 1,
    background: "rgba(255,255,255,0.07)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 16, padding: "10px 14px", fontSize: 14,
    color: "#f0f0f0", outline: "none", resize: "none",
    maxHeight: 120, lineHeight: 1.4,
    fontFamily: "inherit", overflowY: "auto",
  },
  sendBtn: (active) => ({
    width: 40, height: 40, borderRadius: "50%",
    background: active ? "#fe2c55" : "rgba(255,255,255,0.08)",
    border: "none",
    color: active ? "#fff" : "rgba(255,255,255,0.3)",
    cursor: active ? "pointer" : "default",
    display: "flex", alignItems: "center", justifyContent: "center",
    flexShrink: 0, transition: "background 0.2s, color 0.2s",
    boxShadow: active ? "0 0 16px rgba(254,44,85,0.4)" : "none",
  }),

  errorBanner: {
    margin: "8px 14px", padding: "10px 14px",
    background: "rgba(255,80,80,0.12)",
    border: "1px solid rgba(255,80,80,0.25)",
    borderRadius: 10, fontSize: 12, color: "#ff8080", lineHeight: 1.5,
  },
};

/* ─────────────────────────────────────────────
   ChatView
───────────────────────────────────────────── */
function ChatView({ otherUser, onBack, currentUser }) {
  const [messages, setMessages] = useState([]);
  const [text, setText]         = useState("");
  const [sending, setSending]   = useState(false);
  const [error, setError]       = useState(null);
  const bottomRef   = useRef(null);
  const textareaRef = useRef(null);
  const convId = conversationId(currentUser.uid, otherUser.uid);

  /* ── Real-time listener ──
     Listens to messages with the conversationId field.
     Also catches OLD messages stored without conversationId
     by querying both sender→receiver and receiver→sender. */
  useEffect(() => {
    setMessages([]);
    setError(null);

    // Primary query: new format with conversationId
    const qNew = query(
      collection(db, "messages"),
      where("conversationId", "==", convId),
      orderBy("createdAt", "asc")
    );

    // Fallback query: old format — sent by me to them
    const qOldSent = query(
      collection(db, "messages"),
      where("senderId",   "==", currentUser.uid),
      where("receiverId", "==", otherUser.uid),
      orderBy("createdAt", "asc")
    );

    // Fallback query: old format — sent by them to me
    const qOldReceived = query(
      collection(db, "messages"),
      where("senderId",   "==", otherUser.uid),
      where("receiverId", "==", currentUser.uid),
      orderBy("createdAt", "asc")
    );

    const allMessages = { new: [], oldSent: [], oldReceived: [] };

    function merge() {
      // Combine, deduplicate by id, sort by createdAt
      const combined = [
        ...allMessages.new,
        ...allMessages.oldSent,
        ...allMessages.oldReceived,
      ];
      const seen = new Set();
      const deduped = combined.filter(m => {
        if (seen.has(m.id)) return false;
        seen.add(m.id);
        return true;
      });
      deduped.sort((a, b) => {
        const ta = a.createdAt?.toMillis?.() ?? 0;
        const tb = b.createdAt?.toMillis?.() ?? 0;
        return ta - tb;
      });
      setMessages(deduped);
    }

    const unsubNew = onSnapshot(qNew, (snap) => {
      allMessages.new = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      merge();
    }, (err) => {
      if (err.code === "failed-precondition") {
        setError("Missing Firestore index for messages. Go to Firebase Console → Firestore → Indexes and add: Collection: messages | conversationId (Asc) + createdAt (Asc)");
      } else {
        setError(err.message);
      }
    });

    const unsubOldSent = onSnapshot(qOldSent, (snap) => {
      allMessages.oldSent = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      merge();
    }, () => {}); // silently ignore old-format errors

    const unsubOldReceived = onSnapshot(qOldReceived, (snap) => {
      allMessages.oldReceived = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      merge();
    }, () => {});

    return () => {
      unsubNew();
      unsubOldSent();
      unsubOldReceived();
    };
  }, [convId, currentUser.uid, otherUser.uid]);

  /* Auto-scroll */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /* Auto-resize textarea */
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
  }, [text]);

  const sendMessage = useCallback(async () => {
    const trimmed = text.trim();
    if (!trimmed || sending) return;

    setSending(true);
    setText("");

    try {
      // Write message with conversationId (new format)
      await addDoc(collection(db, "messages"), {
        conversationId: convId,
        senderId:       currentUser.uid,
        receiverId:     otherUser.uid,
        text:           trimmed,
        createdAt:      serverTimestamp(),
      });

      // Upsert conversation doc so inbox list stays current
      await setDoc(
        doc(db, "conversations", convId),
        {
          participants:  [currentUser.uid, otherUser.uid],
          lastMessage:   trimmed,
          lastMessageAt: serverTimestamp(),
          lastSenderId:  currentUser.uid,
          [`userInfo_${currentUser.uid}`]: {
            uid:      currentUser.uid,
            username: currentUser.username || currentUser.email || currentUser.uid,
          },
          [`userInfo_${otherUser.uid}`]: {
            uid:      otherUser.uid,
            username: otherUser.username || otherUser.uid,
          },
        },
        { merge: true }
      );
    } catch (err) {
      console.error("Send failed:", err);
      setText(trimmed); // give text back
    } finally {
      setSending(false);
      textareaRef.current?.focus();
    }
  }, [text, sending, convId, currentUser, otherUser]);

  const onKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Group messages by date
  function groupByDate(msgs) {
    const groups = [];
    let lastDate = null;
    msgs.forEach(msg => {
      const d = msg.createdAt?.toDate?.() ?? new Date();
      const dateStr = d.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
      if (dateStr !== lastDate) {
        groups.push({ type: "date", label: dateStr });
        lastDate = dateStr;
      }
      groups.push({ type: "msg", msg });
    });
    return groups;
  }

  const grouped = groupByDate(messages);
  const canSend = !!text.trim() && !sending;

  return (
    <div style={S.chatRoot}>
      {/* Header */}
      <div style={S.chatHeader}>
        <button style={S.backBtn} onClick={onBack}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.2"
            strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 5l-7 7 7 7" />
          </svg>
        </button>
        <div style={S.avatar(38)}>
          {(otherUser.username || "?")[0].toUpperCase()}
        </div>
        <div style={S.chatHeaderInfo}>
          <div style={S.chatHeaderName}>@{otherUser.username || otherUser.uid}</div>
          <div style={S.chatHeaderSub}>tap to view profile</div>
        </div>
      </div>

      {/* Error banner */}
      {error && <div style={S.errorBanner}>⚠️ {error}</div>}

      {/* Messages */}
      <div style={S.msgList}>
        {!error && messages.length === 0 && (
          <div style={{ ...S.empty, flex: "none", marginTop: 40 }}>
            <span style={S.emptyIcon}>👋</span>
            <span style={S.emptyTitle}>Say hello to @{otherUser.username}!</span>
          </div>
        )}

        {grouped.map((item, i) => {
          if (item.type === "date") {
            return (
              <div key={`date-${i}`} style={S.dateDivider}>
                <div style={S.dateLine} />
                <span>{item.label}</span>
                <div style={S.dateLine} />
              </div>
            );
          }

          const { msg } = item;
          const mine = msg.senderId === currentUser.uid;

          return (
            <div key={msg.id}>
              <div style={S.msgWrap(mine)}>
                {/* Show avatar for other person */}
                {!mine && (
                  <div style={{ ...S.avatar(24), fontSize: 10 }}>
                    {(otherUser.username || "?")[0].toUpperCase()}
                  </div>
                )}
                <div style={S.bubble(mine)}>{msg.text}</div>
              </div>
              <div style={S.bubbleMeta(mine)}>
                <span>{fmtFullTime(msg.createdAt)}</span>
                {mine && <span style={S.statusTick}>✓</span>}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={S.inputBar}>
        <textarea
          ref={textareaRef}
          style={S.msgInput}
          rows={1}
          placeholder={`Message @${otherUser.username}…`}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKey}
        />
        <button
          style={S.sendBtn(canSend)}
          onClick={sendMessage}
          disabled={!canSend}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3.4 20.4l17.45-7.48a1 1 0 000-1.84L3.4 3.6a.993.993 0 00-1.39.91L2 9.12c0 .5.37.93.87.99L17 12 2.87 13.88c-.5.07-.87.5-.87 1l.01 4.51c0 .71.73 1.2 1.39.91z" />
          </svg>
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   MessagesScreen — inbox
───────────────────────────────────────────── */
export default function MessagesScreen() {
  const { user, profile }   = useAuth();
  const currentUser         = profile;

  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat]       = useState(null);
  const [searchQuery, setSearchQuery]     = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching]         = useState(false);

  /* Conversations real-time */
  useEffect(() => {
    if (!currentUser?.uid) return;
    const q = query(
      collection(db, "conversations"),
      where("participants", "array-contains", currentUser.uid),
      orderBy("lastMessageAt", "desc")
    );
    const unsub = onSnapshot(q, (snap) => {
      const convs = snap.docs.map((d) => {
        const data    = d.data();
        const otherId = data.participants.find((p) => p !== currentUser.uid);
        const otherInfo = data[`userInfo_${otherId}`] || { uid: otherId, username: otherId };
        return { id: d.id, ...data, otherUser: otherInfo };
      });
      setConversations(convs);
    });
    return unsub;
  }, [currentUser?.uid]);

  /* User search — debounced */
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const q = query(
          collection(db, "users"),
          where("username", ">=", searchQuery.toLowerCase()),
          where("username", "<=", searchQuery.toLowerCase() + "\uf8ff"),
          limit(10)
        );
        const snap = await getDocs(q);
        setSearchResults(
          snap.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .filter((u) => u.uid !== currentUser?.uid)
        );
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery, currentUser?.uid]);

  if (!user || !currentUser) {
    return (
      <div style={{ ...S.root, ...S.empty }}>
        <span style={S.emptyIcon}>🔒</span>
        <span style={S.emptyTitle}>Sign in to message</span>
      </div>
    );
  }

  if (activeChat) {
    return (
      <ChatView
        otherUser={activeChat}
        currentUser={currentUser}
        onBack={() => setActiveChat(null)}
      />
    );
  }

  const showSearch = searchQuery.trim().length > 0;

  return (
    <div style={S.root}>
      {/* Top bar */}
      <div style={S.topBar}>
        <h1 style={S.topTitle}>Messages</h1>
      </div>

      {/* Search */}
      <div style={S.searchWrap}>
        <input
          style={S.searchInput}
          placeholder="🔍  Search users to message…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onFocus={(e) => (e.target.style.borderColor = "rgba(254,44,85,0.5)")}
          onBlur={(e)  => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
        />
      </div>

      {/* Search results */}
      {showSearch ? (
        <div style={S.list}>
          {searching && (
            <div style={{ padding: "12px 16px", opacity: 0.4, fontSize: 13 }}>
              Searching…
            </div>
          )}
          {!searching && searchResults.length === 0 && (
            <div style={{ padding: "12px 16px", opacity: 0.4, fontSize: 13 }}>
              No users found for "{searchQuery}"
            </div>
          )}
          {searchResults.map((u) => (
            <div
              key={u.uid}
              style={S.row}
              onClick={() => {
                setActiveChat({ uid: u.uid, username: u.username });
                setSearchQuery("");
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
            >
              <div style={S.avatar(44)}>
                {(u.username || "?")[0].toUpperCase()}
              </div>
              <div style={S.userMeta}>
                <span style={S.userName}>@{u.username}</span>
                <span style={S.userSub}>{u.email}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Inbox */
        <div style={S.list}>
          {conversations.length === 0 ? (
            <div style={S.empty}>
              <span style={S.emptyIcon}>✉️</span>
              <span style={S.emptyTitle}>No conversations yet</span>
              <span style={S.emptySub}>Search for a user above to start chatting</span>
            </div>
          ) : (
            conversations.map((conv) => {
              const isMe = conv.lastSenderId === currentUser.uid;
              return (
                <div
                  key={conv.id}
                  style={S.row}
                  onClick={() => setActiveChat(conv.otherUser)}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <div style={S.avatar(46)}>
                    {(conv.otherUser?.username || "?")[0].toUpperCase()}
                  </div>
                  <div style={S.convMeta}>
                    <div style={S.convName}>
                      @{conv.otherUser?.username || conv.otherUser?.uid}
                    </div>
                    <div style={S.convPreview}>
                      {isMe
                        ? `You: ${conv.lastMessage}`
                        : `${conv.otherUser?.username}: ${conv.lastMessage}`}
                    </div>
                  </div>
                  <div style={S.convTime}>
                    {fmtTime(conv.lastMessageAt)}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}