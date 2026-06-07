import express from "express"
import { getCurrentUser, updateUserLocation, toggleOnlineStatus } from "../controllers/user.controllers.js"
import isAuth from "../middlewares/isAuth.js"


const userRouter = express.Router()

userRouter.get("/current", isAuth, getCurrentUser)
userRouter.post('/update-location', isAuth, updateUserLocation)
userRouter.post('/toggle-online', isAuth, toggleOnlineStatus)

export default userRouter