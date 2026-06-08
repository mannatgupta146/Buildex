import { k8sCoreV1Api } from "./config.js"

export async function createPod(sandboxId, projectId) {
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
            "cp -r /workspace/src /workspace/public /workspace/index.html /workspace/package*.json /workspace/eslint.config.js /workspace/vite.config.js /workspace/README.md /seed/",
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
          resources: {
            limits: { cpu: "250m", memory: "256Mi" },
            requests: { cpu: "100m", memory: "128Mi" },
          },
          volumeMounts: [
            {
              name: "workspace-volume",
              mountPath: "/workspace",
            },
          ],
        },
        {
          image: "agent",
          imagePullPolicy: "IfNotPresent",
          name: "agent-container",
          ports: [{ containerPort: 3000, name: "http" }],
          resources: {
            limits: { cpu: "250m", memory: "256Mi" },
            requests: { cpu: "100m", memory: "128Mi" },
          },
          volumeMounts: [
            {
              name: "workspace-volume",
              mountPath: "/workspace",
            },
          ],
        },
        {
          image: "sync-agent",
          imagePullPolicy: "IfNotPresent",
          name: "sync-agent-container",
          ports: [{ containerPort: 4000, name: "http" }],
          resources: {
            limits: { cpu: "250m", memory: "256Mi" },
            requests: { cpu: "100m", memory: "128Mi" },
          },
          volumeMounts: [
            {
              name: "workspace-volume",
              mountPath: "/workspace",
            },
          ],
          env: [
            {
              name: "PROJECT_ID",
              value: projectId,
            },
            {
              name: "AWS_REGION",
              valueFrom: {
                secretKeyRef: {
                  name: "aws",
                  key: "AWS_REGION",
                },
              },
            },
            {
              name: "AWS_ACCESS_KEY_ID",
              valueFrom: {
                secretKeyRef: {
                  name: "aws",
                  key: "AWS_ACCESS_KEY_ID",
                },
              },
            },
            {
              name: "AWS_SECRET_ACCESS_KEY",
              valueFrom: {
                secretKeyRef: {
                  name: "aws",
                  key: "AWS_SECRET_ACCESS_KEY",
                },
              },
            }
          ]
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

export async function deletePod(sandboxId) {
  return await k8sCoreV1Api.deleteNamespacedPod({
    name: `sandbox-pod-${sandboxId}`,
    namespace: "default",
    gracePeriodSeconds: 0,
    propagationPolicy: "Background",
  });
}