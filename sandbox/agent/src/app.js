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

app.get("/list-files", async (req, res) => {
  const elements = await fs.promises.readdir(WORKSPACE_DIR)
  res.status(200).json({
    message: "Elements in working directory",
    elements,
  })
})

/**
 * @route GET /read-files
 * @description Read the contents of file requested in the query parameter "files" and return the contents as a JSON response.
 * - eg. GET /read-files?files=file1.txt&files=file2.txt
 */
app.get("/read-files", async (req, res) => {
  const files = req.query.files
  if (!files) {
    return res.status(400).json({
      message: "No files specified in query parameter",
      status: "error",
    })
  }

  const fileList = files.split(",")
  
  const results = await Promise.all(fileList.map(async (file) => {
    const filePath = `${WORKSPACE_DIR}/${file}`
    try {
      const content = await fs.promises.readFile(filePath, "utf-8")
      return {
        [filePath] : content
      }
    }
    catch (err) {
      console.error(`Error reading file ${filePath}:`, err)
      return {
        [filePath] : `Error reading file: ${err.message}`
      }
    }
  }))

  res.status(200).json({
    message: "File contents",
    files: results,
  })
})

/**
 * @route PATCH /update-files
 * @description Update the contents of file requested in the query parameter "files" with the content provided in the request body shpuld conatin a property updates which is an array of objects
 * and return the updated contents as a JSON array of objects, each object should have a file property specifying the file path
 * (relative to the workspace directory) and a content property.
 */
app.patch("/update-files", async (req, res) => {
  const updates = req.body.updates
  if (!updates || !Array.isArray(updates)) {
    return res.status(400).json({
      message: "Invalid request body, expected an array of updates",
      status: "error",
    })
  }

  const results = await Promise.all(updates.map(async (update) => {
    const { file, content } = update
    if (!file || !content) {
      return {
        file: file || "undefined",
        content: "Invalid update object, missing file or content property"
      }
    }

    const filePath = path.join(WORKSPACE_DIR, file)
    try {
      await fs.promises.writeFile(filePath, content, "utf-8")
      return {
        [filePath]: "File updated successfully"
      }
    }
    catch (err) {
      console.error(`Error updating file ${filePath}:`, err)
      return {
        [filePath]: `Error updating file: ${err.message}`
      }
    }

    }))

    res.status(200).json({
      message: "File update results",
      results,
    })

  })

export default app 
