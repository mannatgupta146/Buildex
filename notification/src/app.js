import express from "express"
import morgan from "morgan"
import { sendEmail } from "./email.js"
import channel from "./mq.js"

const app = express()

app.use(morgan("dev"))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

app.get("/", (req, res) => {
  res.status(200).json({
    message: "Notification service is running",
    status: "ok",
  })
})

app.get("/health", (req, res) => {
  res.status(200).json({
    message: "Notification service is healthy",
    status: "ok",
  })
})

app.get("/ready", (req, res) => {
  res.status(200).json({
    message: "Notification service is ready",
    status: "ready",
  })
})

channel.consume("auth_notification_queue", async (msg) => {
  if (msg !== null) {
    const messageContent = msg.content.toString()
    console.log("Received message:", messageContent)
    const { email, action, timestamp } = JSON.parse(messageContent)

    try{
      const { userId, action, timestamp, email } = JSON.parse(messageContent)
      
      const subect = `New login notification for user ${userId}`
      const text = `User ${userId} logged in at ${timestamp} with action: ${action}`
      const html = `<p>User <strong>${userId}</strong> logged in at <em>${timestamp}</em> with action: <span style="color:blue;">${action}</span></p>`

      await sendEmail(email, subect, text, html)
      
      channel.ack(msg) 
    } catch (error) {
      console.error("Error processing message: ", error)
      channel.nack(msg, false, false)
    }
  } else {
    console.log("Received null message")
  }
})

export default app