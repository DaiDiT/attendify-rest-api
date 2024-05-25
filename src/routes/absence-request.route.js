const express = require("express")
const absenceRequestController = require("../controllers/absence-request.controller.js")
const tokenMiddleware = require("../middlewares/token.middleware.js")

const router = express.Router()

router.post("/", tokenMiddleware.auth, absenceRequestController.store)

router.get("/", tokenMiddleware.auth, absenceRequestController.retrieve)

router.put("/", tokenMiddleware.auth, absenceRequestController.updateStatus)

router.delete("/", tokenMiddleware.auth, absenceRequestController.cancelRequest)

module.exports = router