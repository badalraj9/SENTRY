/**
 * WebSocket Event Handlers
 *
 * Works with or without Redis for development flexibility.
 */

import type { Server as SocketServer, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { config } from "../config/index.js";
import { isRedisAvailable, subscribe, publish } from "../db/redis.js";
import * as chatService from "../services/chat.service.js";
import type { JWTPayload, WSEventType } from "@sentry/shared";

// Store active connections
const userConnections = new Map<string, Set<string>>(); // userId -> Set of socket IDs

// Store io instance for direct emission when Redis unavailable
let ioInstance: SocketServer | null = null;

/**
 * Initialize WebSocket handlers
 */
export function initializeWebSocket(io: SocketServer): void {
  ioInstance = io;

  // Authentication middleware for WebSocket
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error("Authentication required"));
    }

    try {
      const payload = jwt.verify(token, config.jwt.secret) as JWTPayload;
      socket.data.user = payload;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  // Connection handler
  io.on("connection", (socket) => {
    const userId = socket.data.user.userId;
    console.log(`🔌 User connected: ${userId}`);

    // Track connection
    if (!userConnections.has(userId)) {
      userConnections.set(userId, new Set());
    }
    userConnections.get(userId)!.add(socket.id);

    // Auto-join user's personal room
    socket.join(`user:${userId}`);

    // Handle subscription to channels
    socket.on("subscribe", async (channels: string[]) => {
      for (const channel of channels) {
        // Validate channel access — only allow if user is a participant
        if (channel.startsWith("chat:")) {
          const chatId = channel.replace("chat:", "");
          try {
            const participants = await chatService.getChatParticipants(chatId);
            if (
              participants.some((p: { userId: string }) => p.userId === userId)
            ) {
              socket.join(channel);
            } else {
              socket.emit("error", {
                message: `Access denied to channel: ${channel}`,
              });
            }
          } catch {
            socket.emit("error", {
              message: `Failed to validate access for: ${channel}`,
            });
          }
        } else if (
          channel.startsWith("user:") &&
          channel === `user:${userId}`
        ) {
          // Users can only subscribe to their own user channel
          socket.join(channel);
        } else if (channel.startsWith("project:")) {
          // For project channels, allow for now (project membership check can be added later)
          socket.join(channel);
        }
      }
    });

    // Handle unsubscription
    socket.on("unsubscribe", (channels: string[]) => {
      for (const channel of channels) {
        socket.leave(channel);
      }
    });

    // Handle typing indicator
    socket.on("typing.start", (chatId: string) => {
      socket.to(`chat:${chatId}`).emit("user.typing", {
        chatId,
        userId,
        handle: socket.data.user.handle,
      });
    });

    // Handle disconnection
    socket.on("disconnect", () => {
      console.log(`🔌 User disconnected: ${userId}`);
      userConnections.get(userId)?.delete(socket.id);
      if (userConnections.get(userId)?.size === 0) {
        userConnections.delete(userId);
      }
    });
  });

  // Subscribe to Redis pub/sub for cross-instance messaging (if Redis available)
  setupRedisPubSub(io);
}

/**
 * Setup Redis pub/sub for horizontal scaling (gracefully skips if Redis unavailable)
 */
async function setupRedisPubSub(io: SocketServer): Promise<void> {
  if (!isRedisAvailable()) {
    console.log("⚠️  Redis unavailable - WebSocket events are local only");
    return;
  }

  try {
    await subscribe("sentry:events", (event: unknown) => {
      if (typeof event === "object" && event !== null) {
        const e = event as {
          type: WSEventType;
          room: string;
          payload: unknown;
        };
        broadcastEvent(io, e);
      }
    });
    console.log("📡 Subscribed to Redis pub/sub channel");
  } catch (error) {
    console.log(
      "⚠️  Redis pub/sub setup failed - WebSocket events are local only",
    );
  }
}

/**
 * Broadcast event to appropriate rooms
 */
function broadcastEvent(
  io: SocketServer,
  event: { type: WSEventType; room: string; payload: unknown },
): void {
  io.to(event.room).emit(event.type, event.payload);
}

/**
 * Emit event to a specific room (via Redis if available, else direct)
 */
export async function emitToRoom(
  room: string,
  type: WSEventType,
  payload: unknown,
): Promise<void> {
  if (isRedisAvailable()) {
    await publish("sentry:events", { type, room, payload });
  } else if (ioInstance) {
    // Direct emit when Redis not available
    ioInstance.to(room).emit(type, payload);
  }
}

/**
 * Emit event to a specific user (all their connections)
 */
export async function emitToUser(
  userId: string,
  type: WSEventType,
  payload: unknown,
): Promise<void> {
  await emitToRoom(`user:${userId}`, type, payload);
}

/**
 * Emit event to a chat room
 */
export async function emitToChat(
  chatId: string,
  type: WSEventType,
  payload: unknown,
): Promise<void> {
  await emitToRoom(`chat:${chatId}`, type, payload);
}

/**
 * Get online status for a user
 */
export function isUserOnline(userId: string): boolean {
  return userConnections.has(userId) && userConnections.get(userId)!.size > 0;
}

/**
 * Get count of online users
 */
export function getOnlineUserCount(): number {
  return userConnections.size;
}
