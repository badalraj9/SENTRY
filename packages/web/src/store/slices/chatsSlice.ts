import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { api } from '../../lib/api';

interface Message {
  id: string;
  chatId: string;
  content: string;
  authorId: string;
  authorHandle: string;
  createdAt: string;
}

interface Chat {
  id: string;
  type: 'direct' | 'group_collab' | 'community' | 'workshop';
  name: string;
  projectId: string;
  unreadCount: number;
}

interface ChatsState {
  chats: Chat[];
  currentChatId: string | null;
  messages: Record<string, Message[]>;
  isLoading: boolean;
}

const initialState: ChatsState = {
  chats: [],
  currentChatId: null,
  messages: {},
  isLoading: false,
};

export const fetchChats = createAsyncThunk(
  'chats/fetchAll',
  async (projectId: string) => {
    const response = await api.get(`/chats?projectId=${projectId}`);
    return response.data;
  }
);

export const fetchMessages = createAsyncThunk(
  'chats/fetchMessages',
  async (chatId: string) => {
    const response = await api.get(`/chats/${chatId}/messages`);
    return { chatId, messages: response.data };
  }
);

export const sendMessage = createAsyncThunk(
  'chats/sendMessage',
  async ({ chatId, content }: { chatId: string; content: string }) => {
    const response = await api.post(`/chats/${chatId}/messages`, { content });
    return response.data;
  }
);

const chatsSlice = createSlice({
  name: 'chats',
  initialState,
  reducers: {
    setCurrentChat: (state, action: PayloadAction<string | null>) => {
      state.currentChatId = action.payload;
    },
    addMessage: (state, action: PayloadAction<Message>) => {
      const msg = action.payload;
      if (!state.messages[msg.chatId]) {
        state.messages[msg.chatId] = [];
      }
      state.messages[msg.chatId].push(msg);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchChats.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchChats.fulfilled, (state, action) => {
        state.isLoading = false;
        state.chats = action.payload;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.messages[action.payload.chatId] = action.payload.messages;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        const msg = action.payload;
        if (!state.messages[msg.chatId]) {
          state.messages[msg.chatId] = [];
        }
        state.messages[msg.chatId].push(msg);
      });
  },
});

export const { setCurrentChat, addMessage } = chatsSlice.actions;
export default chatsSlice.reducer;
