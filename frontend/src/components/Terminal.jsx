import { useEffect, useRef, useState, useCallback } from "react"
import { Terminal as XTerm } from "@xterm/xterm"
import { FitAddon } from "@xterm/addon-fit"
import { WebLinksAddon } from "@xterm/addon-web-links"
import { io } from "socket.io-client"

export default function Terminal({ sandboxId }) {
  const containerRef = useRef(null)
  const shellRef = useRef(null)
  const termRef = useRef(null)
  const fitAddonRef = useRef(null)
  const socketRef = useRef(null)
  const [connected, setConnected] = useState(false)
  const [error, setError] = useState(null)

  const initTerminal = useCallback(() => {
    if (!containerRef.current || termRef.current) return

    const term = new XTerm({
      theme: {
        background: "#07111d",
        foreground: "#eaf2ff",
        cursor: "#f59e0b",
        cursorAccent: "#07111d",
        selectionBackground: "rgba(245,158,11,0.20)",
        black: "#172335",
        red: "#f87171",
        green: "#34d399",
        yellow: "#fbbf24",
        blue: "#f97316",
        magenta: "#c084fc",
        cyan: "#67e8f9",
        white: "#eaf2ff",
        brightBlack: "#334155",
        brightRed: "#fca5a5",
        brightGreen: "#6ee7b7",
        brightYellow: "#fde68a",
        brightBlue: "#fdba74",
        brightMagenta: "#d8b4fe",
        brightCyan: "#a5f3fc",
        brightWhite: "#f8fbff",
      },
      fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", monospace',
      fontSize: 13,
      lineHeight: 1.5,
      cursorBlink: true,
      cursorStyle: "bar",
      scrollback: 5000,
      allowProposedApi: true,
    })

    const fitAddon = new FitAddon()
    const webLinksAddon = new WebLinksAddon()
    term.loadAddon(fitAddon)
    term.loadAddon(webLinksAddon)
    term.open(containerRef.current)
    requestAnimationFrame(() => {
      try {
        fitAddon.fit()
      } catch (_) {}
    })

    termRef.current = term
    fitAddonRef.current = fitAddon

    term.writeln("\x1b[36m╔══════════════════════════════════════╗\x1b[0m")
    term.writeln(
      "\x1b[36m║   \x1b[1mSandbox Terminal\x1b[0m\x1b[36m                  ║\x1b[0m",
    )
    term.writeln("\x1b[36m╚══════════════════════════════════════╝\x1b[0m")
    term.writeln("")
    term.writeln("\x1b[33mConnecting to sandbox...\x1b[0m")

    return term
  }, [])

  const connectSocket = useCallback(
    (term) => {
      if (!sandboxId || !term) return

      const agentHost = `http://${sandboxId}.agent.localhost`

      try {
        const socket = io(agentHost, {
          transports: ["polling", "websocket"],
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
        })

        socketRef.current = socket

        socket.on("connect", () => {
          setConnected(true)
          setError(null)
          term.writeln(
            "\x1b[38;2;245;158;11m✓ Connected to sandbox shell\x1b[0m",
          )
          term.writeln("")
        })

        socket.on("disconnect", () => {
          setConnected(false)
          term.writeln(
            "\r\n\x1b[38;2;251;191;36m⚠ Disconnected. Reconnecting...\x1b[0m",
          )
        })

        socket.on("connect_error", (err) => {
          setConnected(false)
          setError("Connection failed")
          term.writeln(
            `\r\n\x1b[38;2;248;113;113m✗ Connection error: ${err.message}\x1b[0m`,
          )
        })

        socket.on("terminal-output", (data) => {
          term.write(data)
        })

        term.onData((data) => {
          socket.emit("terminal-input", data)
        })
      } catch (err) {
        setError(err.message)
      }
    },
    [sandboxId],
  )

  useEffect(() => {
    const term = initTerminal()
    if (term) connectSocket(term)

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
      }
      if (termRef.current) {
        termRef.current.dispose()
        termRef.current = null
      }
    }
  }, [initTerminal, connectSocket])

  // Handle resize
  useEffect(() => {
    const observer = new ResizeObserver(() => {
      if (fitAddonRef.current) {
        requestAnimationFrame(() => {
          try {
            fitAddonRef.current.fit()
          } catch (_) {}
        })
      }
    })
    if (shellRef.current) observer.observe(shellRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={shellRef}
      className="flex h-full flex-col overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #08111c 0%, #07111d 100%)",
      }}
    >
      <div
        className="flex items-center justify-between px-3 shrink-0"
        style={{
          height: "34px",
          background: "rgba(14,23,37,0.95)",
          borderBottom: "1px solid rgba(36,50,70,0.9)",
        }}
      >
        <div className="flex items-center gap-2">
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--text-secondary)"
            strokeWidth="2"
          >
            <polyline points="4 17 10 11 4 5" />
            <line x1="12" y1="19" x2="20" y2="19" />
          </svg>
          <span
            className="text-xs font-medium"
            style={{ color: "var(--text-secondary)" }}
          >
            Terminal
          </span>
        </div>
        <div className="flex items-center gap-2">
          {error && (
            <span className="text-xs" style={{ color: "var(--error)" }}>
              {error}
            </span>
          )}
          <div className="flex items-center gap-1.5">
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{
                background: connected ? "var(--success)" : "var(--error)",
                boxShadow: `0 0 8px ${connected ? "var(--success)" : "var(--error)"}`,
              }}
            />
            <span
              className="text-xs"
              style={{ color: "var(--text-secondary)" }}
            >
              {connected ? "Connected" : "Disconnected"}
            </span>
          </div>
        </div>
      </div>

      <div ref={containerRef} className="flex-1 overflow-hidden" />
    </div>
  )
}
