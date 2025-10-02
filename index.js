import express from "express";

import dotenv from "dotenv";

import cors from "cors";

import db from "./utils/dbConnection.js";

import userRoutes from "./routes/user.routes.js";

import cookieParser from "cookie-parser";

dotenv.config();

db();

const port = process.env.PORT || 4000;

const app = express();

app.use(
  cors({
    // origin ka matlab hai ki kaha se request aane dena chahta hu main
    origin: process.env.BASE_URL, // Multiple origins allow karne hai toh array mein daalke comma seperated values likh sakte ho
    credentials: true,
    methods: ["GET", "POST", "DELETE", "OPTIONS"], // kaun kaun se methods allow karne hai (case-sensitive nahi hote hai)
    allowedHeaders: ["Content-Type", "Authorization"], // Content-Type case sensitive hai
  })
);

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use(cookieParser()); // ab isse yeh hua hai ki aap req aur res mein cookies ko access kar sakte ho

app.get("/", (req, res) => {
  res.send(` <body style="background-color: black; color: white; display: flex; justify-content: center; align-items: center;"> 
                <h1 style = "font-size: 100px;">Auth</h1>
    `);
});

app.use("/api/v1/users", userRoutes);

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});
