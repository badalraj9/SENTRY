import { useEffect } from 'react';
import { socket } from '../../../lib/socket';
import { apiSlice } from '../../../shared/api/apiSlice';
import { useAppDispatch } from '../../../store/hooks';

/* ═══════════════════════════════════════════════════════════════════════════
   useChatSocket Hook
   Manages WebSocket subscription and injects real-time messages into RTK cache
   ═══════════════════════════════════════════════════════════════════════════ */

interface IncomingMessage {
  id: string;
  chatId: string;
  userId: string;
  content: string;
  createdAt: string;
}

export function useChatSocket(chatId: string | undefined) {
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (!chatId || !socket) return;

    // 1. Join the chat room
    socket.emit('subscribe', [`chat:${chatId}`]);

    // 2. Listen for incoming messages
    const handleMessage = (newMessage: IncomingMessage) => {
      // Only update if the message belongs to this chat
      if (newMessage.chatId === chatId) {
        // Direct injection into RTK Query cache (no refetch!)
        dispatch(
          apiSlice.util.updateQueryData('getMessages', chatId, (draft) => {
            // Deduplication check
            const exists = draft.find((m) => m.id === newMessage.id);
            if (!exists) {
              draft.push({
                ...newMessage,
                status: 'sent',
              });
            }
          })
        );
      }
    };

    // 3. Listen for typing indicators
    const handleTyping = (data: { chatId: string; userId: string; handle: string }) => {
      // Could dispatch to a typing slice if needed
      console.log(`${data.handle} is typing in ${data.chatId}...`);
    };

    socket.on('message.created', handleMessage);
    socket.on('message.new', handleMessage); // Support both event names
    socket.on('user.typing', handleTyping);

    // Cleanup
    return () => {
      if (socket) {
        socket.emit('unsubscribe', [`chat:${chatId}`]);
        socket.off('message.created', handleMessage);
        socket.off('message.new', handleMessage);
        socket.off('user.typing', handleTyping);
      }
    };
  }, [chatId, dispatch]);
}
