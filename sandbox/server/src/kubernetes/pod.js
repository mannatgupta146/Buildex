import { k8sCoreV1Api } from "./config.js"

const editableMounts = [
  { mountPath: "/workspace/package.json", subPath: "package.json" },
  { mountPath: "/workspace/package-lock.json", subPath: "package-lock.json" },
  { mountPath: "/workspace/vite.config.js", subPath: "vite.config.js" },
  { mountPath: "/workspace/eslint.config.js", subPath: "eslint.config.js" },
  { mountPath: "/workspace/index.html", subPath: "index.html" },
  { mountPath: "/workspace/README.md", subPath: "README.md" },
  { mountPath: "/workspace/.gitignore", subPath: ".gitignore" },
  { mountPath: "/workspace/.dockerignore", subPath: ".dockerignore" },
  { mountPath: "/workspace/public", subPath: "public" },
  { mountPath: "/workspace/src", subPath: "src" },
]

export async function createPod(sandboxId) {
  const podManifest = {
    metadata: {
      name: `sandbox-pod-${sandboxId}`,
      labels: {
        sandboxId: sandboxId,
      },
    },
    spec: {
      volumes: [
        {
          name: "workspace-volume",
          emptyDir: {},
        },
      ],
      initContainers: [
        {
          name: "init-container",
          image: "template",
          imagePullPolicy: "IfNotPresent",
          command: [
            "sh",
            "-c",
            `set -e
cp -a /workspace/package.json /workspace/package-lock.json /workspace/vite.config.js /workspace/eslint.config.js /workspace/index.html /workspace/README.md /workspace/.gitignore /workspace/.dockerignore /workspace/public /workspace/src /seed/
cat > /seed/vite.config.js <<'EOF'
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    allowedHosts: true,
    strictPort: true,
    watch: {
      usePolling: false,
      ignored: ["**/node_modules/**"],
    },
    hmr: {
      protocol: "ws",
      clientPort: 80,
      overlay: false,
      timeout: 30000,
    },
  },
  optimizeDeps: {
    noDiscovery: true,
    include: ["react", "react-dom", "react-dom/client"],
    esbuildOptions: {
      target: "es2020",
    },
  },
})
EOF
cat > /seed/src/main.jsx <<'EOF'
import { createRoot } from "react-dom/client"
import "./index.css"
import App from "./App.jsx"

createRoot(document.getElementById("root")).render(<App />)
EOF`,
          ],
          volumeMounts: [
            {
              name: "workspace-volume",
              mountPath: "/seed",
            },
          ],
        },
      ],
      containers: [
        {
          image: "template",
          imagePullPolicy: "IfNotPresent",
          name: "sandbox-container",
          ports: [{ containerPort: 5173, name: "http" }],
          startupProbe: {
            httpGet: {
              path: "/",
              port: 5173,
            },
            periodSeconds: 5,
            failureThreshold: 60,
            timeoutSeconds: 3,
          },
          readinessProbe: {
            httpGet: {
              path: "/",
              port: 5173,
            },
            periodSeconds: 5,
            timeoutSeconds: 3,
          },
          livenessProbe: {
            httpGet: {
              path: "/",
              port: 5173,
            },
            initialDelaySeconds: 0,
            periodSeconds: 10,
            timeoutSeconds: 3,
          },
          resources: {
            limits: { cpu: "250m", memory: "256Mi" },
            requests: { cpu: "100m", memory: "128Mi" },
          },
          volumeMounts: editableMounts.map((mount) => ({
            name: "workspace-volume",
            mountPath: mount.mountPath,
            subPath: mount.subPath,
          })),
        },
        {
          image: "agent",
          imagePullPolicy: "IfNotPresent",
          name: "agent-container",
          ports: [{ containerPort: 3000, name: "http" }],
          startupProbe: {
            httpGet: {
              path: "/api/sandbox/health",
              port: 3000,
            },
            periodSeconds: 5,
            failureThreshold: 30,
            timeoutSeconds: 3,
          },
          readinessProbe: {
            httpGet: {
              path: "/api/sandbox/health",
              port: 3000,
            },
            periodSeconds: 5,
            timeoutSeconds: 3,
          },
          resources: {
            limits: { cpu: "250m", memory: "256Mi" },
            requests: { cpu: "100m", memory: "128Mi" },
          },
          volumeMounts: editableMounts.map((mount) => ({
            name: "workspace-volume",
            mountPath: mount.mountPath,
            subPath: mount.subPath,
          })),
        },
      ],
    },
  }

  const response = await k8sCoreV1Api.createNamespacedPod({
    namespace: "default",
    body: podManifest,
  })

  return response
}

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export async function waitForPodReady(sandboxId, timeoutMs = 120000) {
  const podName = `sandbox-pod-${sandboxId}`
  const deadline = Date.now() + timeoutMs

  while (Date.now() < deadline) {
    const response = await k8sCoreV1Api.readNamespacedPod({
      name: podName,
      namespace: "default",
    })

    const readyCondition = response?.status?.conditions?.find(
      (condition) => condition.type === "Ready",
    )

    if (readyCondition?.status === "True") {
      return response
    }

    await delay(2000)
  }

  throw new Error(`Timed out waiting for pod ${podName} to become Ready`)
}

export async function isPodReady(sandboxId) {
  const podName = `sandbox-pod-${sandboxId}`

  try {
    const response = await k8sCoreV1Api.readNamespacedPod({
      name: podName,
      namespace: "default",
    })

    const readyCondition = response?.status?.conditions?.find(
      (condition) => condition.type === "Ready",
    )

    return readyCondition?.status === "True"
  } catch (error) {
    if (error?.response?.statusCode === 404) {
      return false
    }

    throw error
  }
}
