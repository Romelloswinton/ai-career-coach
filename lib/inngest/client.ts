import { Inngest } from "inngest"

export const inngest = new Inngest({
  id: "ai-career-coach",
  name: "AI Career Coach",
  credentials: {
    gemini: {
      apiKey: process.env.GEMINI_API_KEY,
    },
  },
})
