# SENTRY MASTER PLAN
> Phases 1-8: The Complete Frontend Architecture

---

## 🌌 VISION: THE COLLABORATIVE OS

SENTRY is a **Collaborative Operating System** blending four app personalities:

| Personality | Inspiration | SENTRY Feature |
|-------------|-------------|----------------|
| 🧠 **The Brain** | Notion | Documents, Workshops |
| 📡 **The Pulse** | Twitter | Activity Feed |
| ⚡ **The Nervous System** | Slack | Real-time Chat |
| 💪 **The Muscle** | GitHub | Decisions, Projects |

---

## 📦 PHASE BREAKDOWN

### Phase 0: Terminal Shell ✅
- Feature-sliced architecture (`features/`, `entities/`, `shared/`)
- Tailwind theme (Zinc-950, terminal aesthetic)
- `DashboardLayout` with CSS Grid
- `CommandPalette` (Cmd+K) with cmdk
- Base UI primitives (Button, Input, Dialog, Kbd, Avatar, Badge, Skeleton)

### Phase 1: Neural Link (API) ✅
- RTK Query `apiSlice` with typed endpoints
- Cache tags for invalidation
- `prepareHeaders` for JWT auth

### Phase 2: Comm Systems (Chat) ✅
- `ChatWindow` with react-virtuoso (10k+ messages)
- `useChatSocket` hook for real-time updates
- Optimistic UI with status indicators

### Phase 3: Knowledge Core (Tiptap) 🔲
- Tiptap with starter-kit
- DecisionNode extension
- SlashCommand extension

### Phase 4: Workshop Engine ✅
- `workshopSlice` state machine
- Phases: LOBBY → AGENDA → BRAINSTORM → VOTING → SUMMARY
- framer-motion stage transitions
- AgendaTimeline, ParticipantList, WorkshopTimer
- Stage components (Lobby, Brainstorm, Voting, Summary)

### Phase 5: Intelligence (AI Assistant) 🔲
- Assistant drawer (slide-over panel)
- `useActiveContext` hook
- Streaming text responses

### Phase 6: The Gatekeeper (Terminal Auth) ✅
- CLI-style login/register
- Step-by-step authentication
- System logs with animations
- Blinking cursor effect

### Phase 7: The Dossier (User Profile) ✅
- Identity card with avatar + status
- Stats grid (Decisions, Documents, Velocity)
- Status selector (ONLINE, FOCUS, AWAY)
- Keyboard shortcuts map
- API token management
- Preference toggles

### Phase 8: Bento Dashboard ✅
- High-density command center
- 5 Bento cards:
  - The Pulse (Activity Feed)
  - Review Queue (Decisions)
  - Live Sessions (Workshops)
  - Jump Back In (Documents)
  - Messages (Chat)
- Quick stats bar

---

## 🔗 BRIDGE FEATURES

### Slack → Notion
Message hover → "Convert to Doc" → AI summarize → Tiptap draft

### Notion → GitHub
Select text → "Propose Decision" → Creates decision record

### GitHub → Twitter
Decision approved → Auto-post to Activity Feed

---

## 🏗️ ARCHITECTURE

```
src/
├── app/layouts/
│   ├── DashboardLayout.tsx     # CSS Grid shell
│   ├── AuthLayout.tsx          # Login/Register wrapper
│   ├── Sidebar.tsx             # Collapsible nav
│   └── CommandPalette.tsx      # Cmd+K
│
├── features/
│   ├── auth/
│   │   ├── LoginPage.tsx       # Terminal CLI login
│   │   └── RegisterPage.tsx    # Terminal CLI register
│   ├── dashboard/
│   │   └── DashboardPage.tsx   # Bento Grid
│   ├── chat/
│   │   ├── model/useChatSocket.ts
│   │   └── ui/ChatWindow.tsx
│   ├── channels/
│   │   ├── ChannelsPage.tsx
│   │   └── ChannelChatWindow.tsx
│   ├── feed/
│   │   └── ui/ActivityFeed.tsx
│   ├── workshop/
│   │   ├── ui/WorkshopLiveSession.tsx
│   │   └── ui/stages/*.tsx
│   ├── documents/
│   │   └── DocumentsPage.tsx
│   └── user/
│       └── ui/UserProfile.tsx  # The Dossier
│
├── shared/
│   ├── api/apiSlice.ts         # RTK Query
│   ├── lib/utils.ts            # cn(), helpers
│   └── ui/*.tsx                # Primitives
│
└── store/
    └── slices/
        ├── authSlice.ts
        ├── workshopSlice.ts    # State machine
        └── ...
```

---

## 🎨 DESIGN TOKENS

| Token | Value |
|-------|-------|
| Background | `#09090b` (Zinc-950) |
| Surface | `#18181b` (Zinc-900) |
| Border | `#3f3f46` (Zinc-700) |
| Text Primary | `#d4d4d8` (Zinc-300) |
| Accent | `#7c9eff` (Custom Blue) |
| Success | `#10b981` (Emerald-500) |
| Warning | `#f59e0b` (Amber-500) |
| Error | `#ef4444` (Red-500) |
| Font Sans | Inter |
| Font Mono | JetBrains Mono |
| Base Size | 13px |

---

## ⚡ TECH STACK

| Layer | Technology |
|-------|------------|
| Framework | React 19 + Vite |
| State | Redux Toolkit + RTK Query |
| Routing | React Router v6 |
| Styling | Tailwind CSS + clsx |
| UI | Radix UI + Lucide React |
| Real-time | Socket.IO Client |
| Animations | Framer Motion |
| Editor | Tiptap (planned) |
| Lists | React Virtuoso |

---

## 🚀 GETTING STARTED

```bash
cd packages/web
npm install
npm run dev
# → http://localhost:5173
```

---

## ✅ STATUS TRACKER

| Phase | Name | Status |
|-------|------|--------|
| 0 | Terminal Shell | ✅ |
| 1 | RTK Query + Socket | ✅ |
| 2 | Chat (Virtuoso) | ✅ |
| 3 | Tiptap Editor | 🔲 |
| 4 | Workshop Engine | ✅ |
| 5 | AI Assistant | 🔲 |
| 6 | Terminal Auth | ✅ |
| 7 | User Dossier | ✅ |
| 8 | Bento Dashboard | ✅ |

---

*SENTRY Collaborative OS - Built with the "2026 Developer Terminal" philosophy.*
