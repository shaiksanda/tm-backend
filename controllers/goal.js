const goalsModel = require("../models/goals")

module.exports.postGoal = async (req, res, next) => {
    const  userId  = req.user._id;
    const { title, type, timeframe } = req.body

    try {
        await goalsModel.create({ title, type, timeframe, userId })
        res.status(200).json({ message: "Goal Added Successfully" })
    }
    catch (error) {
        res.status(500).json({ message: error.message })
    }
}

module.exports.getGoals = async (req, res, next) => {
    const  userId  = req.user._id;
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
        const goals = await goalsModel.find(filter);
        res.status(200).json({ goals });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

module.exports.updateGoal = async (req, res, next) => {
    const userId  = req.user._id
    const { goalId } = req.params
    const { title, isCompleted } = req.body
    try {
        const updates = {}
        if (title !== undefined) updates.title = title;
        if (isCompleted !== undefined) updates.isCompleted = isCompleted;

        const updatedGoal = await goalsModel.findOneAndUpdate({ _id: goalId, userId }, updates, { new: true })
        if (!updatedGoal) {
            return res.status(404).json({ message: "Goal not Found or User is not Authorized" })
        }
        res.status(200).json({ message: "Goal Updated Successfully" })

    }
    catch (error) {
        res.status(500).json({ message: error.message })
    }
}

module.exports.deleteAllGoals = async (req, res, next) => {
    const  userId  = req.user._id
    try {
        await goalsModel.deleteMany({ userId })
        res.status(200).json({ message: "All Goals Deleted Successfully" })
    }
    catch (error) {
        res.status(500).json({ message: error.message })
    }
}

module.exports.deleteGoal = async (req, res) => {
    const userId  = req.user._id;
    const { goalId } = req.params
    try {
        const deletedGoal = await goalsModel.findOneAndDelete({ _id: goalId, userId })
        if (!deletedGoal) {
            return res.status(404).json({ message: "Goal not found or not authorized" })
        }
        res.status(200).json({ message: "Goal Deleted Successfully" })
    }
    catch (error) {
        return res.status(500).json({ message: error.message })
    }
}