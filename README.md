# M24 Kenzo 🎬
TikTok-style short video app built with React + Firebase + Catbox.

---

## Quick Start

```bash
npm install
npm start
```

Opens at http://localhost:3000

---

## Setup Required

### Firebase (mandatory)
1. Go to https://console.firebase.google.com
2. Create project → **m24-kenzo**
3. Enable **Authentication** → Email/Password ✅
4. Enable **Firestore Database** → test mode ✅
5. Project Settings → Your apps → Add Web App → copy config
6. Paste into `src/firebase/config.js`

### Firestore Rules
Firestore → Rules tab → paste and publish:
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == uid;
    }
    match /usernames/{username} {
      allow read: if true;
      allow create: if request.auth != null;
    }
    match /videos/{videoId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && request.auth.uid == resource.data.uid;
    }
    match /likes/{likeId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
    match /comments/{commentId} {
      allow read: if true;
      allow create: if request.auth != null;
      allow update, delete: if request.auth != null && request.auth.uid == resource.data.uid;
    }
    match /messages/{messageId} {
      allow read, write: if request.auth != null &&
        (request.auth.uid == resource.data.senderId ||
         request.auth.uid == resource.data.receiverId);
    }
  }
}
```

### Firestore Index (mandatory for Profile screen)
Click this link while logged into Firebase console for your project:
Firestore → Indexes → Add composite index:
- Collection: videos
- Fields: uid (Ascending), createdAt (Descending)

---

## Folder Structure

```
m24-kenzo/
├── public/
│   └── index.html
│
├── src/
│   ├── firebase/
│   │   └── config.js              ← YOUR FIREBASE KEYS HERE
│   │
│   ├── theme/
│   │   ├── themes.js              ← ADD / EDIT THEMES HERE
│   │   ├── ThemeProvider.jsx      ← Injects CSS vars globally
│   │   └── index.js               ← Barrel export
│   │
│   ├── hooks/
│   │   └── useAuth.jsx            ← Auth state, signUp, logIn, logOut
│   │
│   ├── utils/
│   │   └── catbox.js              ← Video upload to catbox.moe
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   └── AppLayout.jsx      ← Bottom nav (Home/Shorts/Messages/Profile)
│   │   ├── shorts/
│   │   │   └── UploadModal.jsx    ← Upload UI + Catbox + Firestore save
│   │   ├── auth/                  ← (reserved for future auth components)
│   │   ├── messages/              ← (reserved)
│   │   ├── profile/               ← (reserved)
│   │   └── ui/                    ← (reserved for shared UI bits)
│   │
│   ├── screens/
│   │   ├── AuthScreen.jsx         ← Sign up / Log in ✅ DONE
│   │   ├── HomeScreen.jsx         ← Feed / discovery ✅ DONE (basic)
│   │   ├── ShortsScreen.jsx       ← Vertical scroll, player, likes, comments ✅ DONE
│   │   ├── MessagesScreen.jsx     ← DMs 🔜 TODO
│   │   └── ProfileScreen.jsx      ← Your videos + upload button ✅ DONE
│   │
│   ├── App.jsx                    ← Router + ThemeProvider + AuthProvider
│   ├── index.js                   ← React root
│   └── index.css                  ← Global reset + CSS var base
│
├── package.json
└── README.md
```

---

## What's Built ✅

| Feature | Status | File |
|---|---|---|
| Auth (sign up + log in) | ✅ Done | screens/AuthScreen.jsx |
| Username system | ✅ Done | hooks/useAuth.jsx |
| Bottom navigation | ✅ Done | components/layout/AppLayout.jsx |
| Theme system | ✅ Done | theme/themes.js |
| Shorts vertical feed | ✅ Done | screens/ShortsScreen.jsx |
| Video auto-play/pause | ✅ Done | screens/ShortsScreen.jsx |
| Like button | ✅ Done | screens/ShortsScreen.jsx |
| Comments + nested replies | ✅ Done | screens/ShortsScreen.jsx |
| Video upload (Catbox) | ✅ Done | components/shorts/UploadModal.jsx |
| 5s publish delay | ✅ Done | components/shorts/UploadModal.jsx |
| Profile screen + video grid | ✅ Done | screens/ProfileScreen.jsx |

## What's TODO 🔜

| Feature | File to build |
|---|---|
| Messages / DMs | screens/MessagesScreen.jsx |
| Home feed (explore/trending) | screens/HomeScreen.jsx |
| Follow / unfollow users | hooks/useFollow.jsx |
| Search users | screens/SearchScreen.jsx |
| Notifications | screens/NotificationsScreen.jsx |

---

## Theme System

All colors, fonts, and spacing live in `src/theme/themes.js`.

### Add a new theme:
```js
export const themes = {
  darkNeon: { ... },      // existing
  lightMinimal: { ... },  // existing

  purpleDream: {          // YOUR NEW THEME
    id: "purpleDream",
    label: "Purple Dream",
    colors: {
      bgPrimary:   "#0d0014",
      accent:      "#bf00ff",
      // ... all other color keys
    },
    fonts: { ... },
    radii: { ... },
    shadows: { ... },
    transitions: { ... },
  }
};
```

### Switch theme anywhere:
```jsx
const { setTheme, allThemes } = useTheme();
setTheme("purpleDream");
```

---

## Firestore Data Structure

```
users/{uid}
  uid, email, username, createdAt, followers, following, videoCount

usernames/{username}
  uid

videos/{videoId}
  url, uid, username, caption, likes, commentCount,
  createdAt, publishedAt, published (bool)

likes/{videoId_uid}
  uid, videoId, createdAt

comments/{commentId}
  videoId, uid, username, text, parentId (null = top-level),
  createdAt, likes

messages/{messageId}
  senderId, receiverId, text, createdAt
```

---

## Video Upload Flow

1. User picks video (0–200 MB)
2. `catbox.js` uploads to catbox.moe → returns URL like `https://files.catbox.moe/xxxxx.mp4`
3. Saved to Firestore as `published: false`
4. After **5 seconds** → updated to `published: true, publishedAt: now`
5. Shorts feed queries `published == true` → video appears automatically