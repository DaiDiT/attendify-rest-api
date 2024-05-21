const express = require("express")
const attendanceController = require("../controllers/attendance.controller.js")
const tokenMiddleware = require("../middlewares/token.middleware.js")

const router = express.Router()

router.post("/", tokenMiddleware.auth, attendanceController.store)

router.get("/", tokenMiddleware.auth, attendanceController.retrieve)

// router.get("/week", attendanceController.profile)

router.put("/", tokenMiddleware.auth, attendanceController.updateAttendance)

module.exports = router