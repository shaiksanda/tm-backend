const feedbackModel = require("../models/feedback")
const mongoose=require("mongoose")

module.exports.postFeedback = async (req, res) => {
    const userId = req.user._id
    const { type, message } = req.body

    if (!type || !message) {
        return res.status(400).json({ message: "Type and message are required" });
    }
    const validTypes = ["bug", "suggestion", "feedback"];
    if (!validTypes.includes(type)) {
        return res.status(400).json({ message: "Invalid feedback type" });
    }
    try {
        await feedbackModel.create({ type, message, userId })
        res.status(200).json({ message: `${type} Added Successfully` })

    }
    catch (err) {
        res.status(500).json({ message: err.message })
    }
}

module.exports.getFeedbacks = async (req, res) => {
    const filter = {}
    const { status, type } = req.query
    if (status) filter.status = status
    if (type) filter.type = type

    try {
        const feedbacks = await feedbackModel.find(filter).populate("userId", "username").sort({ updatedAt: -1 })
        res.status(200).json({ feedbacks })
    }
    catch (err) {
        res.status(500).json({ message: err.message })
    }
}

module.exports.updateFeedback = async (req, res) => {
    const userId  = req.user._id
    const { feedbackId } = req.params
    const { type, status, message } = req.body
    const updates = {}
    if (message !== undefined) updates.message = message
    if (type !== undefined) updates.type = type
    if (status !== undefined) updates.status = status

    try {
        const updatedFeedback = await feedbackModel.findOneAndUpdate({ _id: feedbackId, userId }, updates, { new: true })
        if (!updatedFeedback) {
            return res.status(404).json({ message: "Feedback Not Found or Not Authorized" })
        }
        res.status(200).json({ message: `Feedback Updated Successfully` })

    }
    catch (err) {
        res.status(500).json({ message: err.message })
    }
}

module.exports.deleteFeedback = async (req, res) => {
    const  userId  = req.user._id
    const { feedbackId } = req.params
    if (!mongoose.Types.ObjectId.isValid(feedbackId)) {
        return res.status(400).json({ message: "Invalid feedback ID" });
    }
    try {
        const deleteFeedback = await feedbackModel.findOneAndDelete({ _id: feedbackId, userId })
        if (!deleteFeedback) {
            return res.status(404).json({ message: "Feedback Not Found or Not Authorized" })
        }
        res.status(200).json({ message: "Successfully Deleted Your Feedback" })
    }
    catch (err) {
        return res.status(500).json({ message: err.message })
    }
}