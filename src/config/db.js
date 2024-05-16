const mongoose = require("mongoose")
mongoose.connect(process.env.MONGODB_URL).then(() => {
    console.log("Mongodb connected");
}).catch((err) => {
    console.log({ err });
    process.exit(1);
});