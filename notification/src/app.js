import express from "express"
import morgan from "morgan"

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

export default app