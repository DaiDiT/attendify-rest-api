const express = require("express")
const userController = require("../controllers/user.controller.js")
const tokenMiddleware = require("../middlewares/token.middleware.js")

const router = express.Router()

router.post("/register", userController.register)

router.post("/login", userController.login)

router.get("/", tokenMiddleware.auth, userController.profile)

router.put("/", tokenMiddleware.auth, userController.updatePassword)

router.post("/logout", tokenMiddleware.auth, userController.logout)

module.exports = router