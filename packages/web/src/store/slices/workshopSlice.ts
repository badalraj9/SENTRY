import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

/* ═══════════════════════════════════════════════════════════════════════════
   Workshop State Machine
   Controls synchronized live session phases across all participants
   ═══════════════════════════════════════════════════════════════════════════ */

export type WorkshopPhase = 'LOBBY' | 'AGENDA' | 'BRAINSTORM' | 'VOTING' | 'SUMMARY';

export interface Participant {
  userId: string;
  handle: string;
  role: 'facilitator' | 'presenter' | 'participant' | 'observer';
  joinedAt: string;
}

export interface AgendaItem {
  id: string;
  title: string;
  description?: string;
  durationMinutes: number;
  status: 'pending' | 'in_progress' | 'completed' | 'skipped';
}

export interface Idea {
  id: string;
  text: string;
  userId: string;
  votes: string[]; // User IDs who voted
  createdAt: string;
}

export interface WorkshopState {
  // Session info
  workshopId: string | null;
  title: string;
  objective: string;
  
  // State machine
  activePhase: WorkshopPhase;
  activeTopicId: string | null;
  
  // Participants
  participants: Participant[];
  facilitatorId: string | null;
  
  // Timer
  timer: number | null; // Remaining seconds
  timerActive: boolean;
  
  // Agenda
  agendaItems: AgendaItem[];
  
  // Brainstorm
  ideas: Idea[];
  
  // Loading states
  loading: boolean;
  error: string | null;
}

const initialState: WorkshopState = {
  workshopId: null,
  title: '',
  objective: '',
  activePhase: 'LOBBY',
  activeTopicId: null,
  participants: [],
  facilitatorId: null,
  timer: null,
  timerActive: false,
  agendaItems: [],
  ideas: [],
  loading: false,
  error: null,
};

const workshopSlice = createSlice({
  name: 'workshop',
  initialState,
  reducers: {
    // ═══════════════════════════════════════════════════════════════════════
    // SYNC: Dispatched when Socket event 'workshop.updated' fires
    // ═══════════════════════════════════════════════════════════════════════
    syncState: (state, action: PayloadAction<Partial<WorkshopState>>) => {
      return { ...state, ...action.payload };
    },

    // ═══════════════════════════════════════════════════════════════════════
    // WORKSHOP LIFECYCLE
    // ═══════════════════════════════════════════════════════════════════════
    setWorkshop: (state, action: PayloadAction<{
      workshopId: string;
      title: string;
      objective: string;
      facilitatorId: string;
      agendaItems: AgendaItem[];
    }>) => {
      state.workshopId = action.payload.workshopId;
      state.title = action.payload.title;
      state.objective = action.payload.objective;
      state.facilitatorId = action.payload.facilitatorId;
      state.agendaItems = action.payload.agendaItems;
    },

    setPhase: (state, action: PayloadAction<WorkshopPhase>) => {
      state.activePhase = action.payload;
    },

    setActiveTopic: (state, action: PayloadAction<string | null>) => {
      state.activeTopicId = action.payload;
    },

    // ═══════════════════════════════════════════════════════════════════════
    // PARTICIPANTS
    // ═══════════════════════════════════════════════════════════════════════
    addParticipant: (state, action: PayloadAction<Participant>) => {
      const exists = state.participants.find(p => p.userId === action.payload.userId);
      if (!exists) {
        state.participants.push(action.payload);
      }
    },

    removeParticipant: (state, action: PayloadAction<string>) => {
      state.participants = state.participants.filter(p => p.userId !== action.payload);
    },

    // ═══════════════════════════════════════════════════════════════════════
    // TIMER
    // ═══════════════════════════════════════════════════════════════════════
    setTimer: (state, action: PayloadAction<number | null>) => {
      state.timer = action.payload;
    },

    updateTimer: (state, action: PayloadAction<number>) => {
      state.timer = action.payload;
    },

    startTimer: (state) => {
      state.timerActive = true;
    },

    stopTimer: (state) => {
      state.timerActive = false;
    },

    // ═══════════════════════════════════════════════════════════════════════
    // AGENDA
    // ═══════════════════════════════════════════════════════════════════════
    updateAgendaItem: (state, action: PayloadAction<{ id: string; status: AgendaItem['status'] }>) => {
      const item = state.agendaItems.find(a => a.id === action.payload.id);
      if (item) {
        item.status = action.payload.status;
      }
    },

    // ═══════════════════════════════════════════════════════════════════════
    // BRAINSTORM IDEAS
    // ═══════════════════════════════════════════════════════════════════════
    addIdea: (state, action: PayloadAction<Idea>) => {
      const exists = state.ideas.find(i => i.id === action.payload.id);
      if (!exists) {
        state.ideas.push(action.payload);
      }
    },

    updateIdea: (state, action: PayloadAction<{ id: string; text: string }>) => {
      const idea = state.ideas.find(i => i.id === action.payload.id);
      if (idea) {
        idea.text = action.payload.text;
      }
    },

    voteIdea: (state, action: PayloadAction<{ ideaId: string; userId: string }>) => {
      const idea = state.ideas.find(i => i.id === action.payload.ideaId);
      if (idea) {
        const voted = idea.votes.includes(action.payload.userId);
        if (voted) {
          idea.votes = idea.votes.filter(v => v !== action.payload.userId);
        } else {
          idea.votes.push(action.payload.userId);
        }
      }
    },

    removeIdea: (state, action: PayloadAction<string>) => {
      state.ideas = state.ideas.filter(i => i.id !== action.payload);
    },

    // ═══════════════════════════════════════════════════════════════════════
    // LOADING / ERROR
    // ═══════════════════════════════════════════════════════════════════════
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },

    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    // ═══════════════════════════════════════════════════════════════════════
    // RESET
    // ═══════════════════════════════════════════════════════════════════════
    resetWorkshop: () => initialState,
  },
});

export const {
  syncState,
  setWorkshop,
  setPhase,
  setActiveTopic,
  addParticipant,
  removeParticipant,
  setTimer,
  updateTimer,
  startTimer,
  stopTimer,
  updateAgendaItem,
  addIdea,
  updateIdea,
  voteIdea,
  removeIdea,
  setLoading,
  setError,
  resetWorkshop,
} = workshopSlice.actions;

export default workshopSlice.reducer;
