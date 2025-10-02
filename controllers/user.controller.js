import User from "../model/User.model.js";

import crypto from "crypto";

import nodemailer from "nodemailer";

import bcrypt from "bcryptjs";

import jwt from "jsonwebtoken";

const registerUser = async (req, res) => {
  // get data

  const { name, email, password } = req.body || {};

  // validate the data

  if (!name || !email || !password) {
    return res.status(400).json({
      message: "All fields are required",
    });
  }
  // console.log(req.body);  // checking that after validation we are getting the data or not

  // check if user already exists

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        message: "User already exists",
      });
    }
    // didn't find, now we have to create a new user
    const newUser = await User.create({
      name,
      email,
      password,
    });
    console.log(newUser); // joh bhi model create kiya tha woh pura model hai, object ki format mein

    // check if the new user in the database
    if (!newUser) {
      return res.status(400).json({
        message: "User not registered",
      });
    }
    // create a verification token
    const token = crypto.randomBytes(32).toString("hex"); // randomBytes hex format mein apne aap deta hai

    console.log(token);

    // save the token in database
    newUser.verificationToken = token;

    await newUser.save();

    // send token as email to user
    const transporter = nodemailer.createTransport({
      host: process.env.MAILTRAP_HOST,
      port: process.env.MAILTRAP_PORT,
      secure: false,
      auth: {
        user: process.env.MAILTRAP_USERNAME,
        pass: process.env.MAILTRAP_PASSWORD,
      },
    });

    const mailOption = {
      from: process.env.MAILTRAP_SENDEREMAIL,
      to: newUser.email,
      subject: "Verify your email",
      text: `Please click on the following link: 
            ${process.env.BASE_URL}/api/v1/users/verify/${token} 
            `,
      html: `
                    <div style="font-family: Arial, sans-serif; line-height:1.6;">
                        <h2>Welcome, ${newUser.name}!</h2>
                        <p>Please click on the link below to verify your email:</p>
                        <a href="${process.env.BASE_URL}/api/v1/users/verify/${token}" 
                        style="display:inline-block; padding:10px 20px; background:#4CAF50; 
                        color:#fff; text-decoration:none; border-radius:5px;">
                            Verify Email
                        </a>
                        <p>If the button doesn’t work, copy and paste this link into your browser:</p>
                        <p>${process.env.BASE_URL}/api/v1/users/verify/${token}</p>
                    </div>
                `,
    };

    await transporter.sendMail(mailOption);

    // send success status to user
    res.status(201).json({
      message: "User registered successfully",
      success: true,
    });
  } catch (error) {
    res.status(400).json({
      message: "User not registered",
      error,
      success: false,
    });
  }
};

const verifyUser = async (req, res) => {
  // get token from url
  const { token } = req.params;

  console.log(token); // output terminal mein aayega

  // validate token
  if (!token) {
    return res.status(401).json({
      message: "Invalid token",
    });
  }

  // find user based on token
  const user = await User.findOne({ verificationToken: token });

  if (!user) {
    return res.status(404).json({
      message: "Invalid token",
    });
  }

  // if found, set isVerified to true of the user
  user.isVerified = true;

  // remove verification token
  user.verificationToken = undefined; // we can also make it null or an empty string

  // save
  await user.save();

  // return response
  res.status(200).json({
    success: true,
    message: "Email verified successfully",
  });
};

const login = async (req, res) => {
  // get data
  const { email, password } = req.body;

  // validate data
  if (!email || !password) {
    return res.status(400).json({
      message: "All fields are required",
    });
  }

  try {
    // yaha uppercase wala user (i.e., User) lenge, kyoki hamein saare documents mein check karna hai, waise yeh uppercase wala mongoose model hai
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        message: "Invalid email or password",
      });
    }

    // email toh hai, ab password match karte hai
    const isMatch = await bcrypt.compare(password, user.password); // user.password (database se aaya) aur password (user se aaya) , yeh compare mujhe deta hai boolean value

    console.log(isMatch);

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid email or password",
      });
    }

    // check if the user is verified and if not, give a message to the user to verify their email
    if (!user.isVerified) {
      return res.status(403).json({
        message: "Please verify your email",
      });
    }

    // ismein id hi lete hai usually, waise kuch bhi le sakte ho
    // isko await ki zaroorat nahi padti
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET, // secret hai yeh, waise toh yeh .env mein jayega lekin abhi ke liye yahi le lete hai (isi se token khulta hai aur yahi har token ko unique banata hai)
      // ek third object bhi pass kar sakte hai ham
      {
        expiresIn: "24h", // kitne der mein expire hoga token aur yeh bhi .env mein jaata hai
      }
    );

    // ab token toh bann gaya, lekin kare kya?

    // sabse sahi ki cookies mein save karlo, lekin yeh depend karega ki kaunsa app bana rhe ho, kyoki mobile mein koi cookies nahi hoti hai (depend karta hai ki frontend pe kya bana rhe ho aur appka client kya hai)

    // abhi ki liye ham cookies mein save kar lenge

    // ab token ho gaya, ab mujhe seekhna hai ki cookies ko kaise add kiya jaata hai
    // key-value pair mein likhte hai

    const cookieOptions = {
      httpOnly: true, // isko true karne se yeh hota hai ki yeh cookies ab backend ke control mein aa jaati hai, user ab iss cookie ko ched nahi sakta (waise tarike toh bahot hai, lekin ek aam user nahi kar sakta)
      secure: true, // ab chances hai ki yeh cookie secure hi rahegi
      maxAge: 24 * 60 * 60 * 1000, // kitne der ke liye cookie rakhna chahte ho
    };
    // abhi itna pata nahi lagega inn options ka, jab ham frontend banayenge tab ache se pata lagega, postman mein OK-OK pata lagta hai, itna nahi
    // ab main chahta hu ki user ki joh cookie hai usmein token bhi chala jaaye

    res.cookie("token", token, cookieOptions);
    // user ke paas yeh jwt token chala gaya, toh matlab user login ho gaya

    res.status(200).json({
      success: true,
      message: "Login Successful", // yeh message usually aise nahi dikhaya jaata hai, frontend waale ke upar,
      token,
      user: {
        id: user._id,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(400).json({
      message: "Error while logging in",
    });
  }
};

const profile = async (req, res) => {
  try {
    // cookies mein se data nikaal lunga aur usko decrypt kar lunga (auth.middleware.js mein kar liya)

    // const data = req.user
    // console.log("Reached at profile level", data)
    const user = await User.findById(req.user.id).select("-password"); // data lekar aao, lekin password matt lana

    console.log(user);

    if (!user) {
        res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      user, // ham kai baar pura user nahi bhejte hai, selected data hi bhejte hai
    });
  } 

  catch (error) {
    console.log(error)
  }
};

// authenticated user ko hi toh ham logout karwayenge, isiliye ismein bhi token chahiye
const logoutUser = async (req, res) => {
  try {
    // cookie clear kar diya
    res.cookie("token", "", {
      // cookie ko expire bhi kara sakte hai
      // expires: new Date(0) // isse cookie immediately clear ho jaati hai
    });

    res.status(200).json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {}
};

const forgotPassword = async (req, res) => {
  try {
    // get email from req.body
    const {email} = req.body || {}

    console.log(email)
    // find user based on email
    const user = await User.findOne({email})

    console.log(user)
    
    if(!user){
      return res.status(400).json({
        success: false, 
        message: "User not found"
      })
    }

    // if found, reset token + reset expiry ko set kardo (reset expiry ko set karne ke liye Date.now() + 10 * 60 * 1000) for 10 mins => user.save()

    const resetToken = crypto.randomBytes(32).toString("hex");

    console.log(`resetToken: ${resetToken}`)

    user.resetPasswordToken = resetToken

    user.resetPasswordExpires = Date.now() + (10 * 60 * 1000)
    
    await user.save()

    // send email with route /resetPassword => design url

     // send token as email to user
    const transporter = nodemailer.createTransport({
      host: process.env.MAILTRAP_HOST,
      port: process.env.MAILTRAP_PORT,
      secure: false,
      auth: {
        user: process.env.MAILTRAP_USERNAME,
        pass: process.env.MAILTRAP_PASSWORD,
      },
    });

    const mailOption = {
      from: process.env.MAILTRAP_SENDEREMAIL,
      to: user.email,
      subject: "Password Reset Request",
      text: `Please click on the following link: 
            ${process.env.BASE_URL}/api/v1/users/reset-password/${resetToken} 
            `,
      html: `
                    <div style="font-family: Arial, sans-serif; line-height:1.6;">
                        <h2>Hello, ${user.name}!</h2>
                        <p>You have requested for password reset:</p>
                        <a href="${process.env.BASE_URL}/api/v1/users/reset-password/${resetToken}" 
                        style="display:inline-block; padding:10px 20px; background:#4CAF50; 
                        color:#fff; text-decoration:none; border-radius:5px;">
                            Reset password
                        </a>
                        <p>If the button doesn’t work, copy and paste this link into your browser:</p>
                        <p>${process.env.BASE_URL}/api/v1/users/reset-password/${resetToken}</p>
                    </div>
                `,
    };

    await transporter.sendMail(mailOption);

    res.status(200).json({
      success: true,
      message: "Password reset email sent successfully"
    });


  } catch (error) {
    res.status(400).json({
      message: "User not found",
      error,
      success: false,
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    
    // collect token from params
    const { token } = req.params;
    // password from req.body
    const { password } = req.body;
    try {
      // ab yeh user tab hi milega jab object mein pass kiye dono values honge toh
      const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() }, // gt means greater than (time past mein nahi hona chahiye)
      });

      if(!user){
        return res.status(400).json({
          success : false,
          message: "User not found"
        })
      }

      // set password in user

      user.password = password
      
      // resetToken, resetExpiry ko reset kardo (matlab empty)  // reset karte time undefined ka use karo kyoki usse woh field database se gayab ho jayega, null ka use karoge toh woh field abhi bhi database mein rahega, we can also use unset operator (yeh DB level pe kaam mein aata hai), dono ke apne apne use cases hai

      user.resetPasswordToken = undefined

      user.resetPasswordExpires = undefined

      // ab save kardo
      await user.save()

      return res.status(200).json({
        success: true,
        message: "Password reset successful"
      })

    } catch (error) {
      return res.status(500).json({
      success: false,
      message: "Something went wrong"
    })
    }

  } catch (error) {
    return res.status(400).json({
      success: false,
      message: "Token not found or Invalid"
    })
  }
};

export {
  registerUser,
  verifyUser,
  login,
  profile,
  logoutUser,
  resetPassword,
  forgotPassword,
};
