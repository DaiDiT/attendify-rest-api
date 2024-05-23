const express = require("express")
const attendanceController = require("../controllers/attendance.controller.js")
const tokenMiddleware = require("../middlewares/token.middleware.js")

const router = express.Router()

router.post("/", tokenMiddleware.auth, attendanceController.store)

router.get("/", tokenMiddleware.auth, attendanceController.retrieve)

router.put("/", tokenMiddleware.auth, attendanceController.updateAttendance)

router.post("/absence", attendanceController.storeAbsence)

module.exports = router