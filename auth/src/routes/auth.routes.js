import { Router } from "express"
import jwt from "jsonwebtoken"
import passport from "passport"
import userModel from "../models/user.model.js"
import sendAuthNotification from "../config/mq.js"
import jwt from "jsonwebtoken"

const authRouter = Router()

authRouter.get("/health", (req, res) => {
  res.status(200).json({
    message: "Auth service is healthy",
    status: "ok",
  })
})

authRouter.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  }),
)

authRouter.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/",
    session: false,
  }),
  async (req, res) => {
    try {
      const { id, displayName = "", emails = [], photos = [] } = req.user || {}

      if (!id) {
        return res.status(400).json({ error: "Invalid Google profile payload" })
      }

      const email = emails[0]?.value || ""
      const avatar = photos[0]?.value || ""

      await sendAuthNotification({
        userId: user._id,
        acton: "google_login",
        timestamp: new Date().toISOString(),
        email
      })

      let user = await userModel.findOne({ googleId: id })

      if (!user) {
        user = await userModel.create({
          googleId: id,
          name: displayName,
          email,
          avatar,
        })
      }

      // generate JWT token
      const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
        expiresIn: "7d",
      })

      // set token in cookie
      res.cookie("token", token)
      res.redirect("http://localhost:5173") // redirect to frontend after successful login
    } catch (error) {
      console.error("Error during Google authentication callback:", error)
      res.status(500).json({ error: "Authentication failed" })
    }
  },
)

export default authRouter
