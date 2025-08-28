const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true,unique:true },
  email:{type:String,required:true,unique:true},
  password: { type: String, required: true },
  isVerified: { type: Boolean, default: false },           // email verification
  avatar: { type: String, default: "https://res.cloudinary.com/dq4yjeejc/image/upload/v1755768087/Screenshot_2025-08-21_145047_zqcfpw.png" },
  otp: {type:String,default:""},
  role: {
    type: String, enum: ["admin", "user"],
    default: "user"
  }

}, { timestamps: true });

module.exports = mongoose.model("User", userSchema)