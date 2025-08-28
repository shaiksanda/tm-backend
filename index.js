const express = require("express");
require('dotenv').config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("./models/users");
const Task = require("./models/tasks");
const Goal = require("./models/goals")
const Feedback = require("./models/feedback")

const nodemailer = require("nodemailer")

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD
    }
})
const cors = require('cors');

const app = express();
const allowedOrigins = process.env.ALLOWED_ORIGINS.split(",");
app.use(
    cors({
        origin: function (origin, callback) {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error("Not allowed by CORS"));
            }
        },
        credentials: true,
    })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const connectToMongoDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB successfully!');
    } catch (err) {
        console.error('Error connecting to MongoDB:', err);
        process.exit(1);
    }
};
connectToMongoDB();

const sendVerificationEmail = async (email, token) => {
    const verificationLink = `${process.env.BASE_URL}/verify?token=${token}`;
    const mailOptions = {
        from: process.env.EMAIL,
        to: email,
        subject: "Verify Your Email",
        html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <h2 style="color: #4CAF50;">Verify Your Email</h2>
                <p>Hi there,</p>
                <p>Thanks for signing up! Please click the button below to verify your email address:</p>
                <a href="${verificationLink}" 
                   style="
                       display: inline-block;
                       padding: 10px 20px;
                       margin: 10px 0;
                       font-size: 16px;
                       color: white;
                       background-color: #4CAF50;
                       text-decoration: none;
                       border-radius: 5px;
                   ">
                   Verify Email
                </a>
                <p>If the button doesn't work, copy and paste this link into your browser:</p>
                <p>${verificationLink}</p>
                <hr>
                <p style="font-size: 12px; color: #777;">If you did not request this, please ignore this email.</p>
            </div>
        `
    }
    await transporter.sendMail(mailOptions);
};

const generateAndSendOtp = async (email) => {

    const otp = Math.floor(100000 + Math.random() * 900000);
    const user = await User.findOne({ email })
    if (!user) {
        throw new Error("User Not Found")
    }
    encryptedOtp = await bcrypt.hash(otp.toString(), 10)
    user.otp = encryptedOtp
    await user.save()
    const mailOptions = {
        from: process.env.EMAIL,
        to: email,
        subject: "Your OTP Code",
        html: `
            <p>Hi,</p>
            <p><b>${otp}</b> is your verification OTP. Please do not share it with anyone.</p>
            `
    };
    await transporter.sendMail(mailOptions);
}

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];

    if (!authHeader) {
        return res.status(401).json({ err_msg: "Authorization header missing" });
    }

    const jwtToken = authHeader.split(" ")[1];

    if (!jwtToken) {
        return res.status(401).json({ err_msg: "Invalid JWT Token" });
    }

    jwt.verify(jwtToken, process.env.JWT_SECRET, (err, payload) => {
        if (err) {
            return res.status(401).json({ err_msg: "Invalid or expired JWT Token" });
        }

        req.user = { userId: payload.userId, username: payload.username, role: payload.role, isVerified: payload.isVerified, email: payload.email };
        next();
    });
};

app.get("/feedbacks", authenticateToken, async (req, res) => {

    const filter = {}

    const { status, type } = req.query
    if (status) filter.status = status
    if (type) filter.type = type

    try {
        const feedbacks = await Feedback.find(filter).populate("userId", "username").sort({ updatedAt: -1 })
        res.status(200).json({ feedbacks })

    }
    catch (err) {
        res.status(500).json({ err_msg: err.message })
    }
})

app.put('/feedback/:feedbackId', authenticateToken, async (req, res) => {
    const { userId } = req.user
    const { feedbackId } = req.params
    const { type, status, message } = req.body
    const updates = {}
    if (message !== undefined) updates.message = message
    if (type !== undefined) updates.type = type
    if (status !== undefined) updates.status = status

    try {
        const updatedFeedback = await Feedback.findOneAndUpdate({ _id: feedbackId, userId }, updates, { new: true })
        if (!updatedFeedback) {
            return res.status(404).json({ err_msg: "Feedback Not Found or Not Authorized" })
        }
        res.status(200).json({ message: `Feedback Updated Successfully` })

    }
    catch (err) {
        res.status(500).json({ err_msg: err.message })
    }
})

app.post('/feedback', authenticateToken, async (req, res) => {
    const { userId } = req.user
    const { type, message } = req.body

    if (!type || !message) {
        return res.status(400).json({ error: "Type and message are required" });
    }
    const validTypes = ["bug", "suggestion", "feedback"];
    if (!validTypes.includes(type)) {
        return res.status(400).json({ err_msg: "Invalid feedback type" });
    }
    try {
        await Feedback.create({ type, message, userId })
        res.status(200).json({ message: `${type} Added Successfully` })

    }
    catch (err) {
        res.status(500).json({ err_msg: err.message })
    }
})

app.delete("/feedback/:feedbackId", authenticateToken, async (req, res) => {
    const { userId } = req.user
    const { feedbackId } = req.params
    if (!mongoose.Types.ObjectId.isValid(feedbackId)) {
        return res.status(400).json({ error: "Invalid feedback ID" });
    }
    try {
        const deleteFeedback = await Feedback.findOneAndDelete({ _id: feedbackId, userId })
        if (!deleteFeedback) {
            return res.status(404).json({ err_msg: "Feedback Not Found or Not Authorized" })
        }
        res.status(200).json({ message: "Successfully Deleted Your Feedback" })
    }
    catch (err) {
        return res.status(500).json({ err_msg: err.message })
    }
})

app.post("/goal", authenticateToken, async (req, res) => {
    const { userId } = req.user;
    const { title, type, timeframe } = req.body

    try {
        await Goal.create({ title, type, timeframe, userId })
        res.status(200).json({ message: "Goal Added Successfully" })
    }
    catch (error) {
        res.status(500).json({ err_msg: error.message })
    }


})

app.get("/goals", authenticateToken, async (req, res) => {
    const { userId } = req.user;
    const { type, month, year, quarter } = req.query;

    let filter = { userId };

    if (type) {
        filter.type = type;

        if (type === "monthly") {
            if (month) filter["timeframe.month"] = Number(month);
            if (year) filter["timeframe.year"] = Number(year);
        }

        if (type === "quarterly") {
            if (quarter) filter["timeframe.quarter"] = Number(quarter);
            if (year) filter["timeframe.year"] = Number(year);
        }

        if (type === "yearly") {
            if (year) filter["timeframe.year"] = Number(year);
        }
    }

    try {
        const goals = await Goal.find(filter);
        res.status(200).json({ goals });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.put("/goal/:goalId", authenticateToken, async (req, res) => {
    const { userId } = req.user
    const { goalId } = req.params
    const { title, isCompleted } = req.body
    try {
        const updates = {}
        if (title !== undefined) updates.title = title;
        if (isCompleted !== undefined) updates.isCompleted = isCompleted;

        const updatedGoal = await Goal.findOneAndUpdate({ _id: goalId, userId }, updates, { new: true })
        if (!updatedGoal) {
            return res.status(404).json({ err_msg: "Goal not Found or User is not Authorized" })
        }
        res.status(200).json({ message: "Goal Updated Successfully" })

    }
    catch (error) {
        res.status(500).json({ err_msg: error.message })
    }


})

app.delete("/goals", authenticateToken, async (req, res) => {
    const { userId } = req.user
    try {
        await Goal.deleteMany({ userId })
        res.status(200).json({ message: "All Goals Deleted Successfully" })
    }
    catch (error) {
        res.status(500).json({ err_msg: error.message })
    }
})

app.delete("/goal/:goalId", authenticateToken, async (req, res) => {
    const { userId } = req.user;
    const { goalId } = req.params
    try {
        const deletedGoal = await Goal.findOneAndDelete({ _id: goalId, userId })
        if (!deletedGoal) {
            return res.status(404).json({ err_msg: "Goal not found or not authorized" })
        }
        res.status(200).json({ message: "Goal Deleted Successfully" })
    }
    catch (error) {
        return res.status(500).json({ err_msg: error.message })
    }
})

app.get("/tasks", authenticateToken, async (req, res) => {
    const { tag, status, priority, selectedDate } = req.query;
    const userId = req.user.userId;
    const filter = { userId };

    if (tag) filter.tag = tag;
    if (status) filter.status = status;
    if (priority) filter.priority = priority;

    if (selectedDate) {

        const date = new Date(selectedDate);
        date.setHours(0, 0, 0, 0);
        const nextDate = new Date(date);
        nextDate.setDate(date.getDate() + 1); // Set nextDate to the start of the next day
        filter.selectedDate = { $gte: date, $lt: nextDate };
    }

    try {
        const tasks = await Task.find(filter);
        res.status(200).json(tasks);           // Send filtered todos
    } catch (error) {
        res.status(500).json({
            err_msg: error.message
        });
    }
});

app.post("/tasks", authenticateToken, async (req, res) => {
    const { task, tag, priority, selectedDate } = req.body;
    const { userId } = req.user

    const date = new Date(selectedDate);
    date.setHours(0, 0, 0, 0)

    try {
        await Task.create({ task, tag, priority, userId, selectedDate: date });
        res.status(201).json({ message: "Task added successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ err_msg: error.message });
    }
});

app.put('/tasks/:taskId', authenticateToken, async (req, res) => {
    const { taskId } = req.params;
    const { task, tag, priority, status, selectedDate } = req.body;
    const date = new Date(selectedDate);
    date.setHours(0, 0, 0, 0);
    try {
        const updatedTask = await Task.findByIdAndUpdate(
            taskId,
            { task, tag, priority, status, selectedDate: date },
            { new: true }
        );

        if (!updatedTask) {
            return res.status(404).send({ err_msg: 'Task not found' });
        }
        res.status(200).json({ message: 'Task updated successfully', updatedTodo });
    } catch (error) {
        res.status(500).json({ err_msg: error.message });
    }
});

app.delete("/tasks", authenticateToken, async (req, res) => {
    try {

        const { userId } = req.user;
        await Task.deleteMany({ userId });
        res.status(200).json({ message: "All tasks deleted successfully" });
    } catch (error) {
        res.status(500).json({ err_msg: error.message });
    }
});

app.delete("/tasks/:taskId", authenticateToken, async (req, res) => {
    const { taskId } = req.params;  // Extract todoId from the URL parameter
    const { userId } = req.user;
    try {
        // Delete the todo by its ID
        const deletedTask = await Task.findOneAndDelete({ _id: taskId, userId });
        if (!deletedTask) {
            return res.status(404).send({ err_msg: "Task not found or unauthorized" });
        }
        res.status(200).json({ message: "Task deleted successfully" });

    } catch (error) {
        res.status(500).json({ err_msg: error.message });
    }
});

app.post("/register", async (req, res) => {
    try {
        const { username, password, email } = req.body;

        const existingUser = await User.findOne({ $or: [{ username }, { email }] });
        const { username: existingUsername, email: existingEmail } = existingUser ?? {}
        if (existingUsername) {
            return res.status(400).json({ err_msg: "Username Already Taken" })
        }
        if (existingEmail) {
            return res.status(400).json({ err_msg: "Email Already Taken" })
        }

        if (password.length < 6) {
            return res.status(400).json({ err_msg: "Password must be at least 6 characters long" })
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
            username,
            password: hashedPassword,
            email
        });
        await newUser.save();

        const payload = { username: newUser.username, email: newUser.email, role: newUser.role, isVerified: newUser.isVerified, userId: newUser._id }
        const token = jwt.sign(payload, process.env.EMAIL_TOKEN, { expiresIn: "5m" })
        sendVerificationEmail(email, token)
        res.status(200).json({ message: "User registered successfully! Please check your email to verify your account.", });
    } catch (error) {
        res.status(500).json({ err_msg: error.message });
    }
});

app.get("/verify", async (req, res) => {
    const { token } = req.query
    try {
        const decoded = jwt.verify(token, process.env.EMAIL_TOKEN)
        const user = await User.findOne({ email: decoded.email })

        if (!user) {
            return res.status(400).send({ error_msg: "Invalid Token" })
        }

        if (user.isVerified) {
            return res.status(400).send({ error_msg: "Email already verified" });
        }

        user.isVerified = true;
        await user.save(); // ✅ Saves the changes

        res.status(200).send({ message: "Email Verified Successfully! You can now login." })
    }
    catch (err) {
        res.status(500).send({ error_msg: err.message })
    }
})

app.post("/login", async (req, res) => {
    try {
        const { username, password } = req.body;

        // Step 1: Find user in MongoDB
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Step 2: Compare password
        const isPasswordMatched = await bcrypt.compare(password, user.password);
        if (!isPasswordMatched) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        // Step 3: Create JWT payload
        const userPayload = {
            userId: user._id,
            username: user.username,
            email: user.email,
            isVerified: user.isVerified,
            role: user.role
        };

        // Step 4: Generate token
        const jwtToken = jwt.sign(userPayload, process.env.JWT_SECRET, { expiresIn: "3d" });

        // Step 5: Send response
        return res.status(200).json({
            message: "Login successful",
            jwtToken,
            username: user.username,
            role: user.role
        });

    } catch (error) {

        return res.status(500).json({ err_msg: error.message });
    }
});

app.post('/sendOtp', async (req, res) => {
    try {
        const { email } = req.body
        await generateAndSendOtp(email)
        return res.status(200).json({ message: "OTP has been sent to your email! Please check your inbox." })
    }
    catch (err) {
        return res.status(500).json({ err_msg: err.message })
    }
})

app.post("/verifyOtp", async (req, res) => {
    const { email, otp } = req.body;
    const user = await User.findOne({ email })

    if (!user) {
        return res.status(404).json({ err_msg: "User Not Found" })
    }

    let isOtpMatched = await bcrypt.compare(otp.toString(), user.otp)

    if (!isOtpMatched) {
        return res.status(400).json({ err_msg: "Otp is Invalid!" })
    }

    return res.status(200).json({ message: "Otp Verified Successfully!" })
})

app.post("/resetPassword", async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ err_msg: "User Not Found" });
        }
        const isOldPasswordMatched = await bcrypt.compare(password, user.password)
        if (isOldPasswordMatched) {
            return res.status(400).json({
                err_msg: "You cannot reuse your current password. Please choose a different one."
            })
        }
        const encryptedPassword = await bcrypt.hash(password, 10);
        user.password = encryptedPassword;
        user.otp = ""
        await user.save();

        res.status(200).json({ msg: "Password reset successful!" });
    } catch (error) {
        res.status(500).json({ err_msg: error.message });
    }
});

app.get("/users", authenticateToken, async (req, res) => {
    const { userId } = req.user // Extract userId from req.user
    try {
        const user = await User.findById(userId); // Query User model by userId
        if (user.role === "admin") {
            let allUsers = await User.find({}, { _id: 0, username: 1, email: 1, isVerified: 1, avatar, createdAt: 1 })
            res.status(200).json({ message: allUsers })
        }
        else {
            res.status(403).json({ err_msg: "Forbidden: Admins only" })
        }

    } catch (error) {
        res.status(500).json({ err_msg: error.message });
    }
});

app.get("/dashboard", authenticateToken, async (req, res) => {
    try {
        const { userId } = req.user
        const { days } = req.query

        const endDate = new Date();
        endDate.setUTCHours(0, 0, 0, 0);

        const startDate = new Date(endDate);
        startDate.setUTCDate(startDate.getUTCDate() - days);

        const tasks = await Task.find({ userId, selectedDate: { $gte: startDate, $lte: endDate } })

        const getGraph1 = () => {
            let pendingTasks = completedTasks = 0
            tasks.forEach(each => {
                if (each.status === "pending") pendingTasks++
                else completedTasks++
            })
            return { totalTasks: tasks.length, pendingTasks, completedTasks }
        }

        const getGraph2 = () => {
            let high = low = medium = 0
            todos.forEach(each => {
                if (each.priority === "low") low++
                else if (each.priority === "medium") medium++
                else high++
            })
            return { low, medium, high }
        }

        const getGraph3 = async () => {
            const aggregatedTasks = await Task.aggregate([
                { $match: { userId: new mongoose.Types.ObjectId(userId), selectedDate: { $gte: startDate, $lte: endDate } } },
                { $group: { _id: "$selectedDate", completed: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } } } },
                { $project: { _id: 0, date: "$_id", completed: 1 } }
            ])
            const dateMap = new Map()

            aggregatedTasks.forEach(each => {
                const dateStr = each.date.toISOString().slice(0, 10)
                dateMap.set(dateStr, each.completed);
            })

            let lineChartData = []

            for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {

                const dateClone = new Date(d);
                const dateStr = dateClone.toISOString().slice(0, 10)
                lineChartData.push({ date: dateStr, count: dateMap.get(dateStr) || 0 })
            }


            return { completion_breakdown: lineChartData }
        }

        const getGraph4 = async () => {
            const aggregatedTasks = await Task.aggregate([
                { $match: { userId: new mongoose.Types.ObjectId(userId), selectedDate: { $gte: startDate, $lte: endDate } } },
                { $group: { _id: "$selectedDate", total: { $sum: 1 }, completed: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } } } },
                { $project: { _id: 0, date: "$_id", total: 1, completed: 1 } }
            ])
            const dateMap = new Map()
            aggregatedTasks.forEach(each => {
                const dateStr = each.date.toISOString().slice(0, 10)
                dateMap.set(dateStr, { total: each.total, completed: each.completed })
            })

            let stackedBarChart = []
            for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
                const dateClone = new Date(d)
                const dateStr = dateClone.toISOString().slice(0, 10)
                stackedBarChart.push({ date: dateStr, total: dateMap.get(dateStr)?.total || 0, completed: dateMap.get(dateStr)?.completed || 0 })
            }
            return { created_vs_completed_breakdown: stackedBarChart }
        }

        const getGraph5 = async () => {
            const aggregatedTasks = await Task.aggregate([
                { $match: { userId: new mongoose.Types.ObjectId(userId), selectedDate: { $gte: startDate, $lte: endDate } } },
                { $group: { _id: "$tag", count: { $sum: 1 } } },
                { $project: { _id: 0, tag: "$_id", count: 1 } },
                { $sort: { count: -1 } }
            ])
            return { tags: aggregatedTasks }
        }

        const status_breakdown = getGraph1()
        const priority_breakdown = getGraph2()
        const completion_trend = await getGraph3()
        const created_vs_completed_trend = await getGraph4()
        const tag_breakdown = await getGraph5()

        res.status(200).json({
            status_breakdown,
            priority_breakdown,
            completion_trend,
            created_vs_completed_trend,
            tag_breakdown
        })

    } catch (err) {
        console.error(err)
        res.status(500).json({ err_msg: err.message })
    }
})

app.get("/streak", authenticateToken, async (req, res) => {
    try {
        const { userId } = req.user
        const { days } = req.query

        let today = new Date()
        today.setUTCHours(0, 0, 0, 0)

        let endDate = today
        let startDate = new Date(today)
        startDate.setDate(endDate.getDate() - parseInt(days, 10))

        //this is for getting total and completed tasks
        let summary = await Task.aggregate([{ $match: { userId: new mongoose.Types.ObjectId(userId), selectedDate: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: null, completedCount: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } }, totalTasks: { $sum: 1 } } }])
        const result = summary[0] || { completedCount: 0, totalTasks: 0 };

        const activeDatesAgg = await Task.aggregate([
            {
                $match: {
                    userId: new mongoose.Types.ObjectId(userId),
                    selectedDate: { $gte: startDate, $lte: endDate },
                    status: "completed"
                }
            },
            {
                $group: {
                    _id: "$selectedDate"
                }
            },
            {
                $sort: {
                    _id: 1
                }
            }
        ]);

        const activeDates = activeDatesAgg.map(item => new Date(item._id));
        const totalActiveDays = activeDates.length;

        let maxStreak = 0;
        let currentStreak = 0;

        for (let i = 0; i < activeDates.length; i++) {
            if (i === 0) {
                currentStreak = 1;
                maxStreak = 1;
            } else {
                const diff = (activeDates[i] - activeDates[i - 1]) / (1000 * 60 * 60 * 24);
                if (diff === 1) {
                    currentStreak++;
                    maxStreak = Math.max(maxStreak, currentStreak);
                } else {
                    currentStreak = 1;
                }
            }
        }

        const tasks = await Task.find({
            userId,
            selectedDate: { $gte: startDate, $lte: endDate },
            status: "completed"
        }, "selectedDate");

        const dateMap = new Map();
        tasks.forEach(each => {
            const dateStr = each.selectedDate.toISOString().slice(0, 10)
            dateMap.set(dateStr, (dateMap.get(dateStr) || 0) + 1);
        })

        const streakData = []
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dateClone = new Date(d);
            const dateStr = dateClone.toISOString().slice(0, 10)
            const count = dateMap.get(dateStr) || 0
            const active = count > 0
            streakData.push({ date: dateStr, active, count })
        }

        res.status(200).json({
            summary: {
                completedTasks: result.completedCount,
                totalTasks: result.totalTasks,
                activeDays: totalActiveDays,
                maxStreak
            },
            streakData
        });
    }
    catch (error) {
        res.status(500).json({ err_msg: error.message })
    }
})

const port = process.env.PORT || 6002;

app.get("/", (req, res) => {
    res.send("Hello, world! ,I successfully deployed my first backend application");
})

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
