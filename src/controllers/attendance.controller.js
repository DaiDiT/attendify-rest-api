const attendanceModel = require("../models/attendance.model.js")
const responseHandler = require("../handlers/response.handler.js")

const store = async (req, res) => {
    try {
        if (req.user.role !== "Student") return responseHandler.badRequest(res, "You're not a Student")

        const attendance = new attendanceModel()
        attendance.user = req.user._id
        attendance.entryDate = Date.now()
        attendance.status = "Hadir"

        await attendance.save()

        responseHandler.created(res, {
            ...attendance._doc
        })
    } catch(err) {
        console.log(err)
        responseHandler.error(res)
    }
}

const retrieve = async (req, res) => {
    try {
        const date = Date.now()
        const startOfDay = new Date(date)
        startOfDay.setHours(0, 0, 0, 0)
        const endOfDay = new Date(startOfDay)
        endOfDay.setDate(startOfDay.getDate() + 1)

        const attendance = await attendanceModel.findOne({
            user: req.user._id,
            entryDate: {
                $gte: startOfDay,
                $lt: endOfDay
            }
        })

        if (!attendance) return responseHandle.badRequest(res, "Belum melakukan absensi")

        responseHandler.ok(res, {
            ...attendance._doc
        })
    } catch(err) {
        console.log(err)
        responseHandler.error(res)
    }
}

const updateAttendance = async (req, res) => {
    try {
        if (req.user.role !== "Student") return responseHandler.badRequest(res, "You're not a Student")

        const attendance = await attendanceModel.findById(req.user._id)
        attendance.setExitDate(Date.now())

        await attendance.save()

        responseHandler.created(res, {
            ...attendance._doc,
        })
    } catch {
        responseHandler.error(res)
    }
}

module.exports = { store, retrieve, updateAttendance}