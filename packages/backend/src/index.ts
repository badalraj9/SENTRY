/**
 * SENTRY Backend - Server Entry Point
 */

// Load environment variables FIRST
import 'dotenv/config';

import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import { app } from './app.js';
import { config } from './config/index.js';
import { pool, closePool } from './db/pool.js';
import { isRedisAvailable, closeRedis } from './db/redis.js';
import { initializeWebSocket } from './websocket/index.js';

// Create HTTP server
const server = createServer(app);

// Initialize Socket.io
const io = new SocketServer(server, {
  cors: {
    origin: config.cors.origin,
    credentials: true,
  },
});

// Initialize WebSocket handlers
initializeWebSocket(io);

// =============================================================================
// STARTUP
// =============================================================================

async function start(): Promise<void> {
  console.log('🚀 Starting SENTRY Backend...');
  console.log(`   Environment: ${config.nodeEnv}`);

  // Test database connection
  try {
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    console.log('✅ PostgreSQL connected');
  } catch (error) {
    console.error('❌ PostgreSQL connection failed:', error);
    process.exit(1);
  }

  // Check Redis (optional)
  if (isRedisAvailable()) {
    console.log('✅ Redis connected');
  } else {
    console.log('⚠️  Redis unavailable - caching disabled (OK for dev)');
  }

  // Start server
  server.listen(config.port, () => {
    console.log(`✅ Server running on port ${config.port}`);
    console.log(`   API: http://localhost:${config.port}`);
    console.log(`   WebSocket: ws://localhost:${config.port}`);
    console.log('');
    console.log('🧠 Neural Hub initialized');
    console.log('📡 WebSocket ready');
    console.log('');
  });
}

// =============================================================================
// GRACEFUL SHUTDOWN
// =============================================================================

async function shutdown(signal: string): Promise<void> {
  console.log(`\n⏳ Received ${signal}, shutting down gracefully...`);

  // Close HTTP server
  server.close(() => {
    console.log('✅ HTTP server closed');
  });

  // Close database connections
  await closePool();
  await closeRedis();

  console.log('👋 Goodbye!');
  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('❌ Unhandled Rejection:', reason);
  process.exit(1);
});

// Start the server
start();
