const attendanceModel = require("../models/attendance.model.js")
const userModel = require("../models/user.model.js")
const responseHandler = require("../handlers/response.handler.js")
const ExcelJS = require('exceljs')

const store = async (req, res) => {
    try {
        if (req.user.role !== "Student") return responseHandler.badRequest(res, "You're not a Student")
        
        const date = Date.now()
        const startOfDay = new Date(date)
        startOfDay.setHours(0, 0, 0, 0)
        const endOfDay = new Date(startOfDay)
        endOfDay.setDate(startOfDay.getDate() + 1)

        const attendance = await attendanceModel.findOne({
            user: req.user._id,
            createdAt: {
                $gte: startOfDay,
                $lt: endOfDay
            }
        })

        if (attendance) return responseHandler.badRequest(res, "You have filled the attendance")

        const newAttendance = new attendanceModel()
        newAttendance.user = req.user._id
        newAttendance.entryDate = Date.now()
        newAttendance.status = "Hadir"

        await newAttendance.save()

        responseHandler.created(res, {
            ...newAttendance._doc
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
            studentIdNumber = req.user.studentIdNumber
        } else if (req.query.nis) {
            studentIdNumber = req.query.nis
        }

        if (req.query.type === "daily") {
            endOfDay.setDate(startOfDay.getDate() + 1)
        } else if (req.query.type === "weekly") {
            startOfDay.setDate(startOfDay.getDate() - 7)
        } else if (req.query.type === "semiannual") {
            if (startOfDay.getMonth() >= 6) {
                startOfDay.setMonth(5)
                startOfDay.setDate(31)
                endOfDay.setMonth(12)
                endOfDay.setDate(31)
            } else {
                startOfDay.setMonth(0)
                startOfDay.setDate(1)
                endOfDay.setMonth(5)
                endOfDay.setDate(31)
            }
        }

        const student = await userModel.findOne({ studentIdNumber: studentIdNumber })
        const attendance = await attendanceModel.find({
            user: student._id,
            createdAt: {
                $gte: startOfDay,
                $lt: endOfDay
            }
        })

        responseHandler.ok(res, attendance)
    } catch {
        responseHandler.error(res)
    }
}

const updateAttendance = async (req, res) => {
    try {
        if (req.user.role !== "Student") return responseHandler.badRequest(res, "You're not a Student")

        const date = Date.now()
        const startOfDay = new Date(date)
        startOfDay.setHours(0, 0, 0, 0)
        const endOfDay = new Date(startOfDay)
        endOfDay.setDate(startOfDay.getDate() + 1)
    
        const attendance = await attendanceModel.findOne({
            user: req.user._id,
            createdAt: {
                $gte: startOfDay,
                $lt: endOfDay
            }
        })

        if (!attendance) return responseHandler.badRequest(res, "You haven't filled out your attendance yet")

        if (attendance.exitDate) return responseHandler.badRequest(res, "You have filled the attendance")

        attendance.setExitDate(Date.now())

        await attendance.save()

        responseHandler.ok(res, {
            ...attendance._doc,
        })
    } catch {
        responseHandler.error(res)
    }
}

const storeAbsence = async (req, res) => {
    try {
        if (req.user.role !== "Admin") return responseHandler.badRequest(res, "You're not an Administrator")

        const students = await userModel.find({ role: "Student" })
        
        const date = Date.now()
        const startOfDay = new Date(date)
        startOfDay.setHours(0, 0, 0, 0)
        const endOfDay = new Date(startOfDay)
        endOfDay.setDate(startOfDay.getDate() + 1)

        for (const student of students) {
            const attendance = await attendanceModel.findOne({
                user: student._id,
                createdAt: {
                    $gte: startOfDay,
                    $lt: endOfDay
                }
            })

            if (!attendance) {
                const newAttendance = new attendanceModel()
                newAttendance.user = student._id
                newAttendance.status = "Alfa"
        
                await newAttendance.save()
            }
        }

        responseHandler.created(res, { "message": "Success" })
    } catch {
        responseHandler.error(res)
    }
}

const getDocument = async (req, res) => {
    try {
        if (req.user.role !== "Admin") return responseHandler.badRequest(res, "You're not an Administrator")

        const date = Date.now()
        const startOfDay = new Date(date)
        startOfDay.setHours(0, 0, 0, 0)
        const endOfDay = new Date(startOfDay)
        const year = startOfDay.getFullYear()
        let semester

        if (startOfDay.getMonth() >= 6) {
            semester = 1
            startOfDay.setMonth(5)
            startOfDay.setDate(31)
            endOfDay.setMonth(12)
            endOfDay.setDate(31)
        } else {
            semester = 2
            startOfDay.setMonth(0)
            startOfDay.setDate(1)
            endOfDay.setMonth(5)
            endOfDay.setDate(31)
        }

        const attendances = await userModel.aggregate([
            {
                $match: {
                    role: "Student",
                    createdAt: { $gte: startOfDay, $lt: endOfDay }
                }
            },
            {
                $lookup: {
                    from: 'attendances',
                    localField: '_id',
                    foreignField: 'user',
                    as: 'attendanceDetails'
                }
            },
            {
                $unwind: {
                    path: "$attendanceDetails",
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $group: {
                    _id: "$_id",
                    studentIdNumber: { $first: "$studentIdNumber" },
                    fullName: { $first: "$fullName" },
                    gradeClass: { $first: "$gradeClass" },
                    hadir: { $sum: { $cond: [{ $eq: ["$attendanceDetails.status", "Hadir"] }, 1, 0] } },
                    izin: { $sum: { $cond: [{ $eq: ["$attendanceDetails.status", "Izin"] }, 1, 0] } },
                    sakit: { $sum: { $cond: [{ $eq: ["$attendanceDetails.status", "Sakit"] }, 1, 0] } },
                    alfa: { $sum: { $cond: [{ $eq: ["$attendanceDetails.status", "Alfa"] }, 1, 0] } }
                }
            },
            {
                $sort: { gradeClass: 1, fullName: 1 }
            },
            {
                $project: {
                    _id: 0,
                    studentIdNumber: 1,
                    fullName: 1,
                    gradeClass: 1,
                    hadir: 1,
                    izin: 1,
                    sakit: 1,
                    alfa: 1
                }
            }
        ])

        const result = attendances.map((attendance, index) => ({
            No: index + 1,
            ...attendance
        }))

        const workbook = new ExcelJS.Workbook()
        const worksheet = workbook.addWorksheet('Rekap Absensi')

        worksheet.addRow(["","","","","","","","","Semester", semester])
        worksheet.addRow(["","","","","","","","","Tahun", year])

        worksheet.mergeCells('A4:A5')
        worksheet.mergeCells('B4:B5')
        worksheet.mergeCells('C4:C5')
        worksheet.mergeCells('D4:D5')
        worksheet.mergeCells('E4:H4')

        worksheet.getCell('A4').value = 'No'
        worksheet.getCell('B4').value = 'NIS'
        worksheet.getCell('C4').value = 'Nama Lengkap'
        worksheet.getCell('D4').value = 'Kelas'
        worksheet.getCell('E4').value = 'Status Kehadiran'
        worksheet.getCell('E5').value = 'Hadir'
        worksheet.getCell('F5').value = 'Izin'
        worksheet.getCell('G5').value = 'Sakit'
        worksheet.getCell('H5').value = 'Alfa'

        worksheet.getColumn(1).width = 5
        worksheet.getColumn(2).width = 12
        worksheet.getColumn(3).width = 50
        worksheet.getColumn(4).width = 12
        worksheet.getColumn(5).width = 6
        worksheet.getColumn(6).width = 6
        worksheet.getColumn(7).width = 6
        worksheet.getColumn(8).width = 6

        result.forEach((user) => {
            worksheet.addRow(Object.values(user))
        })

        worksheet.getRow(4).font = { bold: true }
        worksheet.getRow(5).font = { bold: true }

        worksheet.eachRow({ includeEmpty: true }, (row, rowNumber) => {
            if (rowNumber >= 4) {
                row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
                    cell.border = {
                        top: { style: 'thin' },
                        left: { style: 'thin' },
                        bottom: { style: 'thin' },
                        right: { style: 'thin' }
                    }
                    if (colNumber >= 5 || rowNumber <= 5) {
                        cell.alignment = {
                            horizontal: 'center',
                            vertical: 'middle'
                        } 
                    }
                })
            }
        })

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        res.setHeader('Content-Disposition', 'attachment; filename=rekap-absensi.xlsx')

        await workbook.xlsx.write(res)
        res.end()
    } catch(err) {
        console.log(err)
        responseHandler.error(res)
    }
}

module.exports = { store, retrieve, updateAttendance, storeAbsence, getDocument}