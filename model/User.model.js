import mongoose from "mongoose";

import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: String,
    email: String,
    password: String,
    role: {
      type: String,
      enum: ["user", "admin"], // jab bhi ham enum dete hai toh ek default value bhi rakhna chahiye, kyoki ham usi mein se value select kar rhe hai (nahi bhi rakhoge toh koi dikkat nahi hai)
      default: "user",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationToken: {
      type: String,
    },
    resetPasswordToken: {
      type: String,
    },
    resetPasswordExpires: {
      type: Date, // Date isliye diya taaki check kar payenge ki kahi expire toh nahi ho gaya token
    },
  },
  {
    timestamps: true, // isko true karte hi mongoose kya karta hai, ki aapke database mein joh bhi yeh schema hai, usemin 2 naye field add kar deta hai (createdAt aur updatedAt)
  }
);

userSchema.pre("save", async function (next) {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

const User = mongoose.model("User", userSchema);

export default User;
