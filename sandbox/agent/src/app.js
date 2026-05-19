import express from "express"
import morgan from "morgan"
import fs from "fs"
import path from "path"

const app = express()

app.use(morgan("dev"))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

const WORKSPACE_DIR = "/workspace"

app.get("/api/agent/health", (req, res) => {
  res.status(200).json({
    message: "Sandbox agent API is healthy",
    status: "ok",
  })
})

app.get("/", (req, res) => {
  res.status(200).json({
    message: "Sandbox agent is reachable",
    status: "ok",
  })
})

/**
 * @route GET /list-files
 */
app.get("/list-files", async (req, res) => {
  const ignoredDirs = new Set(["node_modules", ".git", "dist"])

  const listFiles = async (dir, baseDir = "") => {
    const entries = await fs.promises.readdir(dir, {
      withFileTypes: true,
    })

    const files = []

    for (const entry of entries) {
      if (ignoredDirs.has(entry.name)) {
        continue
      }

      const fullPath = path.join(dir, entry.name)

      const relativePath = path
        .join(baseDir, entry.name)
        .replace(/\\/g, "/")

      if (entry.isDirectory()) {
        const subFiles = await listFiles(fullPath, relativePath)
        files.push(...subFiles)
      } else {
        files.push(relativePath)
      }
    }

    return files
  }

  try {
    const files = await listFiles(WORKSPACE_DIR)

    res.status(200).json({
      message: "List of files in workspace",
      files,
    })
  } catch (err) {
    console.error("Error listing files:", err)

    res.status(500).json({
      message: "Error listing files",
      status: "error",
    })
  }
})

/**
 * @route GET /read-files
 */
app.get("/read-files", async (req, res) => {
  const files = req.query.files

  if (!files || typeof files !== "string") {
    return res.status(400).json({
      message: "No files specified in query parameter",
      status: "error",
    })
  }

  const fileList = files.split(",").map((file) => file.trim())

  const results = await Promise.all(
    fileList.map(async (file) => {
      const filePath = path.join(WORKSPACE_DIR, file)

      try {
        const content = await fs.promises.readFile(filePath, "utf-8")

        return {
          [filePath]: content,
        }
      } catch (err) {
        console.error(`Error reading file ${filePath}:`, err)

        return {
          [filePath]: `Error reading file: ${err.message}`,
        }
      }
    })
  )

  res.status(200).json({
    message: "File contents",
    files: results,
  })
})

/**
 * @route PATCH /update-files
 */
app.patch("/update-files", async (req, res) => {
  const updates = req.body.updates

  if (!updates || !Array.isArray(updates)) {
    return res.status(400).json({
      message: "Invalid request body, expected an array of updates",
      status: "error",
    })
  }

  const results = await Promise.all(
    updates.map(async (update) => {
      const { file, content } = update

      if (!file || content === undefined) {
        return {
          file: file || "undefined",
          message:
            "Invalid update object, missing file or content property",
        }
      }

      const filePath = path.join(WORKSPACE_DIR, file)

      try {
        await fs.promises.mkdir(path.dirname(filePath), {
          recursive: true,
        })

        await fs.promises.writeFile(filePath, content, "utf-8")

        return {
          [filePath]: "File updated successfully",
        }
      } catch (err) {
        console.error(`Error updating file ${filePath}:`, err)

        return {
          [filePath]: `Error updating file: ${err.message}`,
        }
      }
    })
  )

  res.status(200).json({
    message: "File update results",
    results,
  })
})

/**
 * @route POST /create-file
 */
app.post("/create-files", async (req, res) => {
  const files = req.body.files

  if (!files || !Array.isArray(files)) {
    return res.status(400).json({
      message: "Invalid request body, expected an array of files",
      status: "error",
    })
  }

  const results = await Promise.all(
    files.map(async (fileObj) => {
      const { file, content } = fileObj

      if (!file || content === undefined) {
        return {
          file: file || "undefined",
          message:
            "Invalid file object, missing file or content property",
        }
      }

      const filePath = path.join(WORKSPACE_DIR, file)

      try {
        await fs.promises.mkdir(path.dirname(filePath), {
          recursive: true,
        })

        await fs.promises.writeFile(filePath, content, "utf-8")

        return {
          [filePath]: "File created successfully",
        }
      } catch (error) {
        console.error(`Error creating file ${filePath}:`, error)

        return {
          [filePath]: `Error creating file: ${error.message}`,
        }
      }
    })
  )

  res.status(200).json({
    message: "File creation results",
    results,
  })
})

export default app