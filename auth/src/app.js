import "dotenv/config"
import express from "express"
import morgan from "morgan"
import jwt from "jsonwebtoken"
import passport from "passport"
import { Strategy as GoogleStrategy } from "passport-google-oauth20"
import cookieParser from "cookie-parser"
import authRouter from "./routes/auth.routes.js"

const app = express()

app.use(morgan("dev"))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
app.use(passport.initialize())

app.use("/api/auth", authRouter)

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: "/api/auth/google/callback",
    },
    (accessToken, refreshToken, profile, done) => {
      // Keep req.user as the Google profile object for simpler route handling.
      return done(null, profile)
    },
  ),
)

app.get("/status/healthz", (req, res) => {
  res.status(200).json({
    message: "Auth service is healthy",
    status: "ok",
  })
})

app.get("/status/readyz", (req, res) => {
  res.status(200).json({
    message: "Auth service is ready",
    status: "ready",
  })
})

export default app
