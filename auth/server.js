import { connectDB } from "./src/config/db.js"
import app from "./src/app.js"

connectDB()

app.listen(3000, async () => {
  console.log("Server is running on port 3000")
})
