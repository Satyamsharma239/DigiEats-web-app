import express from "express"
import { googleAuth, resetPassword, sendOtp, signIn, signOut, signUp, verifyOtp, sendMobileOtp, verifyMobileOtp } from "../controllers/auth.controllers.js"

const authRouter = express.Router()

authRouter.post("/signup", signUp)
authRouter.post("/signin", signIn)
authRouter.get("/signout", signOut)
authRouter.post("/send-otp", sendOtp)
authRouter.post("/verify-otp", verifyOtp)
authRouter.post("/reset-password", resetPassword)
authRouter.post("/google-auth", googleAuth)

// Mobile OTP Routes
authRouter.post("/mobile/send-otp", sendMobileOtp)
authRouter.post("/mobile/verify-otp", verifyMobileOtp)

export default authRouter