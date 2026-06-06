import jwt from "jsonwebtoken"

export function verifytoken(token) {
    try {
        return jwt.verify(token, process.env.JWT_SECRET)
    } catch (error) {
        console.error("Error verifying token: ", error)
        return null
    }
}