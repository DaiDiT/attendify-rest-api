const express = require("express")
const userRoute = require("./user.route.js")
const attendanceRoute = require("./attendance.route.js")

const router = express.Router()

router.use("/user", userRoute)
router.use("/attendance", attendanceRoute)

module.exports = router