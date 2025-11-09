// main-screen/shared.ts
export type LogEntry = {
  title: string
  date: string
  details: string
  type?: "info" | "warning" | "error"
}

// Export other shared types if you need them elsewhere:
export type ProcessingStatus = {
  status: "idle" | "processing" | "completed" | "error"
  progress: number
  message: string
}
