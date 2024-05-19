const mongoose = require("mongoose")
const modelOptions = require("./model.options.js")

const absenceRequestSchema = new mongoose.Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    reason: {
        type: String,
        enum: ["Izin", "Sakit"],
        required: true
    },
    detail: {
        type: String,
        required: true
    },
    intendedDate: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ["Ditinjau", "Ditolak", "Diterima"],
        default: "Ditinjau"
    }
}, modelOptions)

absenceRequestSchema.methods.setStatus = function (status) {
    this.status = status
}

const absenceRequestModel = mongoose.model("AbsenceRequest", absenceRequestSchema)

module.exports = absenceRequestModel