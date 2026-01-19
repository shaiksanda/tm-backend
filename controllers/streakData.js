const taskModel = require("../models/tasks")
const mongoose = require("mongoose")

module.exports.getStreakData = async (req, res) => {
    try {
        const { year } = req.query
        const userId = req.user._id

        if (!/^\d{4}$/.test(year)) {
            return res.status(400).json({ message: "Invalid year format" });
        }

        const requestedYear = Number(year);
        const currentYear = new Date().getFullYear();

        // allow only last 3 years
        const allowedYears = [
            currentYear,
            currentYear - 1,
            currentYear - 2,
        ];

        if (!allowedYears.includes(requestedYear)) {
            return res.status(400).json({ message: "Year not allowed" });
        }

        const tasks = await taskModel.aggregate([
            {
                $match:
                {
                    userId,
                    $expr: { $eq: [{ $substr: ["$selectedDate", 0, 4] }, year] }
                }
            },
            {
                $group: {
                    _id: "$selectedDate",
                    count: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } }

                }
            },
            {
                $project: {
                    _id: 0,
                    date: "$_id",
                    count: "$count"
                }
            },
            { $sort: { date: 1 } }
        ])
        res.status(200).json(tasks)
    }
    catch (error) {
        return res.status(500).json({ message: error.message })
    }
}