import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import tailwindcss from "@tailwindcss/vite"
import { spawn } from "node:child_process"
import net from "node:net"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const sandboxServerDir = path.resolve(__dirname, "../sandbox/server")

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
}

// https://vite.dev/config/
export default defineConfig(async ({ command }) => {
  if (command === "serve") {
    await ensureSandboxServer()
  }

  return {
    plugins: [react(), tailwindcss()],
    server: {
      host: "0.0.0.0",
      port: 5173,
      proxy: {
        "/api": {
          target: "http://127.0.0.1:3000",
          changeOrigin: true,
          secure: false,
          timeout: 120000,
          proxyTimeout: 120000,
        },
      },
    },
  }
})
