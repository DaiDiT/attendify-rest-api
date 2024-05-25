const attendanceModel = require("../models/attendance.model.js")
const userModel = require("../models/user.model.js")
const responseHandler = require("../handlers/response.handler.js")
const PDFDocument = require('pdfkit')

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
            if (req.query.type === "daily") {
                endOfDay.setDate(startOfDay.getDate() + 1)
            } else if (req.query.type === "weekly") {
                startOfDay.setDate(startOfDay.getDate() - 7)
            } else {
                return responseHandler.badRequest(res, "Wrong query")
            }

            studentIdNumber = req.user.studentIdNumber
        } else if (req.user.role === "Admin") {
            if (req.query.type === "semiannual") {
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
            } else {
                return responseHandler.badRequest(res, "Bad request")
            }

            studentIdNumber = req.query.nis
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

        responseHandler.created(res, {
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
        //if (req.user.role !== "Admin") return responseHandler.badRequest(res, "You're not an Administrator")

        const attendances = await attendanceModel.aggregate([
            {
                $lookup: {
                    from: 'users',
                    localField: 'user',
                    foreignField: '_id',
                    as: 'userDetails'
                }
            },
            { $unwind: "$userDetails" },
            {
                $group: {
                    _id: "$userDetails._id",
                    studentIdNumber: { $first: "$userDetails.studentIdNumber" },
                    fullName: { $first: "$userDetails.fullName" },
                    gradeClass: { $first: "$userDetails.gradeClass" },
                    hadir: { $sum: { $cond: [{ $eq: ["$status", "Hadir"] }, 1, 0] } },
                    izin: { $sum: { $cond: [{ $eq: ["$status", "Izin"] }, 1, 0] } },
                    sakit: { $sum: { $cond: [{ $eq: ["$status", "Sakit"] }, 1, 0] } },
                    alfa: { $sum: { $cond: [{ $eq: ["$status", "Alfa"] }, 1, 0] } }
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
        }));

        // Buat dokumen PDF
        const doc = new PDFDocument();
        let filename = 'rekap-absensi.pdf';
        filename = encodeURIComponent(filename);

        // Set response headers
        res.setHeader('Content-disposition', 'attachment; filename="' + filename + '"');
        res.setHeader('Content-type', 'application/pdf');

        // Pipe the PDF into the response
        doc.pipe(res);

        // Judul
        doc.fontSize(14).text('Rekap Absensi', { align: 'center' });

        // Tambah space
        doc.moveDown();

        // Buat tabel header
        doc.fontSize(10);

        const tableTop = 120;

        doc.text('No', 50, tableTop);
        doc.text('NIS', 80, tableTop);
        doc.text('Nama Lengkap', 150, tableTop);
        doc.text('Kelas', 300, tableTop);
        doc.text('Status Kehadiran', 370, tableTop);

        const statusTop = tableTop + 12;

        doc.text('Hadir', 370, statusTop);
        doc.text('Izin', 420, statusTop);
        doc.text('Sakit', 470, statusTop);
        doc.text('Alfa', 520, statusTop);

        // Garis bawah header
        doc.moveTo(50, tableTop + 25).lineTo(570, tableTop + 25).stroke();

        // Isi tabel
        let y = tableTop + 30;
        result.forEach(item => {
            doc.text(item.No, 50, y);
            doc.text(item.studentIdNumber, 80, y);
            doc.text(item.fullName, 150, y);
            doc.text(item.gradeClass, 300, y);
            doc.text(item.hadir, 370, y);
            doc.text(item.izin, 420, y);
            doc.text(item.sakit, 470, y);
            doc.text(item.alfa, 520, y);
            y += 20;
        });

        // Finalize the PDF and end the stream
        doc.end();
    } catch {
        responseHandler.error(res)
    }
}

module.exports = { store, retrieve, updateAttendance, storeAbsence, getDocument}