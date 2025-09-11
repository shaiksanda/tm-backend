const userModel = require("../models/users")
const transporter=require("../utils/transporter")
module.exports.generateAndSendOtp = async (email) => {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const user = await userModel.findOne({ email })
    if (!user) {
        throw new Error("User Not Found")
    }
    encryptedOtp = await userModel.hashOtp(otp)
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