import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface UiState {
  sidebarOpen: boolean;
  commandPaletteOpen: boolean;
  theme: 'dark' | 'light';
  activeModal: string | null;
}

const initialState: UiState = {
  sidebarOpen: true,
  commandPaletteOpen: false,
  theme: 'dark',
  activeModal: null,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    toggleCommandPalette: (state) => {
      state.commandPaletteOpen = !state.commandPaletteOpen;
    },
    setCommandPaletteOpen: (state, action: PayloadAction<boolean>) => {
      state.commandPaletteOpen = action.payload;
    },
    openModal: (state, action: PayloadAction<string>) => {
      state.activeModal = action.payload;
    },
    closeModal: (state) => {
      state.activeModal = null;
    },
  },
});

export const { 
  toggleSidebar, 
  setSidebarOpen, 
  toggleCommandPalette, 
  setCommandPaletteOpen,
  openModal,
  closeModal,
} = uiSlice.actions;

export default uiSlice.reducer;
