const userModel = require("../models/user.model.js")
const responseHandler = require("../handlers/response.handler.js")

const register = async (req, res) => {
    try {
        const checkUser = await userModel.findOne({ email: req.body.email });
    
        if (checkUser) return responseHandler.badRequest(res, "email already used");
    
        const user = new userModel();
        
        if (!req.body.role) {
            user.studentIdNumber = req.body.studentIdNumber
            user.fullName = req.body.fullName
            user.gender = req.body.gender
            user.gradeClass = req.body.gradeClass
        } else {
            user.role = req.body.role
        }
        user.email = req.body.email;
        user.setPassword(req.body.password);
        
        await user.save();

        res.send("Berhasil mendaftar")
    } catch {
        responseHandler.error(res);
    }
}

const login = async (req, res) => {
    res.send("Berhasil masuk")
}

const logout = async (req, res) => {
    res.send("Berhasil keluar")
}

module.exports = { register, login, logout }