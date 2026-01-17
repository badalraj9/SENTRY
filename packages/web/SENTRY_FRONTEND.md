# SENTRY Frontend Architecture
> The 2026 Developer Terminal - A Collaborative OS

---

## 🎯 Vision

SENTRY is a **Collaborative Operating System** combining four app personalities:

| Personality | Inspiration | SENTRY Feature |
|-------------|-------------|----------------|
| **The Brain** | Notion | Documents, Workshops |
| **The Pulse** | Twitter | Activity Feed |
| **The Nervous System** | Slack | Real-time Chat |
| **The Muscle** | GitHub | Decisions, Projects |

---

## 🏗️ Architecture

### Feature-Sliced Design
```
src/
├── app/
│   └── layouts/
│       ├── DashboardLayout.tsx    # CSS Grid shell
│       ├── AuthLayout.tsx         # Login/Register
│       ├── Sidebar.tsx            # Collapsible nav
│       └── CommandPalette.tsx     # Cmd+K
│
├── features/
│   ├── auth/                      # Login, Register
│   ├── dashboard/                 # Bento Grid home
│   ├── chat/                      # Virtuoso + RTK Query
│   ├── workshop/                  # State machine + framer-motion
│   ├── documents/                 # Tiptap editor
│   └── placeholder/               # Coming soon pages
│
├── shared/
│   ├── api/
│   │   └── apiSlice.ts           # RTK Query endpoints
│   ├── lib/
│   │   └── utils.ts              # cn(), formatRelativeTime()
│   └── ui/                        # Button, Input, Dialog, etc.
│
└── store/
    └── slices/
        ├── authSlice.ts
        ├── workshopSlice.ts       # State machine
        └── ...
```

---

## 🎨 Design System

### Terminal Aesthetic
- **Background:** Zinc-950 (`#09090b`)
- **Surfaces:** Zinc-900 (`#18181b`)
- **Borders:** Zinc-700 (`#3f3f46`)
- **Text:** Zinc-300 (`#d4d4d8`)
- **Accent:** Custom blue (`#7c9eff`)
- **Success:** Emerald-500 (`#10b981`)

### Typography
- **Sans:** Inter (UI text)
- **Mono:** JetBrains Mono (code, labels)
- **Base size:** 13px (terminal-optimized)

---

## ⚡ Key Features

### 1. Bento Dashboard
High-density command center with CSS Grid:
- Activity Pulse (timeline)
- Decision Review Queue
- Live Workshop Status
- Recent Documents
- Direct Messages

### 2. Chat System
- **Virtuoso** for 10k+ messages
- **Optimistic UI** with RTK Query
- **WebSocket** cache injection
- Status indicators (sending/sent/error)

### 3. Workshop Engine
State machine phases:
```
LOBBY → AGENDA → BRAINSTORM → VOTING → SUMMARY
```
- **framer-motion** transitions
- Real-time participant sync
- Interactive idea voting

### 4. Command Palette (Cmd+K)
- Navigation shortcuts
- Quick actions
- AI assistant trigger

---

## 🔌 Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | React 19 + Vite |
| State | Redux Toolkit + RTK Query |
| Routing | React Router |
| Styling | Tailwind CSS + clsx/tailwind-merge |
| UI | Radix UI + Lucide React |
| Real-time | Socket.IO Client |
| Animations | Framer Motion |
| Lists | React Virtuoso |

---

## 🔗 Bridge Features

### Slack → Notion
"Convert to Doc" on message hover → AI summarize → Tiptap draft

### Notion → GitHub  
Select text → "Propose Decision" → Creates decision record

### GitHub → Twitter
Decision approved → Auto-post to Activity Feed

---

## 📁 File Structure Summary

```
packages/web/src/
├── App.tsx                         # Router config
├── index.css                       # Tailwind + globals
├── main.tsx                        # Entry point
│
├── app/layouts/
│   ├── DashboardLayout.tsx
│   ├── AuthLayout.tsx
│   ├── Sidebar.tsx
│   └── CommandPalette.tsx
│
├── features/
│   ├── auth/
│   │   ├── LoginPage.tsx
│   │   └── RegisterPage.tsx
│   ├── dashboard/
│   │   └── DashboardPage.tsx       # Bento Grid
│   ├── chat/
│   │   ├── model/useChatSocket.ts
│   │   └── ui/ChatWindow.tsx
│   └── workshop/
│       ├── ui/WorkshopLiveSession.tsx
│       ├── ui/AgendaTimeline.tsx
│       └── ui/stages/*.tsx
│
├── shared/
│   ├── api/apiSlice.ts
│   ├── lib/utils.ts
│   └── ui/*.tsx
│
└── store/
    ├── index.ts
    ├── hooks.ts
    └── slices/*.ts
```

---

## 🚀 Getting Started

```bash
cd packages/web
npm install
npm run dev
# → http://localhost:5173
```

---

## ✅ Implementation Status

| Phase | Status |
|-------|--------|
| Phase 0: Terminal Shell | ✅ Complete |
| Phase 1: API & State (RTK Query) | ✅ Complete |
| Phase 2: Chat System | ✅ Complete |
| Phase 3: Tiptap Editor | 🔲 Pending |
| Phase 4: Workshop Engine | ✅ Complete |
| Phase 5: AI Assistant | 🔲 Pending |
| Bento Dashboard | ✅ Complete |

---

*Built with the "2026 Developer Terminal" philosophy: functional, dense, instant.*
