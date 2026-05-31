import express from "express"
import morgan from "morgan"
import { createPod, isPodReady, waitForPodReady } from "./kubernetes/pod.js"
import { createService } from "./kubernetes/service.js"
import { v7 as uuid } from "uuid"

const app = express()

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function withRetries(operation, label, attempts = 5) {
  let lastError

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation()
    } catch (error) {
      lastError = error

      if (attempt === attempts) {
        break
      }

      console.warn(
        `Retrying ${label} creation after attempt ${attempt} failed: ${error.message}`,
      )
      await delay(2000 * attempt)
    }
  }

  throw lastError
}

app.use(morgan("dev"))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get("/api/sandbox/health", (req, res) => {
  res.status(200).json({
    message: "Sandbox API is healthy",
    status: "ok",
  })
})

app.get("/api/sandbox/:sandboxId/ready", async (req, res) => {
  const { sandboxId } = req.params
  const ready = await isPodReady(sandboxId)

  return res.status(200).json({
    ready,
    sandboxId,
  })
})

app.post("/api/sandbox/start", async (req, res) => {
  const sandboxId = uuid()

  await Promise.all([
    withRetries(() => createPod(sandboxId), "pod"),
    withRetries(() => createService(sandboxId), "service"),
  ])

  void waitForPodReady(sandboxId).catch((error) => {
    console.error(`Sandbox ${sandboxId} did not become ready in time`, error)
  })

  return res.status(201).json({
    message: "Sandbox environment created successfully",
    sandboxId,
    previewUrl: `http://${sandboxId}.preview.localhost`,
  })
})

export default app
