import { Router } from "express"
import { registerHandler, refreshHandler, loginHandler, logoutHandler, wrappedLoginHandler, forceLogoutHandler } from "../controllers/auth.controller"
import { protect } from "../middleware/auth.middleware"

const router = Router()
router.post('/register', registerHandler)
router.post('/login', loginHandler)
router.post('/login-wrap', wrappedLoginHandler)
router.post('/refresh', refreshHandler)
router.post('/logout', logoutHandler)
router.post('/force-logout', protect, forceLogoutHandler)

export default router