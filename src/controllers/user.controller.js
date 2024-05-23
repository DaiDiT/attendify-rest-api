const jsonwebtoken = require("jsonwebtoken")
const userModel = require("../models/user.model.js")
const responseHandler = require("../handlers/response.handler.js")

const register = async (req, res) => {
    try {
        const checkUser = await userModel.findOne({ email: req.body.email })
    
        if (checkUser) return responseHandler.badRequest(res, "email is already used")
    
        const user = new userModel()
        
        if (!req.body.role) {
            user.studentIdNumber = req.body.studentIdNumber
            user.fullName = req.body.fullName
            user.gender = req.body.gender
            user.year = req.body.year
            user.gradeClass = req.body.gradeClass
        } else {
            user.role = req.body.role
        }
        user.email = req.body.email
        user.setPassword(req.body.password)
        
        await user.save()

        user.password = undefined
        user.salt = undefined

        responseHandler.created(res, {...user._doc})
    } catch {
        responseHandler.error(res)
    }
}

const profile = async (req, res) => {
    try {
        const user = await userModel.findById(req.user._id)

        user.password = undefined
        user.salt = undefined
    
        responseHandler.ok(res, {...user._doc})
    } catch {
        responseHandler.error(res)
    }
}

const updatePassword = async (req, res) => {
    try {
        const { password, newPassword } = req.body
    
        const user = await userModel.findById(req.user._id)
    
        if (!user) return responseHandler.notFound(res)
    
        if (!user.validPassword(password)) return responseHandler.badRequest(res, "Wrong password")
    
        user.setPassword(newPassword)

        await user.save()
    
        responseHandler.ok(res, {"message": "Password updated!"})
    } catch {
        responseHandler.error(res)
    }
}

const login = async (req, res) => {
    try {
        const { email, password } = req.body
    
        const user = await userModel.findOne({ email }).select("email password salt id role")
    
        if (!user) return responseHandler.badRequest(res, "User not exist")
    
        if (!user.validPassword(password)) return responseHandler.badRequest(res, "Wrong password")
    
        const token = jsonwebtoken.sign(
            { data: user.id },
            process.env.TOKEN_SECRET,
            { expiresIn: "24h" }
        )
    
        user.password = undefined
        user.salt = undefined
    
        responseHandler.ok(res, {
            token,
            ...user._doc,
        })
    } catch {
        responseHandler.error(res)
    }
}

const getStudents = async (req, res) => {
    try {
        if (req.user.role !== "Admin") return responseHandler.badRequest(res, "You're not an Administrator")
        
        const students = await userModel.find().select("studentIdNumber fullName gradeClass").sort({ studentIdNumber: 1 })

        responseHandler.ok(res, {
            students
        })
    } catch {
        responseHandler.error(res)
    }
}

const promotion = async (req, res) => {
    try {
        if (req.user.role !== "Admin") return responseHandler.badRequest(res, "You're not an Administrator")
        
        const date = Date.now
                
        const year = date.getFullYear().toString()

        const gradeMap = {
            "X": "XI",
            "XI": "XII",
            "10": "11",
            "11": "12"
        }

        const studentsToPromote = await userModel.find({ class: { $in: ["X", "XI"] } })

        const updatePromises = studentsToPromote.map(student => {
            const newGradeClass = student.gradeClass.replace(/X|XI|10|11/, match => gradeMap[match])
            return userModel.updateOne({ _id: student._id }, { year: year }, { gradeClass: newGradeClass })
        })

        await Promise.all(updatePromises)

        responseHandler.ok(res, {"message": "Students promoted"})
    } catch {
        responseHandler.error(res)
    }
}

const graduation = async (req, res) => {
    try {
        if (req.user.role !== "Admin") return responseHandler.badRequest(res, "You're not an Administrator")
            
        const date = Date.now
                
        const year = (date.getFullYear() - 1).toString()

        const studentsToDelete = await userModel.find({ year: 2019 });

        for (const student of studentsToDelete) {
            await student.remove();
        }

        responseHandler.ok(res, {"message": "Students deleted"})
    } catch {
        responseHandler.error(res)
    }
}

module.exports = { register, profile, updatePassword, login, getStudents, promotion, graduation }