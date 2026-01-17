import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { api } from '../../lib/api';

interface Decision {
  id: string;
  projectId: string;
  statement: string;
  rationale: string;
  status: 'active' | 'superseded' | 'deprecated';
  confidence: number;
  createdBy: string;
  createdAt: string;
}

interface Proposal {
  id: string;
  projectId: string;
  statement: string;
  status: 'pending' | 'approved' | 'rejected';
  confidence: number;
  createdAt: string;
}

interface DecisionsState {
  decisions: Decision[];
  proposals: Proposal[];
  currentDecision: Decision | null;
  isLoading: boolean;
  filter: {
    status: string | null;
    search: string;
  };
}

const initialState: DecisionsState = {
  decisions: [],
  proposals: [],
  currentDecision: null,
  isLoading: false,
  filter: {
    status: null,
    search: '',
  },
};

export const fetchDecisions = createAsyncThunk(
  'decisions/fetchAll',
  async (projectId: string) => {
    const response = await api.get(`/decisions?projectId=${projectId}`);
    return response.data;
  }
);

export const fetchProposals = createAsyncThunk(
  'decisions/fetchProposals',
  async (projectId: string) => {
    const response = await api.get(`/decisions/proposals?projectId=${projectId}`);
    return response.data;
  }
);

export const approveProposal = createAsyncThunk(
  'decisions/approve',
  async (proposalId: string) => {
    const response = await api.post(`/decisions/proposals/${proposalId}/approve`);
    return response.data;
  }
);

export const rejectProposal = createAsyncThunk(
  'decisions/reject',
  async (proposalId: string) => {
    const response = await api.post(`/decisions/proposals/${proposalId}/reject`);
    return response.data;
  }
);

const decisionsSlice = createSlice({
  name: 'decisions',
  initialState,
  reducers: {
    setCurrentDecision: (state, action: PayloadAction<Decision | null>) => {
      state.currentDecision = action.payload;
    },
    setFilter: (state, action: PayloadAction<Partial<DecisionsState['filter']>>) => {
      state.filter = { ...state.filter, ...action.payload };
    },
    addProposal: (state, action: PayloadAction<Proposal>) => {
      state.proposals.unshift(action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDecisions.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchDecisions.fulfilled, (state, action) => {
        state.isLoading = false;
        state.decisions = action.payload;
      })
      .addCase(fetchProposals.fulfilled, (state, action) => {
        state.proposals = action.payload;
      })
      .addCase(approveProposal.fulfilled, (state, action) => {
        state.proposals = state.proposals.filter(p => p.id !== action.meta.arg);
        state.decisions.unshift(action.payload);
      })
      .addCase(rejectProposal.fulfilled, (state, action) => {
        state.proposals = state.proposals.filter(p => p.id !== action.meta.arg);
      });
  },
});

export const { setCurrentDecision, setFilter, addProposal } = decisionsSlice.actions;
export default decisionsSlice.reducer;
