const jsonwebtoken = require("jsonwebtoken")
const userModel = require("../models/user.model.js")
const responseHandler = require("../handlers/response.handler.js")
const tokenMiddleware = require("../middlewares/token.middleware.js")

const register = async (req, res) => {
    try {
        const checkUser = await userModel.findOne({ email: req.body.email })
    
        if (checkUser) return responseHandler.badRequest(res, "This email is already used")
        
        const user = new userModel()
        
        if (!req.body.role) {
            const checkStudent = await userModel.findOne({ studentIdNumber: req.body.studentIdNumber })

            if (checkStudent) return responseHandler.badRequest(res, "This Id Number is already registered")

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
    
        responseHandler.ok(res, {...user._doc})
    } catch {
        responseHandler.error(res)
    }
}

const updatePassword = async (req, res) => {
    try {
        const { password, newPassword } = req.body
    
        const user = await userModel.findById(req.user._id).select("email password salt")
    
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
    
        if (!user) return responseHandler.badRequest(res, "User didn't exist")
    
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
        
        let query = req.query
        query["role"] = "Student"

        const students = await userModel.find(query).select("studentIdNumber fullName gradeClass year").sort({ studentIdNumber: 1 })

        responseHandler.ok(res, students)
    } catch {
        responseHandler.error(res)
    }
}

const promotion = async (req, res) => {
    try {
        if (req.user.role !== "Admin") return responseHandler.badRequest(res, "You're not an Administrator")
        
        const date = new Date()

        if (date.getMonth() <= 5) return responseHandler.badRequest(res, "Wrong time to promote students")
                
        const year = date.getFullYear().toString()

        const gradeMap = {
            "X ": "XI ",
            "XI ": "XII ",
            "10 ": "11 ",
            "11 ": "12 "
        }

        const studentsToPromote = await userModel.find({ gradeClass: { $regex: /X |XI |10 |11 / } })
        
        const updatePromises = studentsToPromote.map(student => {
            if (student.year === year) return responseHandler.badRequest(res, "Students has already promoted")
                
            const newGradeClass = student.gradeClass.replace(/X |XI |10 |11 /, match => gradeMap[match])
            return userModel.updateOne(
                { _id: student._id }, 
                { $set: {
                    year: year,
                    gradeClass: newGradeClass
                }
            })
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
            
        const date = new Date()
        
        if (date.getMonth() <= 5) return responseHandler.badRequest(res, "Wrong time to promote students")
        
        const year = (date.getFullYear() - 1).toString()

        await userModel.deleteMany({ year: year, gradeClass: { $regex: /XII |12 / } });

        responseHandler.ok(res, {"message": "Students deleted"})
    } catch {
        responseHandler.error(res)
    }
}

const checkToken = async (req, res) => {
    try {
        const decodedToken = tokenMiddleware.decodeToken(req)

        if (!decodedToken) return responseHandler.ok(res, {"token": "Invalid"})
        
        const token = jsonwebtoken.sign(
            { data: decodedToken.data },
            process.env.TOKEN_SECRET,
            { expiresIn: "24h" }
        )

        responseHandler.ok(res, {token})
    } catch {
        responseHandler.error(res)
    }
}

module.exports = { register, profile, checkToken, updatePassword, login, getStudents, promotion, graduation }