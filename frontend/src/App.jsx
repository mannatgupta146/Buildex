import { useEffect, useState, useRef, useCallback } from "react"
import SplashScreen from "./components/SplashScreen"
import TopBar from "./components/TopBar"
import FileExplorer from "./components/FileExplorer"
import PreviewFrame from "./components/PreviewFrame"
import FileViewer from "./components/FileViewer"
import Terminal from "./components/Terminal"
import AiChat from "./components/AiChat"

export default function App() {
  // Sandbox state
  const [sandbox, setSandbox] = useState(null) // { sandboxId, previewUrl, agentBase }
  const [status, setStatus] = useState("ready")
  const [previewReady, setPreviewReady] = useState(false)

  // UI state
  const [activeTab, setActiveTab] = useState("preview") // 'preview' | 'files'
  const [activeFile, setActiveFile] = useState(null)
  const [fileRefreshKey, setFileRefreshKey] = useState(0)

  // Terminal resize
  const [terminalHeight, setTerminalHeight] = useState(240)
  const isDragging = useRef(false)
  const dragStartY = useRef(0)
  const dragStartH = useRef(0)

  const clampTerminalHeight = useCallback((height) => {
    const viewportLimit =
      typeof window !== "undefined"
        ? Math.max(160, Math.floor(window.innerHeight * 0.42))
        : 420
    return Math.min(Math.max(height, 160), viewportLimit)
  }, [])

  useEffect(() => {
    const handleResize = () => {
      setTerminalHeight((current) => clampTerminalHeight(current))
    }

    window.addEventListener("resize", handleResize)
    handleResize()

    return () => window.removeEventListener("resize", handleResize)
  }, [clampTerminalHeight])

  const handleSandboxCreated = useCallback((data) => {
    const agentBase = `http://${data.sandboxId}.agent.localhost`
    setSandbox({
      sandboxId: data.sandboxId,
      previewUrl: data.previewUrl,
      agentBase,
    })
    setStatus("loading")
    setPreviewReady(false)
  }, [])

  const handleFilesChanged = useCallback(() => {
    setFileRefreshKey((k) => k + 1)
  }, [])

  const handleFileSelect = useCallback((path) => {
    setActiveFile(path)
    setActiveTab("files")
  }, [])

  useEffect(() => {
    if (!sandbox?.sandboxId) {
      return undefined
    }

    let cancelled = false
    let timeoutId
    const startedAt = Date.now()
    const maxWaitMs = 120000

    const pollPreviewReady = async () => {
      try {
        const response = await fetch(`/api/sandbox/${sandbox.sandboxId}/ready`)

        if (!response.ok) {
          throw new Error(`Server responded with ${response.status}`)
        }

        const data = await response.json()

        if (cancelled) {
          return
        }

        if (data.ready) {
          setPreviewReady(true)
          setStatus("ready")
          return
        }

        if (Date.now() - startedAt >= maxWaitMs) {
          setStatus("error")
          return
        }

        timeoutId = setTimeout(pollPreviewReady, 2000)
      } catch (error) {
        if (cancelled) {
          return
        }

        if (Date.now() - startedAt >= maxWaitMs) {
          setStatus("error")
          return
        }

        timeoutId = setTimeout(pollPreviewReady, 2000)
      }
    }

    pollPreviewReady()

    return () => {
      cancelled = true
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [sandbox?.sandboxId])

  // Drag to resize terminal
  const handleDragStart = (e) => {
    isDragging.current = true
    dragStartY.current = e.clientY
    dragStartH.current = terminalHeight

    const onMove = (ev) => {
      if (!isDragging.current) return
      const delta = dragStartY.current - ev.clientY
      const newH = clampTerminalHeight(dragStartH.current + delta)
      setTerminalHeight(newH)
    }
    const onUp = () => {
      isDragging.current = false
      document.removeEventListener("mousemove", onMove)
      document.removeEventListener("mouseup", onUp)
    }
    document.addEventListener("mousemove", onMove)
    document.addEventListener("mouseup", onUp)
  }

  // Landing / splash
  if (!sandbox) {
    return <SplashScreen onSandboxCreated={handleSandboxCreated} />
  }

  const { sandboxId, previewUrl, agentBase } = sandbox

  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden app-shell">
      <TopBar
        sandboxId={sandboxId}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        status={status}
      />

      {/* Main layout */}
      <div className="flex min-h-0 flex-1 overflow-hidden px-3 pb-3 gap-3">
        <FileExplorer
          agentBase={agentBase}
          activeFile={activeFile}
          onFileSelect={handleFileSelect}
          refreshKey={fileRefreshKey}
        />

        <div className="flex min-w-0 min-h-0 flex-1 flex-col overflow-hidden workspace-panel">
          <div className="min-h-0 flex-1 overflow-hidden">
            {activeTab === "preview" ? (
              previewReady ? (
                <PreviewFrame previewUrl={previewUrl} />
              ) : (
                <div
                  className="flex h-full w-full items-center justify-center"
                  style={{ background: "var(--bg-base)" }}
                >
                  <div
                    className="flex flex-col items-center gap-3 rounded-2xl px-6 py-5"
                    style={{
                      background: "var(--bg-panel-strong)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <div
                      className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
                      style={{
                        borderColor: "var(--accent)",
                        borderTopColor: "transparent",
                      }}
                    />
                    <div className="text-sm font-medium">
                      Preparing preview…
                    </div>
                    <div
                      className="text-xs text-center max-w-xs"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Waiting for the sandbox pod to become ready before the
                      preview frame loads.
                    </div>
                  </div>
                </div>
              )
            ) : (
              <FileViewer agentBase={agentBase} filePath={activeFile} />
            )}
          </div>

          <div
            className="workspace-splitter"
            style={{
              height: "14px",
            }}
            onMouseDown={handleDragStart}
            title="Drag to resize terminal"
          >
            <div className="workspace-splitter-handle" />
          </div>

          <div
            className="shrink-0 overflow-hidden terminal-shell"
            style={{ height: `${terminalHeight}px` }}
          >
            <Terminal sandboxId={sandboxId} />
          </div>
        </div>

        <div
          className="shrink-0 overflow-hidden workspace-panel"
          style={{ width: "360px" }}
        >
          <AiChat sandboxId={sandboxId} onFilesChanged={handleFilesChanged} />
        </div>
      </div>
    </div>
  )
}
