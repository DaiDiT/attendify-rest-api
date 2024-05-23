const express = require("express")
const userRoute = require("./user.route.js")
const attendanceRoute = require("./attendance.route.js")
const absenceRequestRoute = require("./absence-request.route.js")

const router = express.Router()

router.use("/user", userRoute)
router.use("/attendance", attendanceRoute)
router.use("/absence", absenceRequestRoute)

module.exports = router