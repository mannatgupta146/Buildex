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
    setStatus("ready")
  }, [])

  const handleFilesChanged = useCallback(() => {
    setFileRefreshKey((k) => k + 1)
  }, [])

  const handleFileSelect = useCallback((path) => {
    setActiveFile(path)
    setActiveTab("files")
  }, [])

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
              <PreviewFrame previewUrl={previewUrl} />
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
