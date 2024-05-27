const absenceRequestModel = require("../models/absence-request.model.js")
const attendanceModel = require("../models/attendance.model.js")
const responseHandler = require("../handlers/response.handler.js")

const store = async (req, res) => {
    try {
        if (req.user.role !== "Student") return responseHandler.badRequest(res, "You're not a Student")
        
        const intendedDate = new Date(req.body.date)
        const absenceRequest = await absenceRequestModel.findOne({
            user: req.user._id,
            intendedDate: intendedDate
        })

        if (absenceRequest) return responseHandler.badRequest(res, "You have already made this request")

        const newAbsenceRequest = new absenceRequestModel()
        newAbsenceRequest.user = req.user._id
        newAbsenceRequest.reason = req.body.reason
        newAbsenceRequest.detail = req.body.detail
        newAbsenceRequest.intendedDate = intendedDate

        await newAbsenceRequest.save()

        responseHandler.created(res, {
            ...newAbsenceRequest._doc
        })
    } catch {
        responseHandler.error(res)
    }
}

const retrieve = async (req, res) => {
    try {
        let absenceRequest

        if (req.user.role === "Student") {
            absenceRequest = await absenceRequestModel.find({ user: req.user._id })
        } else if (req.user.role === "Admin") {
            const date = Date.now()
            const startOfDay = new Date(date)
            startOfDay.setHours(0, 0, 0, 0)
            const endOfDay = new Date(startOfDay)
            endOfDay.setDate(startOfDay.getDate() + 1)

            let query = req.query
            query["intendedDate"] = { $gte: startOfDay, $lt: endOfDay }
            
            absenceRequest = await absenceRequestModel.find(query)
        }

        responseHandler.ok(res, absenceRequest)
    } catch {
        responseHandler.error(res)
    }
}

const updateStatus = async (req, res) => {
    try {
        if (req.user.role !== "Admin") return responseHandler.badRequest(res, "You're not an Administrator")

        const absenceRequest = await absenceRequestModel.findById(req.body.requestId)

        if (!absenceRequest) return responseHandler.badRequest(res, "No request have made")

        if (absenceRequest.status !== "Ditinjau") return responseHandler.badRequest(res, "You can't change the request")

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

const cancelRequest = async (req, res) => {
    try {
        if (req.user.role !== "Student") return responseHandler.badRequest(res, "You're not a Student")

        const absenceRequest = await absenceRequestModel.findById(req.body.requestId)

        if (!absenceRequest) return responseHandler.badRequest(res, "No request have made")
            
        if (absenceRequest.status === "Ditinjau") {
            await absenceRequestModel.deleteOne({ _id: absenceRequest._id })
        } else {
            return responseHandler.badRequest(res, "You can no longer delete this request")
        }

        responseHandler.ok(res, {
            ...absenceRequest._doc,
        })
    } catch {
        responseHandler.error(res)
    }
}

module.exports = { store, retrieve, updateStatus, cancelRequest }