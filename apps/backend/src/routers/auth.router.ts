import { Router } from "express"
import { registerHandler, refreshHandler, loginHandler, logoutHandler } from "../controllers/auth.controller"

const router = Router()
router.post('/register', registerHandler)
router.post('/login', loginHandler)
router.post('/refresh', refreshHandler)
router.post('/logout', logoutHandler)

export default router