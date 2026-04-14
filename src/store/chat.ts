import { create } from "zustand"
import { persist } from "zustand/middleware"

export type ChatMode = "network" | "bestpractice" | "career" | "message"

export interface ChatMessage {
  role: "user" | "assistant"
  content: string
  mode: ChatMode
  timestamp: string
}

interface ChatState {
  // Session
  sessionId: string
  messages: ChatMessage[]
  activeMode: ChatMode
  isOpen: boolean
  isThinking: boolean

  // Context awareness
  currentScreen: string

  // Actions
  addMessage: (msg: ChatMessage) => void
  updateLastAssistant: (content: string) => void
  setMode: (mode: ChatMode) => void
  setOpen: (open: boolean) => void
  setThinking: (thinking: boolean) => void
  setCurrentScreen: (screen: string) => void
  clearMessages: () => void
}

function generateSessionId() {
  return `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      sessionId: generateSessionId(),
      messages: [],
      activeMode: "network",
      isOpen: false,
      isThinking: false,
      currentScreen: "dashboard",

      addMessage: (msg) =>
        set((s) => ({
          messages: [...s.messages.slice(-49), msg],
        })),

      updateLastAssistant: (content) =>
        set((s) => {
          const msgs = [...s.messages]
          if (msgs.length > 0 && msgs[msgs.length - 1].role === "assistant") {
            msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], content }
          }
          return { messages: msgs }
        }),

      setMode: (mode) => set({ activeMode: mode }),
      setOpen: (open) => set({ isOpen: open }),
      setThinking: (thinking) => set({ isThinking: thinking }),
      setCurrentScreen: (screen) => set({ currentScreen: screen }),
      clearMessages: () => set({ messages: [], sessionId: generateSessionId() }),
    }),
    {
      name: "tend-chat",
      partialize: (state) => ({
        sessionId: state.sessionId,
        messages: state.messages,
        activeMode: state.activeMode,
        currentScreen: state.currentScreen,
      }),
    }
  )
)
