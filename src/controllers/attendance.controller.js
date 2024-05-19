const attendanceModel = require("../models/attendance.model.js")
const responseHandler = require("../handlers/response.handler.js")

const createAttendance = async (req, res) => {
    try {
        const attendance = new attendanceModel()
        attendance.user = req.body.userId
        attendance.entryDate = Date.now

        await attendance.save()

        responseHandler.created(res, {
            ...attendance._doc,
          })
    } catch {
        responseHandler.error(res);
    }
}

const updateAttendance = async (req, res) => {
    try {
        const attendance = await attendanceModel.findById(req.body.id)
        attendance.setExitDate(Date.now)

    } catch {

    }

    
}

module.exports = { createAttendance, updateAttendance}