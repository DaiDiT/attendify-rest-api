const mongoose = require("mongoose")
const modelOptions = require("./model.options.js")
const crypto = require("crypto")

const userSchema = new mongoose.Schema({
    studentIdNumber: {
        type: String,
        required: false,
        unique: true
    },
    fullName: {
        type: String,
        required: false
    },
    gender: {
        type: String,
        enum: ["Laki-laki", "Perempuan"],
        required: false
    },
    year: {
        type: String,
        required: true
    },
    gradeClass: {
        type: String,
        required: false
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
        select: false
    },
    role: {
        type: String,
        enum: ["Student", "Admin"],
        default: "Student"
    },
    salt: {
        type: String,
        required: true,
        select: false
    }
}, modelOptions)

userSchema.methods.setPassword = function (password) {
    this.salt = crypto.randomBytes(16).toString("hex")

    this.password = crypto.pbkdf2Sync(
        password,
        this.salt,
        1000,
        64,
        "sha512"
    ).toString("hex")
}

userSchema.methods.validPassword = function (password) {
    const hash = crypto.pbkdf2Sync(
        password,
        this.salt,
        1000,
        64,
        "sha512"
    ).toString("hex")

    return this.password === hash
}

userSchema.methods.updateGrade = function (date) {
    this.year = date.getFullYear()

    const gradeMap = {
        "X": "XI",
        "XI": "XII"
    }

    this.gradeClass = this.gradeClass.replace(
        /(X|XI)/,
        match => gradeMap[match]
    )
}

const userModel = mongoose.model("User", userSchema)

module.exports = userModel