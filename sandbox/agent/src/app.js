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
 * @description List all files in the workspace directory and its subdirectories and return the list as a JSON response. 
 * The response should contain an array of file paths relative to the workspace directory, exclude directories like node_modules and .git. 
 * The file paths should use forward slashes (/) as separators, regardless of the operating system.
 * - eg. {
 *    files: [
 *      "file1.txt",
 *      "src/file2.txt",
 *      "src/subdir/file3.txt"
 *    ]
 * }
 */
app.get("/list-files", async (req, res) => {
  const listFiles = async (dir, baseDir = "") => {
    const entries = await fs.promises.readdir(dir, { withFileTypes: true })
    const files = []

    for (const entry of entries) {
      if (entry.name === "node_modules" || entry.name === ".git" || entry.name === "dist") {
        continue
      }
      const fullPath = path.join(dir, entry.name)
      const relativePath = path.join(baseDir, entry.name).replace(/\\/g, "/")

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
 * @description Read the contents of file requested in the query parameter "files" and return the contents as a JSON response.
 * - eg. GET /read-files?files=file1.txt&files=file2.txt
 */
app.get("/read-files", async (req, res) => {
  const files = req.query.files

  if (!files || typeof files !== "string") {
    return res.status(400).json({
      message: "No files specified in query parameter",
      status: "error",
    })
  }

  const fileList = files.split(",")

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

  const results = await Promise.all(
    updates.map(async (update) => {
      const { file, content } = update

      if (!file || content === undefined) {
        return {
          file: file || "undefined",
          message: "Invalid update object, missing file or content property",
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
 * @description Create a new file with the content provided in the request body, the request body should contain a property "file" specifying the file path (relative to the workspace directory) 
 * and a property "content" specifying the content of the file. Return a JSON response indicating whether the file was created successfully or if there was an error.
 */
app.post("/create-file", async (req, res) => {
  const files = req.body.files

  if (!files || !Array.isArray(files)) {
    return res.status(400).json({
      message: "Invalid request body, expected an array of files",
      status: "error",
    })
  }

  const results = await Promise.all(files.map(async (file) => {
      const { file, content } = fileObj
      const filePath = path.join(WORKSPACE_DIR, file)

      try {
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
    }))   

  res.status(200).json({
    message: "File creation results",
    results,
  })
})



export default app 
