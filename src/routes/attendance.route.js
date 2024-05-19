const express = require("express")
const attendanceController = require("../controllers/attendance.controller.js")

const router = express.Router()

router.post("/today", attendanceController.register)

router.get("/today", attendanceController.profile)

router.get("/week", attendanceController.profile)

router.put("/today", attendanceController.updatePassword)

module.exports = router