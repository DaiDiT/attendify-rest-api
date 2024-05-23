const mongoose = require("mongoose")
const modelOptions = require("./model.options.js")

const attendanceSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    entryDate: {
        type: Date,
        required: false
    },
    exitDate: {
        type: Date,
        required: false
    },
    status: {
        type: String,
        enum: ["Hadir", "Izin", "Sakit", "Alfa"],
        default: "Alfa"
    }
}, modelOptions)

attendanceSchema.methods.setExitDate = function (date) {
    this.exitDate = date
}

const attendanceModel = mongoose.model("Attendance", attendanceSchema)

module.exports = attendanceModel