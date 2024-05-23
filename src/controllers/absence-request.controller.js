const absenceRequestModel = require("../models/absence-request.model.js")
const attendanceModel = require("../models/attendance.model.js")
const responseHandler = require("../handlers/response.handler.js")

const store = async (req, res) => {
    try {
        if (req.user.role !== "Student") return responseHandler.badRequest(res, "You're not a Student")

        const absenceRequest = new absenceRequestModel()
        absenceRequest.user = req.user._id
        absenceRequest.reason = req.body.reason
        absenceRequest.detail = req.body.detail
        absenceRequest.intendedDate = req.body.date

        await absenceRequest.save()

        responseHandler.created(res, {
            ...absenceRequest._doc
        })
    } catch {
        responseHandler.error(res)
    }
}

const retrieve = async (req, res) => {
    try {
        let absenceRequest

        if (req.user.role === "Student") {
            absenceRequest = await absenceRequestModel.find({ user: req.user._id }).sort({ createdAt: 0 })
        } else if (req.user.role === "Admin" && req.query.status) {
            const date = Date.now()
            const startOfDay = new Date(date)
            startOfDay.setHours(0, 0, 0, 0)
            const endOfDay = new Date(startOfDay)
            endOfDay.setDate(startOfDay.getDate() + 1)

            absenceRequest = await absenceRequestModel.find({
                intendedDate: {
                    $gte: startOfDay,
                    $lt: endOfDay
                },
                status: req.query.status
            })
        } else {
            return responseHandler.badRequest(res, "Bad request")
        }

        responseHandler.ok(res, absenceRequest)
    } catch (error) {
        responseHandler.error(res, error)
    }
}

const updateStatus = async (req, res) => {
    try {
        if (req.user.role !== "Admin") return responseHandler.badRequest(res, "You're not an Administrator")

        const absenceRequest = await absenceRequestModel.findById(req.body.requestId)
        absenceRequest.setStatus(req.body.status)

        await absenceRequest.save()

        const attendance = new attendanceModel()
        attendance.user = absenceRequest.user
        if (req.body.status === "Diterima") {
            attendance.status = absenceRequest.reason
        }
        
        await attendance.save()

        responseHandler.created(res, {
            ...absenceRequest._doc,
        })
    } catch {
        responseHandler.error(res)
    }
}

module.exports = { store, retrieve, updateStatus }