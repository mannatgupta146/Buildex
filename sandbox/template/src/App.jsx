import { useState } from "react"
import "./App.css"

function App() {
  const [count, setCount] = useState(0)

  return (
    <main className="sandbox-shell">
      <section className="sandbox-card">
        <div className="sandbox-badge">Sandbox Preview</div>
        <h1>Fast reload, small first paint</h1>
        <p>
          This template stays intentionally small so the preview stays stable
          and changes are easy to verify.
        </p>

        <div className="sandbox-stats">
          <div>
            <span>Mode</span>
            <strong>Vite dev</strong>
          </div>
          <div>
            <span>Hot reload</span>
            <strong>Enabled</strong>
          </div>
          <div>
            <span>First paint</span>
            <strong>Lightweight</strong>
          </div>
        </div>

        <button
          type="button"
          className="sandbox-button"
          onClick={() => setCount((current) => current + 1)}
        >
          Refresh counter {count}
        </button>

        <div className="sandbox-note">
          Edit <code>src/App.jsx</code> and refresh the page to verify changes.
        </div>
      </section>
    </main>
  )
}

export default App
