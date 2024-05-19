const express = require("express")
const userController = require("../controllers/user.controller.js")

const router = express.Router()

router.post("/register", userController.register)

router.get("/", userController.profile)

router.put("/", userController.updatePassword)

router.post("/login", userController.login)

router.post("/logout", userController.logout)

module.exports = router