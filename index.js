const express = require("express")
const bodyParser = require("body-parser")
require("dotenv").config()

const app = express()
const port = 3000

const db = require("./src/config/db.js")

app.use(bodyParser.urlencoded({extended: true}))
app.use(bodyParser.json())

const routes = require("./src/routes/index.route.js")

app.use("/api/v1", routes)

app.listen(port, () => {
    console.log(`Server started on ${port}`)
})

module.exports = app