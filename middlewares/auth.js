const userModel = require("../models/users")

const BlacklistToken = require("../models/blacklist")
const jwt = require("jsonwebtoken")

module.exports.authenticateUser = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        const isBlacklisted = await BlacklistToken.findOne({ token })

        if (isBlacklisted) {
            return res.status(401).json({ message: "Unauthorized" })
        }

        const existingUser = await userModel.findById(decoded.id)
        req.user = existingUser
        return next()
    }
    catch (error) {
        return res.status(401).json({ message: "Unauthorized" })
    }
}