import app from "./app.js"
import "dotenv/config"

app.app.listen(4000, () => {
  console.log("Notification service is running on port 4000")
})