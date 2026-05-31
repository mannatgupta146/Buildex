import { useEffect, useRef, useState } from "react"

export default function PreviewFrame({
  previewUrl,
  loading: externalLoading = false,
  showIframe = true,
}) {
  const iframeRef = useRef(null)
  const [refreshKey, setRefreshKey] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (externalLoading || !showIframe) {
      setLoading(true)
    }
  }, [externalLoading, previewUrl, showIframe])

  const handleRefresh = () => {
    setLoading(true)
    setRefreshKey((k) => k + 1)
  }

  return (
    <div className="flex flex-col h-full w-full">
      <div
        className="flex items-center gap-2 px-3 shrink-0"
        style={{
          height: "38px",
          background: "var(--bg-base)",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <div className="flex items-center gap-1.5 mr-1">
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ background: "#fb7185", opacity: 0.75 }}
          />
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ background: "var(--warning)", opacity: 0.75 }}
          />
          <div
            className="w-2.5 h-2.5 rounded-full"
            style={{ background: "var(--success)", opacity: 0.75 }}
          />
        </div>

        <div
          className="flex-1 flex items-center px-3 rounded"
          style={{
            background: "var(--bg-panel)",
            border: "1px solid var(--border)",
            height: "24px",
          }}
        >
          {loading && (
            <div
              className="w-3 h-3 rounded-full border border-t-transparent mr-2 shrink-0"
              style={{
                borderColor: "var(--accent)",
                borderTopColor: "transparent",
                animation: "spin 0.8s linear infinite",
              }}
            />
          )}
          <span
            className="text-xs truncate"
            style={{ color: "var(--text-muted)", fontFamily: "monospace" }}
          >
            {previewUrl}
          </span>
        </div>

        <button
          onClick={handleRefresh}
          className="p-1 rounded transition-colors cursor-pointer"
          style={{ color: "var(--text-muted)" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent)")}
          onMouseLeave={(e) =>
            (e.currentTarget.style.color = "var(--text-muted)")
          }
          title="Refresh preview"
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path d="M23 4v6h-6M1 20v-6h6" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
        </button>

        <a
          href={previewUrl}
          target="_blank"
          rel="noreferrer"
          className="p-1 rounded transition-colors cursor-pointer"
          style={{ color: "var(--text-muted)" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "var(--accent)")}
          onMouseLeave={(e) =>
            (e.currentTarget.style.color = "var(--text-muted)")
          }
          title="Open in new tab"
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
          >
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
        </a>
      </div>

      <div className="flex-1 relative">
        {showIframe && (
          <iframe
            key={refreshKey}
            ref={iframeRef}
            src={previewUrl}
            className="w-full h-full border-0"
            style={{ background: "#fff" }}
            title="Sandbox Preview"
            onLoad={() => {
              setLoading(false)
            }}
          />
        )}
        {loading && (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ background: "rgba(13,16,22,0.9)" }}
          >
            <div
              className="px-5 py-3 rounded-xl text-sm"
              style={{
                background: "var(--bg-panel-strong)",
                border: "1px solid var(--border)",
                color: "var(--text-secondary)",
              }}
            >
              Starting preview
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
