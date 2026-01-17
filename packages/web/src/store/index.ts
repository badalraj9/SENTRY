import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import uiReducer from './slices/uiSlice';
import projectsReducer from './slices/projectsSlice';
import chatsReducer from './slices/chatsSlice';
import decisionsReducer from './slices/decisionsSlice';
import workshopReducer from './slices/workshopSlice';
import { apiSlice } from '../shared/api/apiSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    projects: projectsReducer,
    chats: chatsReducer,
    decisions: decisionsReducer,
    workshop: workshopReducer,
    [apiSlice.reducerPath]: apiSlice.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['socket/connected'],
      },
    }).concat(apiSlice.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
