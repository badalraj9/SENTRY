import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import type { RootState } from "../../store";

/* ═══════════════════════════════════════════════════════════════════════════
   RTK Query API Slice
   Central API definition with cache management
   ═══════════════════════════════════════════════════════════════════════════ */

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3000/api";

// Types
interface Message {
  id: string;
  chatId: string;
  userId: string;
  content: string;
  replyTo?: string;
  createdAt: string;
  editedAt?: string;
  status?: "sending" | "sent" | "error";
}

interface Chat {
  id: string;
  type: "direct" | "group_collab" | "community" | "workshop";
  projectId?: string;
  name?: string;
  visibility: "private" | "invite_only" | "public";
  createdAt: string;
}

interface SendMessagePayload {
  chatId: string;
  content: string;
  tempId: string;
  replyTo?: string;
}

interface Project {
  id: string;
  name: string;
  description?: string;
  visibility: "public" | "private" | "invite_only";
  ownerId: string;
  createdAt: string;
}

interface Decision {
  id: string;
  projectId: string;
  statement: string;
  rationale?: string;
  confidence: number;
  createdAt: string;
  deprecated: boolean;
  votes?: string[];
  status?: string;
}

interface Document {
  id: string;
  title: string;
  description?: string;
  projectId: string;
  docType: string;
  status: string;
  updatedAt: string;
}

interface Workshop {
  id: string;
  title: string;
  objective: string;
  projectId: string;
  status: "scheduled" | "active" | "completed" | "cancelled";
  scheduledStart?: string;
  scheduledEnd?: string;
  activePhase?: string;
}

interface AssistantResponse {
  mode: "analyst" | "advisor" | "facilitator";
  answer: string;
  sources: Array<{
    type: string;
    id: string;
    statement: string;
    relevance: number;
  }>;
  suggestions?: string[];
}

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: API_BASE_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["Chat", "Message", "Decision", "Doc", "Project", "Workshop"],

  endpoints: (builder) => ({
    // ═══════════════════════════════════════════════════════════════════════
    // CHAT ENDPOINTS
    // ═══════════════════════════════════════════════════════════════════════

    searchUsers: builder.query<
      {
        id: string;
        handle: string;
        displayName?: string;
        bio?: string;
        visibility: string;
        lastActive: string;
      }[],
      string
    >({
      query: (q) => `/users/search?q=${encodeURIComponent(q)}`,
    }),

    getChats: builder.query<Chat[], void>({
      query: () => "/chats",
      providesTags: ["Chat"],
    }),

    getChat: builder.query<Chat, string>({
      query: (chatId) => `/chats/${chatId}`,
      providesTags: (_result, _error, chatId) => [{ type: "Chat", id: chatId }],
    }),

    getMessages: builder.query<Message[], string>({
      query: (chatId) => `/chats/${chatId}/messages`,
      providesTags: (_result, _error, chatId) => [
        { type: "Message", id: chatId },
      ],
    }),

    sendMessage: builder.mutation<Message, SendMessagePayload>({
      query: ({ chatId, content, replyTo }) => ({
        url: `/chats/${chatId}/messages`,
        method: "POST",
        body: { content, replyTo },
      }),

      async onQueryStarted(
        { chatId, content, tempId },
        { dispatch, queryFulfilled, getState },
      ) {
        const state = getState() as RootState;
        const userId = state.auth.user?.id || "unknown";

        const patchResult = dispatch(
          apiSlice.util.updateQueryData(
            "getMessages",
            chatId,
            (draft: Message[]) => {
              draft.push({
                id: tempId,
                chatId,
                content,
                userId,
                createdAt: new Date().toISOString(),
                status: "sending",
              });
            },
          ),
        );

        try {
          const { data: savedMessage } = await queryFulfilled;

          dispatch(
            apiSlice.util.updateQueryData(
              "getMessages",
              chatId,
              (draft: Message[]) => {
                const index = draft.findIndex((m) => m.id === tempId);
                if (index !== -1) {
                  draft[index] = { ...savedMessage, status: "sent" };
                }
              },
            ),
          );
        } catch {
          patchResult.undo();
          dispatch(
            apiSlice.util.updateQueryData(
              "getMessages",
              chatId,
              (draft: Message[]) => {
                const index = draft.findIndex((m) => m.id === tempId);
                if (index !== -1) {
                  draft[index].status = "error";
                }
              },
            ),
          );
        }
      },
    }),

    getChatMembers: builder.query<{ userId: string; joinedAt: string }[], string>({
      query: (chatId) => `/chats/${chatId}/members`,
    }),

    addChatMember: builder.mutation<{ userId: string; joinedAt: string }, { chatId: string; userId: string }>({
      query: ({ chatId, userId }) => ({
        url: `/chats/${chatId}/members`,
        method: "POST",
        body: { userId },
      }),
      invalidatesTags: (_result, _error, { chatId }) => [{ type: "Chat", id: chatId }],
    }),

    getThreadMessages: builder.query<Message[], string>({
      query: (messageId) => `/chats/:id/messages/${messageId}/thread`,
    }),

    searchUsers: builder.query<User[], string>({
      query: (q) => `/users/search?q=${encodeURIComponent(q)}`,
    }),

    getUser: builder.query<User, string>({
      query: (userId) => `/users/${userId}`,
      providesTags: (_result, _error, userId) => [{ type: "User", id: userId }],
    }),

    createChat: builder.mutation<
      Chat,
      { type: Chat["type"]; projectId?: string; name?: string }
    >({
      query: (body) => ({
        url: "/chats",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Chat"],
    }),

    // ═══════════════════════════════════════════════════════════════════════
    // PROJECT ENDPOINTS
    // ═══════════════════════════════════════════════════════════════════════

    getProjects: builder.query<Project[], void>({
      query: () => "/projects",
      providesTags: ["Project"],
    }),

    getProject: builder.query<Project, string>({
      query: (projectId) => `/projects/${projectId}`,
      providesTags: (_result, _error, projectId) => [
        { type: "Project", id: projectId },
      ],
    }),

    createProject: builder.mutation<
      Project,
      { name: string; description?: string; visibility?: string }
    >({
      query: (body) => ({
        url: "/projects",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Project"],
    }),

    // ═══════════════════════════════════════════════════════════════════════
    // DECISION ENDPOINTS
    // ═══════════════════════════════════════════════════════════════════════

    getDecisions: builder.query<Decision[], string>({
      query: (projectId) => `/decisions?projectId=${projectId}`,
      providesTags: (_result, _error, projectId) => [
        { type: "Decision", id: projectId },
      ],
    }),

    searchDecisions: builder.query<
      Decision[],
      { projectId: string; q: string }
    >({
      query: ({ projectId, q }) =>
        `/decisions/search?projectId=${projectId}&q=${encodeURIComponent(q)}`,
    }),

    createDecision: builder.mutation<
      Decision,
      {
        projectId: string;
        statement: string;
        rationale?: string;
        alternativesConsidered?: string[];
        assumptions?: string[];
        openQuestions?: string[];
      }
    >({
      query: (body) => ({
        url: "/decisions",
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { projectId }) => [
        { type: "Decision", id: projectId },
      ],
    }),

    // ═══════════════════════════════════════════════════════════════════════
    // DOCUMENT ENDPOINTS
    // ═══════════════════════════════════════════════════════════════════════

    getDocuments: builder.query<Document[], { projectId: string }>({
      query: ({ projectId }) => `/documents?projectId=${projectId}`,
      providesTags: ["Doc"],
    }),

    getDocument: builder.query<Document, string>({
      query: (id) => `/documents/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Doc", id }],
    }),

    createDocument: builder.mutation<
      Document,
      {
        projectId: string;
        title: string;
        description?: string;
        docType?: string;
      }
    >({
      query: (body) => ({
        url: "/documents",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Doc"],
    }),

    updateDocument: builder.mutation<
      Document,
      { id: string; title?: string; description?: string; docType?: string }
    >({
      query: ({ id, ...body }) => ({
        url: `/documents/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "Doc", id }],
    }),

    // ═══════════════════════════════════════════════════════════════════════
    // WORKSHOP ENDPOINTS
    // ═══════════════════════════════════════════════════════════════════════

    getWorkshops: builder.query<Workshop[], { projectId: string }>({
      query: ({ projectId }) => `/workshops?projectId=${projectId}`,
      providesTags: ["Workshop"],
    }),

    getWorkshop: builder.query<Workshop, string>({
      query: (id) => `/workshops/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Workshop", id }],
    }),

    createWorkshop: builder.mutation<
      Workshop,
      {
        projectId: string;
        title: string;
        objective: string;
        scheduledStart?: string;
        scheduledEnd?: string;
        maxParticipants?: number;
      }
    >({
      query: (body) => ({
        url: "/workshops",
        method: "POST",
        body,
      }),
      invalidatesTags: (_result, _error, { projectId }) => [
        { type: "Workshop", id: projectId },
      ],
    }),

    scheduleWorkshop: builder.mutation<
      Workshop,
      { id: string; scheduledStart: string; scheduledEnd: string }
    >({
      query: ({ id, scheduledStart, scheduledEnd }) => ({
        url: `/workshops/${id}/schedule`,
        method: "POST",
        body: { scheduledStart, scheduledEnd },
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "Workshop", id }],
    }),

    startWorkshop: builder.mutation<Workshop, string>({
      query: (id) => ({
        url: `/workshops/${id}/start`,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, id) => [{ type: "Workshop", id }],
    }),

    completeWorkshop: builder.mutation<Workshop, string>({
      query: (id) => ({
        url: `/workshops/${id}/complete`,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, id) => [{ type: "Workshop", id }],
    }),

    // ═══════════════════════════════════════════════════════════════════════
    // ASSISTANT ENDPOINTS
    // ═══════════════════════════════════════════════════════════════════════

    queryAssistant: builder.mutation<
      AssistantResponse,
      { query: string; projectId: string; chatId?: string }
    >({
      query: (body) => ({
        url: "/assistant/query",
        method: "POST",
        body,
      }),
    }),
  }),
});

// Export hooks for usage in components
export const {
  // Chats
  useGetChatsQuery,
  useGetChatQuery,
  useGetMessagesQuery,
  useSendMessageMutation,
  useCreateChatMutation,
  // Projects
  useGetProjectsQuery,
  useGetProjectQuery,
  useCreateProjectMutation,
  // Decisions
  useGetDecisionsQuery,
  useSearchDecisionsQuery,
  useCreateDecisionMutation,
  // Documents
  useGetDocumentsQuery,
  useGetDocumentQuery,
  useCreateDocumentMutation,
  useUpdateDocumentMutation,
  // Workshops
  useGetWorkshopsQuery,
  useGetWorkshopQuery,
  useCreateWorkshopMutation,
  useScheduleWorkshopMutation,
  useStartWorkshopMutation,
  useCompleteWorkshopMutation,
  // Assistant
  useQueryAssistantMutation,
  // Chat Members
  useGetChatMembersQuery,
  useAddChatMemberMutation,
  useGetThreadMessagesQuery,
  // Users
  useSearchUsersQuery,
  useGetUserQuery,
} = apiSlice;
