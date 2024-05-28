const responseWithData = (res, statusCode, data) => res.status(statusCode).json(data)

const error = (res) => responseWithData(res, 500, {
    status: "Failed",
    message: "Oops! Something wrong!"
})

const badRequest = (res, message) => responseWithData(res, 400, {
    status: "Failed",
    message
})

const ok = (res, data) => responseWithData(res, 200, {
    status: "Success",
    data
})

const created = (res, data) => responseWithData(res, 201, {
    status: "Success",
    data
})

const unauthorize = (res) => responseWithData(res, 401, {
    status: "Failed",
    message: "Unauthorized"
})

const notFound = (res) => responseWithData(res, 404, {
    status: "Failed",
    message: "Resource not found"
})

module.exports = {
    error,
    badRequest,
    ok,
    created,
    unauthorize,
    notFound
}