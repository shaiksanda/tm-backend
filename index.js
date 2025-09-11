const express = require("express");
require('dotenv').config();

const cors = require('cors');
const userRoutes=require("./routes/user")
const taskRoutes=require("./routes/tasks")
const feedbackRoutes=require("./routes/feedback")
const goalsRoutes=require("./routes/goal")
const app = express();
const cookieParser=require("cookie-parser")

app.use(cors())
app.use(cookieParser())
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const connectToMongoDB=require("./db/db")
connectToMongoDB();

app.use("/users",userRoutes)
app.use("/tasks",taskRoutes)
app.use("/goals",goalsRoutes)
app.use("/feedback",feedbackRoutes)

app.get("/", (req, res) => {
    res.send("Hello, world! ,I successfully deployed my first backend application");
})
const port = process.env.PORT || 6002;

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
