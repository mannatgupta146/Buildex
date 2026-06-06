import mongoose from "mongoose"

export const connectDB = async () => {
  const uri =
    process.env.AUTH_MONGODB_URI || "mongodb://localhost:27017/buildex/sandbox"
  try {
    await mongoose.connect(uri)
    console.log("Connected to MongoDB")
  } catch (error) {
    console.error("Error connecting to MongoDB:", error)
  }
}
