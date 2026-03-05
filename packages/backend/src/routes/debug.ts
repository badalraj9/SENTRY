/**
 * Debug/Explainability Routes
 * Exposes Neural Hub reasoning for debugging and transparency
 */

import { Router } from "express";
import { z } from "zod";
import { authMiddleware } from "../middleware/auth.js";
import {
  validateBody,
  validateParams,
  uuidSchema,
} from "../middleware/validation.js";
import { neuralHub, ProcessingContext } from "../intelligence/neural-hub.js";
import { learningEngine } from "../intelligence/learning.js";
import * as neuralStateService from "../services/neural-state.service.js";
import * as chatService from "../services/chat.service.js";
import * as projectService from "../services/project.service.js";
import * as intentService from "../services/intent.service.js";
import {
  DECISION_PATTERNS,
  STRUCTURAL_WEIGHTS,
  CHAT_TYPE_WEIGHTS,
} from "@sentry/shared";

export const debugRouter = Router();

debugRouter.use(authMiddleware);

// =============================================================================
// SCHEMAS
// =============================================================================

const analyzeSchema = z.object({
  content: z.string().min(1).max(10000),
  chatId: uuidSchema.optional(),
  projectId: uuidSchema.optional(),
});

// =============================================================================
// ROUTES
// =============================================================================

/**
 * POST /debug/analyze
 * Analyze a message through the Neural Hub without creating a proposal
 * Returns full reasoning trace for debugging
 */
debugRouter.post("/analyze", validateBody(analyzeSchema), async (req, res) => {
  try {
    const { content, chatId, projectId } = req.body;
    const userId = req.user!.userId;

    // Build processing context
    const ctx = await buildDebugContext(chatId);

    // Get neural state
    const pId = projectId || "debug-project";
    const state = await neuralStateService.getOrCreateNeuralState(userId, pId);

    // Process through Neural Hub
    const result = neuralHub.process({ content }, ctx, state);

    // Get state summary
    const stateSummary = neuralHub.describeSt(state);

    res.json({
      message: { content: content.slice(0, 200) },
      result: {
        confidence: result.confidence,
        shouldPropose: result.shouldPropose,
        aggregatedScore: result.aggregatedScore,
        uncertaintyLevel: result.uncertaintyLevel,
      },
      reasoning: result.reasoning,
      state: stateSummary,
    });
  } catch (error) {
    console.error("Debug analyze error:", error);
    res.status(500).json({ error: "Analysis failed" });
  }
});

/**
 * GET /debug/state/:projectId
 * Get current neural state for debugging
 */
debugRouter.get(
  "/state/:projectId",
  validateParams(z.object({ projectId: uuidSchema })),
  async (req, res) => {
    const state = await neuralStateService.getNeuralState(
      req.user!.userId,
      req.params.projectId,
    );

    if (!state) {
      return res.json({
        exists: false,
        message: "No neural state exists for this user/project combination",
      });
    }

    const summary = neuralHub.describeSt(state);
    const acceptanceRate = learningEngine.getAcceptanceRate(state);
    const uncertainty = learningEngine.getUncertainty(state);
    const adaptiveThreshold = learningEngine.getAdaptiveThreshold(state);

    res.json({
      exists: true,
      state: {
        threshold: state.threshold,
        alpha: state.alpha,
        beta: state.beta,
        customWeights: Object.keys(state.weights).length,
        updatedAt: state.updatedAt,
      },
      computed: {
        acceptanceRate,
        uncertainty,
        adaptiveThreshold,
        ...summary,
      },
      weights: state.weights,
    });
  },
);

/**
 * GET /debug/patterns
 * List all decision patterns and their weights
 */
debugRouter.get("/patterns", (req, res) => {
  res.json({
    linguistic: DECISION_PATTERNS.map(
      (p: { name: string; baseWeight: number; pattern: RegExp }) => ({
        name: p.name,
        baseWeight: p.baseWeight,
        pattern: p.pattern.toString(),
      }),
    ),
    structural: STRUCTURAL_WEIGHTS,
    chatType: CHAT_TYPE_WEIGHTS,
  });
});

/**
 * POST /debug/simulate-learning
 * Simulate what would happen if a proposal was confirmed/rejected
 */
debugRouter.post(
  "/simulate-learning",
  validateBody(
    z.object({
      projectId: uuidSchema,
      outcome: z.enum(["confirmed", "rejected"]),
      signals: z.array(
        z.object({
          name: z.string(),
          type: z.string(),
          value: z.number(),
          baseWeight: z.number(),
        }),
      ),
    }),
  ),
  async (req, res) => {
    const { projectId, outcome, signals } = req.body;
    const userId = req.user!.userId;

    const currentState = await neuralStateService.getOrCreateNeuralState(
      userId,
      projectId,
    );
    const simulatedState = learningEngine.learn(currentState, signals, outcome);
    const report = learningEngine.generateLearningReport(
      currentState,
      simulatedState,
      signals,
      outcome,
    );

    res.json({
      simulation: true,
      notApplied: "This is a simulation - no changes were saved",
      report,
      stateBefore: {
        threshold: currentState.threshold,
        acceptanceRate: learningEngine.getAcceptanceRate(currentState),
      },
      stateAfter: {
        threshold: simulatedState.threshold,
        acceptanceRate: learningEngine.getAcceptanceRate(simulatedState),
      },
    });
  },
);

// =============================================================================
// HELPERS
// =============================================================================

async function buildDebugContext(chatId?: string): Promise<ProcessingContext> {
  const now = new Date();

  if (!chatId) {
    // Default debug context
    return {
      chatType: "group_collab",
      isAuthorMaintainer: false,
      participantCount: 3,
      threadDepth: 0,
      reactionCount: 0,
      replyCount: 0,
      recentMsgRate: 1,
      avgMsgRate: 1,
      activeIntent: null,
      messageTimestamp: now,
      discussionStartTime: null,
    };
  }

  // Build real context from chat
  const chat = await chatService.getChatById(chatId);
  const activeIntent = await intentService.getActiveIntent(chatId);

  return {
    chatType: chat?.type || "group_collab",
    isAuthorMaintainer: false,
    participantCount: await chatService.getParticipantCount(chatId),
    threadDepth: 0,
    reactionCount: 0,
    replyCount: 0,
    recentMsgRate: 1,
    avgMsgRate: 1,
    activeIntent,
    messageTimestamp: now,
    discussionStartTime: null,
  };
}
