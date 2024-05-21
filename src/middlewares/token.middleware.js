const jsonwebtoken = require("jsonwebtoken")
const responseHandler = require("../handlers/response.handler.js")
const userModel = require("../models/user.model.js")

const decodeToken = (req) => {
    try {
        const bearerHeader = req.headers["authorization"]

        if (bearerHeader) {
            const token = bearerHeader.split(" ")[1]

            return jsonwebtoken.verify(
                token,
                process.env.TOKEN_SECRET
            )
        }

        return false
    } catch {
        return false
    }
}

const auth = async (req, res, next) => {
    const decodedToken = decodeToken(req)

    if (!decodedToken) return responseHandler.unauthorize(res)
    
    const user = await userModel.findById(decodedToken.data)

    if (!user) return responseHandler.unauthorize(res)

    req.user = user

    next()
}

module.exports = { auth, decodeToken }