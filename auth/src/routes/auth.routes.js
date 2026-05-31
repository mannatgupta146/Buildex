import {Router} from "express";
import passport from "passport";
import userModel from "../models/user.model.js";

const authRouter = Router();

authRouter.get("/health", (req, res) => {
    res.status(200).json({
        message: 'Auth service is healthy',
        status: 'ok'
    });
});

authRouter.post("/google", passport.authenticate('google', { scope: ['profile', 'email'] }))

authRouter.get("/google/callback", passport.authenticate('google', { failureRedirect: '/' }), (req, res) => {
    try{
        const { id, displayName, emails, photos } = req.user;
        let user = await userModel.findOne({ googleId: id });

        if(!user) {
            user = await userModel.create({
                googleId: id,
                name: displayName,
                email: emails[0].value,
                avatar: photos[0].value
            });
            await user.save();
        }

        // generate JWT token
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        // set token in cookie
        res.cookie('token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
        res.redirect('/'); // redirect to frontend after successful login
    } catch (error) {
        console.error("Error during Google authentication callback:", error);
        res.status(500).json({ error: "Authentication failed" });
    }
});

export default authRouter;