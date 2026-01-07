
const taskModel = require("../models/tasks")
const { mongoose } = require("mongoose");
const sanitize = require("../utils/sanitize");

const { getTodayDate, getDateNDaysAgo } = require("../utils/date");

module.exports.getDashboard = async (req, res) => {
    try {
        const userId = req.user._id;
        const cleanQuery = sanitize(req.query)
        let { days = 7 } = cleanQuery;
        days = Math.min(parseInt(days), 365);

        const endDate = getTodayDate();
        const startDate = getDateNDaysAgo(days - 1);

        const [stats, aggregatedTasks, tagBreakdown] = await Promise.all([
            taskModel.aggregate([
                { $match: { userId: new mongoose.Types.ObjectId(userId), selectedDate: { $gte: startDate, $lte: endDate } } },
                {
                    $group: {
                        _id: null,
                        totalTasks: { $sum: 1 },
                        // Counting pending as missed for now; update after cron job
                        pending: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } },
                        completed: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
                        low: { $sum: { $cond: [{ $eq: ["$priority", "low"] }, 1, 0] } },
                        medium: { $sum: { $cond: [{ $eq: ["$priority", "medium"] }, 1, 0] } },
                        high: { $sum: { $cond: [{ $eq: ["$priority", "high"] }, 1, 0] } },
                    }
                },
                { $project: { _id: 0, totalTasks: 1, pending: 1, completed: 1, low: 1, medium: 1, high: 1 } }
            ]),
            taskModel.aggregate([
                { $match: { userId: new mongoose.Types.ObjectId(userId), selectedDate: { $gte: startDate, $lte: endDate } } },
                {
                    $group: {
                        _id: "$selectedDate",
                        completed: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
                        pending: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } }
                    }
                },
                { $project: { _id: 0, date: "$_id", completed: 1, pending: 1 } }
            ]),
            taskModel.aggregate([
                { $match: { userId: new mongoose.Types.ObjectId(userId), selectedDate: { $gte: startDate, $lte: endDate } } },
                { $group: { _id: "$tag", count: { $sum: 1 } } },
                { $project: { _id: 0, tag: "$_id", count: 1 } },
                { $sort: { count: -1 } }
            ])
        ]);

        const [{ totalTasks, pending, completed, low, medium, high } = {}] = stats;


        const statusBreakdown = { totalTasks, pending, completed }
        const priorityBreakdown = { totalTasks, low, medium, high }


        const dateMap = new Map();
        aggregatedTasks.forEach(each => {
            const dateStr = each.date
            dateMap.set(dateStr, { completed: each.completed, pending: each.pending });
        });

        const completionBreakdown = [];
        const pendingBreakdown = [];

        let current = new Date(startDate);
        const end = new Date(endDate);

        while (current <= end) {
            const dateStr = current.toLocaleDateString("en-CA");

            const data = dateMap.get(dateStr) || { completed: 0, pending: 0 };

            completionBreakdown.push({ date: dateStr, count: data.completed });
            pendingBreakdown.push({ date: dateStr, count: data.pending });

            current.setDate(current.getDate() + 1);
        }

        

        res.status(200).json({
            totalTasks,
            statusBreakdown,
            priorityBreakdown,
            completionBreakdown,
            pendingBreakdown,
            tagBreakdown
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
