const attendanceModel = require("../models/attendance.model.js")
const userModel = require("../models/user.model.js")
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
    } catch {
        responseHandler.error(res)
    }
}

const retrieve = async (req, res) => {
    try {
        const date = Date.now()
        const startOfDay = new Date(date)
        startOfDay.setHours(0, 0, 0, 0)
        const endOfDay = new Date(startOfDay)
        let studentIdNumber

        if (req.user.role === "Student") {
            if (req.query.type === "daily") {
                endOfDay.setDate(startOfDay.getDate() + 1)
            } else if (req.query.type === "weekly") {
                startOfDay.setDate(startOfDay.getDate() - 7)
            } else {
                return responseHandler.badRequest(res, "Bad request")
            }

            studentIdNumber = req.user.studentIdNumber
        } else if (req.user.role === "Admin") {
            if (req.query.type === "semiannual") {
                endOfDay.setHours(23, 59, 59, 999)
                if (startOfDay.getMonth() >= 6) {
                    startOfDay.setMonth(6).setDate(1)
                    endOfDay.setMonth(12).setDate(31)
                } else {
                    startOfDay.setMonth(0).setDate(1)
                    endOfDay.setMonth(5).setDate(30)
                }
            } else {
                return responseHandler.badRequest(res, "Bad request")
            }

            studentIdNumber = req.query.nis
        }

        const attendance = await attendanceModel.find({
            createdAt: {
                $gte: startOfDay,
                $lt: endOfDay
            }
        })
        .populate({
            path: 'user',
            match: { studentIdNumber: studentIdNumber }
        })
        .exec()

        responseHandler.ok(res, attendance)
    } catch (error) {
        responseHandler.error(res, error)
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

const storeAbsence = async (req, res) => {
    try {
        const students = await userModel.find({ role: "Student" })
        
        const date = Date.now()
        const startOfDay = new Date(date)
        startOfDay.setHours(0, 0, 0, 0)
        const endOfDay = new Date(startOfDay)
        endOfDay.setDate(startOfDay.getDate() + 1)

        for (const student of students) {
            const attendance = await attendanceModel.find({
                user: student._id,
                createdAt: {
                    $gte: startOfDay,
                    $lt: endOfDay
                }
            })

            if (!attendance) {
                const newAttendance = new attendanceModel()
                newAttendance.user = student._id
        
                await newAttendance.save()
            }
        }

        responseHandler.created(res, { "message": "Success" })
    } catch {
        responseHandler.error(res)
    }
}

module.exports = { store, retrieve, updateAttendance, storeAbsence}