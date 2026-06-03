import express from "express"
import morgan from "morgan"
import { createPod } from "./kubernetes/pod.js"
import { createService } from "./kubernetes/service.js"
import { v7 as uuid } from "uuid"
import http from "http"

const app = express()

app.use(morgan("dev"))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get("/api/sandbox/health", (req, res) => {
  res.status(200).json({
    message: "Sandbox API is healthy",
    status: "ok",
  })
})

app.post("/api/sandbox/start", async (req, res) => {
  const sandboxId = uuid()

  await Promise.all([createPod(sandboxId), createService(sandboxId)])

  return res.status(201).json({
    message: "Sandbox environment created successfully",
    sandboxId,
    previewUrl: `http://${sandboxId}.preview.localhost`,
  })
})

// readiness probe for a specific sandbox
app.get("/api/sandbox/:id/ready", async (req, res) => {
  const { id } = req.params
  const target = `http://sandbox-service-${id}`

  const timeoutMs = 2000

  const check = () =>
    new Promise((resolve) => {
      const req = http.get(target, (r) => {
        const ok = r.statusCode && r.statusCode >= 200 && r.statusCode < 500
        // treat 404/301 as 'service up' for our purpose if response received
        resolve(ok)
        r.resume()
      })
      req.on("error", () => resolve(false))
      req.setTimeout(timeoutMs, () => {
        req.destroy()
        resolve(false)
      })
    })

  try {
    const ready = await check()
    return res.status(200).json({ ready })
  } catch (err) {
    return res.status(200).json({ ready: false })
  }
})

export default app
