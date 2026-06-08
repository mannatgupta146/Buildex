import { Router } from "express"
import { createPod } from "../kubernetes/pod.js"
import { createService } from "../kubernetes/service.js"
import { v7 as uuid } from "uuid"
import {createSandboxKey} from "../config/redis.js"
import { authMiddleware } from "../middleware/auth.middleware.js"
import projectModel from "../models/project.model.js"

const sandboxRouter = Router()

sandboxRouter.post("/project", authMiddleware, async (req, res) => {
  const { title } = req.body

  const newProject = await projectModel.create({
    user: req.user.id,
    title
  })

  await newProject.save()

  return res.status(201).json({
    message: "Project created successfully",
    project: newProject,
  })
})

sandboxRouter.post("/start", authMiddleware, async (req, res) => {

  const projectId = req.body.projectId
  if (!projectId) {
    return res.status(400).json({ error: "projectId is required" })
  }

  const project = await projectModel.findById({_id : projectId, userId: req.user.id})

  const sandboxId = uuid()

  await Promise.all([
    createPod(sandboxId, projectId), 
    createService(sandboxId),
    createSandboxKey(sandboxId)
  ])

  return res.status(201).json({
    message: "Sandbox environment created successfully",
    sandboxId,
    previewUrl: `http://${sandboxId}.preview.localhost`,
  })
})

sandboxRouter.get("/projects", authMiddleware, async (req, res) => {
  const projects = await projectModel.find({ user: req.user.id }).sort({ createdAt: -1 })

  return res.status(200).json({
    message: "Projects retrieved successfully",
    projects,
  })
})

export default sandboxRouter