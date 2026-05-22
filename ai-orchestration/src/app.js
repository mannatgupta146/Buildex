import express from "express"
import morgan from "morgan"
import agentRouter from "./routes/agent.routes.js"

const app = express()

app.use(morgan("dev"))
app.use(express.json())

app.use("/api/ai", agentRouter)

app.get("/api/ai/healthz", (req, res) => {
  res.status(200).json({
    message: "AI Orchestration API is healthy",
    status: "ok",
  })
})

export default app
