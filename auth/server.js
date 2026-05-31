import { connectDB } from "./src/config/db";
import app from "./src/app";

connectDB()

app.listen(3000, async () => {
    console.log("Server is running on port 3000");
});