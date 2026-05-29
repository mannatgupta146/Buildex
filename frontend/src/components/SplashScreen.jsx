import { useState, useEffect } from "react"

export default function SplashScreen({ onSandboxCreated }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [dots, setDots] = useState("")

  useEffect(() => {
    if (!loading) return
    const interval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? "" : d + "."))
    }, 400)
    return () => clearInterval(interval)
  }, [loading])

  const handleCreate = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/sandbox/start", { method: "POST" })
      if (!res.ok) throw new Error(`Server responded with ${res.status}`)
      const data = await res.json()
      onSandboxCreated(data)
    } catch (err) {
      setError(err.message || "Failed to create sandbox")
      setLoading(false)
    }
  }

  return (
    <div className="relative flex flex-col items-center justify-center h-full w-full overflow-hidden">
      <div className="absolute inset-0 pointer-events-none splash-grid" />
      <div className="absolute inset-0 pointer-events-none splash-glow" />
      <div className="splash-orb" aria-hidden="true" />

      {[...Array(14)].map((_, i) => (
        <div
          key={i}
          className="particle"
          style={{
            width: Math.random() * 6 + 2 + "px",
            height: Math.random() * 6 + 2 + "px",
            left: Math.random() * 100 + "%",
            top: Math.random() * 100 + "%",
            animation: `pulse-glow ${2 + Math.random() * 3}s ease-in-out infinite`,
            animationDelay: Math.random() * 2 + "s",
          }}
        />
      ))}

      <div className="relative z-10 splash-card animate-fadeIn text-center">
        <div className="flex flex-col items-center gap-8">
          <div className="splash-badge">
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: "var(--accent)" }}
            />
            Buildex Studio
          </div>

          <div className="relative mx-auto floaty">
            <div className="splash-icon">
              <div
                className="absolute inset-0 rounded-[28px] border border-white/5"
                aria-hidden="true"
              />
              <svg width="52" height="52" viewBox="0 0 40 40" fill="none">
                <rect
                  x="4"
                  y="4"
                  width="14"
                  height="14"
                  rx="2"
                  fill="var(--accent)"
                  opacity="0.95"
                />
                <rect
                  x="22"
                  y="4"
                  width="14"
                  height="14"
                  rx="2"
                  fill="#747bff"
                  opacity="0.95"
                />
                <rect
                  x="4"
                  y="22"
                  width="14"
                  height="14"
                  rx="2"
                  fill="#8b5cf6"
                  opacity="0.85"
                />
                <rect
                  x="22"
                  y="22"
                  width="14"
                  height="14"
                  rx="2"
                  fill="#f4f0ff"
                  opacity="0.95"
                />
              </svg>
            </div>
          </div>

          <div className="space-y-4">
            <h1 className="hero-title">Buildex</h1>
            <p className="hero-sub">
              A polished AI workspace for launching, editing, and previewing
              your project inside one premium studio.
            </p>
            <p className="splash-note">
              Fast setup, clean layouts, and an expressive interface designed to
              feel modern and focused.
            </p>
          </div>

          {!loading ? (
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button onClick={handleCreate} className="launch-btn">
                <span className="flex items-center gap-2">
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <polygon points="5 3 19 12 5 21 5 3" />
                  </svg>
                  Launch Buildex
                </span>
              </button>
              <div className="ghost-btn">Premium workspace ready</div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div
                className="flex items-center gap-3 px-8 py-4 rounded-xl"
                style={{
                  background: "#17122b",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <div
                  className="w-5 h-5 rounded-full border-2 border-t-transparent animate-spin"
                  style={{
                    borderColor: "var(--accent)",
                    borderTopColor: "transparent",
                  }}
                />
                <span
                  className="text-sm font-medium"
                  style={{ color: "var(--text-secondary)" }}
                >
                  Initializing Buildex{dots}
                </span>
              </div>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Setting up your isolated workspace
              </p>
            </div>
          )}

          {error && (
            <div
              className="px-5 py-3 rounded-lg text-sm"
              style={{
                background: "rgba(248,113,113,0.1)",
                border: "1px solid rgba(248,113,113,0.28)",
                color: "#fecaca",
              }}
            >
              ⚠ {error}
            </div>
          )}
        </div>
      </div>

      <div
        className="absolute bottom-6 text-xs"
        style={{ color: "var(--text-muted)" }}
      >
        Powered by AI • Isolated Runtime • Zero Config
      </div>
    </div>
  )
}
