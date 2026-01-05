const userModel = require("../models/users")
const taskModel = require("../models/tasks")
const mongoose = require("mongoose")
const { validationResult } = require("express-validator")

const { generateAndSendOtp } = require("../utils/generateotp")

const BlacklistToken = require("../models/blacklist")

module.exports.registerUser = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { username, email, password } = req.body;

        const existingUser = await userModel.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            if (existingUser.username === username) {
                return res.status(400).json({ message: "Username Already Taken!" });
            }
            if (existingUser.email === email) {
                return res.status(400).json({ message: "Email Already Taken!" });
            }
        }

        const hashedPassword = await userModel.hashPassword(password);
        const user = await userModel.create({ username, email, password: hashedPassword });

        const token = userModel.generateAuthToken(user._id);
        res.status(201).json({ token, user });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports.loginUser = async (req, res, next) => {
    try {
        const errors = validationResult(req)

        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() })
        }

        const { username, password } = req.body

        const existingUser = await userModel.findOne({ username }).select("+password")
        if (!existingUser) {
            return res.status(401).json({ message: "Invalid Username Or Wrong Password" })
        }
        const isPasswordMatched = await userModel.comparePassword(password, existingUser.password)

        if (!isPasswordMatched) {
            return res.status(401).json({ message: "Invalid Username Or Wrong Password" })
        }
        const token = await userModel.generateAuthToken(existingUser._id)
        const userData={userId:existingUser._id,username:existingUser.username,role:existingUser.role,bio:existingUser.bio,avatar:existingUser.avatar,email:existingUser.email}
        return res.status(200).json({ token, userData })
    }
    catch (error) {
        res.status(500).json({ message: error.message })
    }
}

module.exports.getAllUsers = async (req, res, next) => {
    const userId  = req.user._id

    try {
        const user = await userModel.findById(userId); // Query user model by userId
        if (user.role === "admin") {
            let allUsers = await userModel.find({}, { _id: 0, username: 1, email: 1, isVerified: 1, avatar: 1, createdAt: 1 })
            res.status(200).json({ message: allUsers })
        }
        else {
            res.status(403).json({ message: "Forbidden: Admins only" })
        }

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

module.exports.logoutUser = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const token = authHeader.split(" ")[1];
        await BlacklistToken.create({ token })

        res.status(200).json({ message: "Logged Out Successful!" })
    }
    catch (error) {
        res.status(500).json({ message: error.message })
    }
}

module.exports.getStreakData = async (req, res) => {
    try {
        const userId  = req.user._id
        const { days } = req.query

        let today = new Date()
        today.setUTCHours(0, 0, 0, 0)

        let endDate = today
        let startDate = new Date(today)
        startDate.setDate(endDate.getDate() - parseInt(days, 10))

        //this is for getting total and completed tasks
        let summary = await taskModel.aggregate([{ $match: { userId: new mongoose.Types.ObjectId(userId), selectedDate: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: null, completedCount: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } }, totalTasks: { $sum: 1 } } }])
        const result = summary[0] || { completedCount: 0, totalTasks: 0 };

        const activeDatesAgg = await taskModel.aggregate([
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

        const tasks = await taskModel.find({
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
        res.status(500).json({ message: error.message })
    }
}

// module.exports.sendOtp = async (req, res) => {
//     try {
//         const { email } = req.body
//         await generateAndSendOtp(email)
//         return res.status(200).json({ message: "OTP has been sent to your email! Please check your inbox." })
//     }
//     catch (err) {
//         return res.status(500).json({ message: err.message })
//     }
// }

// module.exports.verifyOtp = async (req, res) => {
//     try {
//         const { email, otp } = req.body;
//         const user = await userModel.findOne({ email })

//         if (!user) {
//             return res.status(404).json({ message: "User Not Found" })
//         }
//         let isOtpMatched = await userModel.compareOtp(otp, user.otp)

//         if (!isOtpMatched) {
//             return res.status(400).json({ message: "Otp is Invalid!" })
//         }

//         user.otp = ""
//         user.isVerified = true
//         await user.save()

//         res.status(200).json({ message: "Otp Verified Successfully! You Can Login Now!" })

//     }
//     catch (err) {
//         res.status(500).json({ message: err.message })
//     }
// }

// module.exports.resetPassword = async (req, res) => {
//     try {
//         const { email, password } = req.body;
//         const user = await userModel.findOne({ email }).select("+password");;
    
//         if (!user) {
//             return res.status(404).json({ message: "User Not Found" });
//         }

//         if (password.length < 6) {
//             return res.status(400).json({ message: "Password must be Atleast 6 Characters Long" })
//         }
//         const isOldPasswordMatched = await userModel.comparePassword(password,user.password)
//         if (isOldPasswordMatched) {
//             return res.status(400).json({
//                 message: "You cannot reuse your current password. Please choose a different one."
//             })
//         }
//         const encryptedPassword = await userModel.hashPassword(password);
//         user.password = encryptedPassword;
//         user.otp = ""
//         await user.save();

//         res.status(200).json({ message: "Password Changed successful!" });
//     } catch (error) {
//         res.status(500).json({ message: error.message });
//     }
// }