import { Router } from "express"
import agent from "../agents/code.agent.js"

const agentRouter = Router()

agentRouter.post("/invoke", async (req, res) => {
  try {
    const { message, projectId } = req.body

    const response = await agent.invoke({
      messages: [
        {
          role: "user",
          content: message,
        },
      ]},
    {
        context: {
            projectId
        },
        streamMode: "custom"
    })

    for await (const chunk of response) {
      console.log("[agent-chunk]", chunk)
    }

    const lastMessage = response?.messages?.[response.messages.length - 1]
    const finalContent =
      lastMessage?.content ?? lastMessage?.kwargs?.content ?? ""

    if (finalContent) {
      console.log("[agent-final]", finalContent)
    }

    res.status(200).json({
      response,
      finalContent,
    })
  } catch (error) {
    console.error("Error invoking agent:", error)
    res.status(500).json({
      error: "Failed to invoke agent",
      details: error.message,
    })
  }
})

export default agentRouter
