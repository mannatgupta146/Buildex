import express from "express"
import morgan from "morgan"
import http from "http"
import cookieParser from "cookie-parser"

const app = express()

app.use(morgan("dev"))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

app.get("/api/sandbox/health", (req, res) => {
  res.status(200).json({
    message: "Sandbox API is healthy",
    status: "ok",
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
