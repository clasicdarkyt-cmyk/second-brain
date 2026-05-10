import { create } from "zustand"
import { ChatMessage } from "@/types"

interface AIChatStore {
  isOpen: boolean
  messages: ChatMessage[]
  isLoading: boolean
  greeting: string | null
  togglePanel: () => void
  openPanel: () => void
  addMessage: (msg: ChatMessage) => void
  setLoading: (v: boolean) => void
  setGreeting: (g: string) => void
  appendToLastMessage: (chunk: string) => void
  clearMessages: () => void
}

export const useAIChatStore = create<AIChatStore>((set) => ({
  isOpen: false,
  messages: [],
  isLoading: false,
  greeting: null,

  togglePanel: () => set((s) => ({ isOpen: !s.isOpen })),
  openPanel: () => set({ isOpen: true }),

  addMessage: (msg) =>
    set((s) => ({ messages: [...s.messages, msg] })),

  setLoading: (v) => set({ isLoading: v }),

  setGreeting: (g) => set({ greeting: g }),

  appendToLastMessage: (chunk) =>
    set((s) => {
      const msgs = [...s.messages]
      if (msgs.length === 0) return s
      const last = msgs[msgs.length - 1]
      msgs[msgs.length - 1] = { ...last, content: last.content + chunk }
      return { messages: msgs }
    }),

  clearMessages: () => set({ messages: [] }),
}))
