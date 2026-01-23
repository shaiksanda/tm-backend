const mongoose = require("mongoose");
const bcrypt=require("bcrypt")
const jwt=require("jsonwebtoken")

const userSchema = new mongoose.Schema({
  username: { type: String, required: true,unique:true },
  email:{type:String,required:true,unique:true},
  password: { type: String, required: true,select:false },
  isVerified: { type: Boolean, default: false },           // email verification
  avatar: { type: String, default: "https://res.cloudinary.com/dq4yjeejc/image/upload/v1755768087/Screenshot_2025-08-21_145047_zqcfpw.png" },
  otp: {type:String,default:""},
  role: {
    type: String, enum: ["admin", "user"],
    default: "user"
  },
   bio: { type: String, trim: true, default: "" }

}, { timestamps: true });

// 🔐 Hash password
userSchema.statics.hashPassword = async (password) => {
  return bcrypt.hash(password, 10);
};
// Compare password
userSchema.statics.comparePassword = async (password, hashedPassword) => {
  return bcrypt.compare(password, hashedPassword);
};
// Generate JWT
userSchema.statics.generateAuthToken = (userId) => {
    return jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

const userModel = mongoose.model("User", userSchema);
module.exports = userModel;