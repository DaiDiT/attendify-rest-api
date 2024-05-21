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

const logout = async (req, res) => {
    // Hapus token
    res.send("Berhasil keluar")
}

module.exports = { register, profile, updatePassword, login, logout }