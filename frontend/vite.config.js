import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import http from "node:http"
import { spawn } from "node:child_process"
import net from "node:net"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const sandboxServerDir = path.resolve(__dirname, "../sandbox/server")
const aiServerDir = path.resolve(__dirname, "../ai-orchestration")
let sandboxServerPromise = null
let aiServerPromise = null

function isPortOpen(port) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ port, host: "127.0.0.1" })

    socket.once("connect", () => {
      socket.end()
      resolve(true)
    })

    socket.once("error", () => {
      resolve(false)
    })
  })
}

async function ensureSandboxServer() {
  if (await isPortOpen(3000)) {
    return
  }

  if (sandboxServerPromise) {
    return sandboxServerPromise
  }

  sandboxServerPromise = (async () => {
    const child = spawn(
      process.platform === "win32" ? "npm.cmd" : "npm",
      ["start"],
      {
        cwd: sandboxServerDir,
        detached: true,
        shell: false,
        stdio: "ignore",
        windowsHide: true,
      },
    )

    child.unref()

    const deadline = Date.now() + 30000

    while (Date.now() < deadline) {
      if (await isPortOpen(3000)) {
        return
      }

      await new Promise((resolve) => setTimeout(resolve, 500))
    }

    throw new Error("Sandbox API did not start on http://localhost:3000")
  })()

  try {
    await sandboxServerPromise
  } finally {
    sandboxServerPromise = null
  }
}

async function ensureAiServer() {
  if (await isPortOpen(3001)) {
    return
  }

  if (aiServerPromise) {
    return aiServerPromise
  }

  aiServerPromise = (async () => {
    const child = spawn(
      process.platform === "win32" ? "npm.cmd" : "npm",
      ["start"],
      {
        cwd: aiServerDir,
        detached: true,
        shell: false,
        stdio: "ignore",
        windowsHide: true,
        env: {
          ...process.env,
          PORT: "3001",
        },
      },
    )

    child.unref()

    const deadline = Date.now() + 30000

    while (Date.now() < deadline) {
      if (await isPortOpen(3001)) {
        return
      }

      await new Promise((resolve) => setTimeout(resolve, 500))
    }

    throw new Error("AI API did not start on http://localhost:3001")
  })()

  try {
    await aiServerPromise
  } finally {
    aiServerPromise = null
  }
}

function forwardApiRequest(req, res, port, apiPrefix) {
  const upstream = http.request(
    {
      hostname: "127.0.0.1",
      port,
      method: req.method,
      path: req.url,
      headers: {
        ...req.headers,
        host: `127.0.0.1:${port}`,
      },
    },
    (upstreamResponse) => {
      res.statusCode = upstreamResponse.statusCode || 502

      Object.entries(upstreamResponse.headers).forEach(([name, value]) => {
        if (typeof value !== "undefined") {
          res.setHeader(name, value)
        }
      })

      upstreamResponse.pipe(res)
    },
  )

  upstream.on("error", (error) => {
    if (!res.headersSent) {
      res.statusCode = 502
      res.setHeader("Content-Type", "application/json")
      res.end(
        JSON.stringify({
          message: error.message,
          status: "proxy_error",
          apiPrefix,
        }),
      )
      return
    }

    res.destroy(error)
  })

  req.on("aborted", () => {
    upstream.destroy(new Error("Client aborted request"))
  })

  req.pipe(upstream)
}

// https://vite.dev/config/
export default defineConfig(async ({ command }) => {
  if (command === "serve") {
    await Promise.all([ensureSandboxServer(), ensureAiServer()])
  }

  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: "auto-start-local-backends",
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            try {
              if (req.url?.startsWith("/api/sandbox")) {
                await ensureSandboxServer()
                forwardApiRequest(req, res, 3000, "/api/sandbox")
                return
              }

              if (req.url?.startsWith("/api/ai")) {
                await ensureAiServer()
                forwardApiRequest(req, res, 3001, "/api/ai")
                return
              }
            } catch (error) {
              res.statusCode = 503
              res.setHeader("Content-Type", "application/json")
              res.end(
                JSON.stringify({
                  message: error.message,
                  status: "backend_unavailable",
                }),
              )
              return
            }

            next()
          })
        },
      },
    ],
    server: {
      host: "0.0.0.0",
      port: 5173,
    },
  }
})
