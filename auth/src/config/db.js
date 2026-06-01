import mongoose from "mongoose";

export const connectDB = async () => {
  const uri = process.env.AUTH_MONGODB_URI || "mongodb://localhost:27017/buildex-auth"
  try {
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to MongoDB");    
    } catch (error) {
    console.error("Error connecting to MongoDB:", error);
    process.exit(1);
    }
};

