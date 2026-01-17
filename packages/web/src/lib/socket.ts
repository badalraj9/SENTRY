import { io, type Socket } from 'socket.io-client';
import { store } from '../store';
import { addMessage } from '../store/slices/chatsSlice';
import { addProposal } from '../store/slices/decisionsSlice';

const SOCKET_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3000';

let socket: Socket | null = null;

export function connectSocket(token: string): Socket {
  if (socket?.connected) {
    return socket;
  }

  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket'],
  });

  socket.on('connect', () => {
    console.log('🔌 WebSocket connected');
  });

  socket.on('disconnect', () => {
    console.log('🔌 WebSocket disconnected');
  });

  // Handle real-time events
  socket.on('message.new', (message) => {
    store.dispatch(addMessage(message));
  });

  socket.on('proposal.new', (proposal) => {
    store.dispatch(addProposal(proposal));
  });

  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function subscribeToChat(chatId: string): void {
  socket?.emit('subscribe', [`chat:${chatId}`]);
}

export function unsubscribeFromChat(chatId: string): void {
  socket?.emit('unsubscribe', [`chat:${chatId}`]);
}

export function sendTypingIndicator(chatId: string): void {
  socket?.emit('typing.start', chatId);
}

export { socket };
