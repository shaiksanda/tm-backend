
const taskModel = require("../models/tasks")
const { mongoose } = require("mongoose");
const sanitize = require("../utils/sanitize");

module.exports.getDashboard = async (req, res) => {
    try {
        const userId = req.user._id;
        const cleanQuery=sanitize(req.query)
        let { days = 7 } =cleanQuery;
        days = Math.min(parseInt(days), 365);

        const endDate = new Date();
        endDate.setUTCHours(0, 0, 0, 0);

        const startDate = new Date(endDate);
        startDate.setUTCDate(startDate.getUTCDate() - (days - 1));

        const [stats, aggregatedTasks, tagBreakdown] = await Promise.all([
            taskModel.aggregate([
                { $match: { userId: new mongoose.Types.ObjectId(userId), selectedDate: { $gte: startDate, $lte: endDate } } },
                {
                    $group: {
                        _id: null,
                        totalTasks: { $sum: 1 },
                        // Counting pending as missed for now; update after cron job
                        missed: { $sum: { $cond: [{ $eq: ["$status", "missed"] }, 1, 0] } },
                        completed: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
                        low: { $sum: { $cond: [{ $eq: ["$priority", "low"] }, 1, 0] } },
                        medium: { $sum: { $cond: [{ $eq: ["$priority", "medium"] }, 1, 0] } },
                        high: { $sum: { $cond: [{ $eq: ["$priority", "high"] }, 1, 0] } },
                    }
                },
                { $project: { _id: 0, totalTasks: 1, missed: 1, completed: 1, low: 1, medium: 1, high: 1 } }
            ]),
            taskModel.aggregate([
                { $match: { userId: new mongoose.Types.ObjectId(userId), selectedDate: { $gte: startDate, $lte: endDate } } },
                {
                    $group: {
                        _id: "$selectedDate",
                        completed: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
                        missed: { $sum: { $cond: [{ $eq: ["$status", "missed"] }, 1, 0] } }
                    }
                },
                { $project: { _id: 0, date: "$_id", completed: 1, missed: 1 } }
            ]),
            taskModel.aggregate([
                { $match: { userId: new mongoose.Types.ObjectId(userId), selectedDate: { $gte: startDate, $lte: endDate } } },
                { $group: { _id: "$tag", count: { $sum: 1 } } },
                { $project: { _id: 0, tag: "$_id", count: 1 } },
                { $sort: { count: -1 } }
            ])
        ]);

        const [{ totalTasks, missed, completed, low, medium, high } = {}] = stats;


        const statusBreakdown = { totalTasks, missed, completed }
        const priorityBreakdown = { totalTasks, low, medium, high }


        const dateMap = new Map();
        aggregatedTasks.forEach(each => {
            const dateStr = each.date.toISOString().slice(0, 10);
            dateMap.set(dateStr, { completed: each.completed, missed: each.missed });
        });

        const completionBreakdown = [];
        const missedBreakdown = [];

        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().slice(0, 10);
            const data = dateMap.get(dateStr) || { completed: 0, missed: 0 };
            completionBreakdown.push({ date: dateStr, count: data.completed });
            missedBreakdown.push({ date: dateStr, count: data.missed });
        }

        res.status(200).json({
            statusBreakdown,
            priorityBreakdown,
            completionBreakdown,
            missedBreakdown,
            tagBreakdown
        });

    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
