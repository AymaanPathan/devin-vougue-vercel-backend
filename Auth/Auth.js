const express = require("express");
const User = require("../Model/User");
const { promisify } = require("util");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const bcrypt = require("bcrypt");
const app = express();
const crypto = require("crypto");
const sendEmail = require("./Email");
dotenv.config({ path: "./config.env" });

app.use(express.json());

// Registration
exports.Register = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    // Validate inputs
    if (!username || !email || !password) {
      return res.status(401).json({
        Status: "Failed",
        Message: "Please provide username, email, and password",
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(402).json({
        Status: "Failed",
        Message: "Account is already created By this email",
      });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create new user
    let cart = {};
    for (let i = 1; i <= 300; i++) {
      cart[i] = 0;
    }
    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
      role: role,
      cartdata: cart,
    });

    // Generate JWT token
    const token = jwt.sign({ id: newUser._id }, "qwerty12345", {
      expiresIn: "90d",
    });
    req.user = newUser;
    res.status(200).json({
      Status: "Success",
      Message: "Account has been created",
      role: newUser.role,
      email: newUser.email,
      username: username,
      Token: token,
      cartdata: cart,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      res.status(402).json({ error: error.message });
    } else {
      res.status(500).json({
        Status: "Failed",
        Message: "Please try again later",
      });
      console.error("Error while creating account:", error);
    }
  }
};

// Login
exports.Login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!email || !password) {
      return res.status(400).json({
        Status: "Failed",
        Message: "please provide EMAIL and PASSWORD",
      });
    }

    if (!user) {
      return res.status(401).json({
        Status: "Failed",
        Message: "User Not Found With This Email Id",
      });
    }
    const comparePass = await bcrypt.compare(password, user.password);
    if (!comparePass) {
      return res.status(402).json({
        Status: "Failed",
        Message: "Password is incorrect",
      });
    }

    const token = jwt.sign({ id: user._id }, "qwerty12345", {
      expiresIn: "90d",
    });

    req.user = user;
    res.status(200).json({
      Status: "Success",
      Message: "Login  SuccessFull",
      Token: token,
      role: user.role,
      purchasedItems: user.purchasedhistory.length,
      purchasedhistory: user.purchasedhistory,
      email: user.email,
      username: user.username,
      cartdata: user.cartdata,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      Status: "Failed",
      Message: "Failure While Login Account",
    });
  }
};

exports.protect = async (req, res, next) => {
  const token = req.header("token");
  if (!token) {
    return res.status(401).send({
      Status: "Failed",
      Message: "Please Login To Continue",
    });
  }

  try {
    const data = jwt.verify(token, "qwerty12345");
    req.user = await User.findById(data.id);
    if (!req.user) {
      return res.status(401).send({
        Status: "Failed",
        Message: "User not found",
      });
    }
    next();
  } catch (error) {
    return res.status(401).send({
      Status: "Failed",
      Message: "Invalid Token",
    });
  }
};

exports.authRole = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(401).json({
      Status: "Failed",
      Message: "Access Denied",
    });
  }
  next();
};

exports.changeEmail = async (req, res) => {
  try {
    const { email } = req.body;
    const id = req.user.id;

    // Regular expression for validating an email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email) {
      return res.status(400).json({
        Status: "Failed",
        Message: "Please provide email",
      });
    }

    // Check if email format is valid
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        Status: "Failed",
        Message: "Invalid email format",
      });
    }

    const existingUser = await User.findOne({ email: email });
    if (existingUser) {
      return res.status(400).json({
        Status: "Failed",
        Message: "This email is already in use",
      });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { email: email },
      { new: true }
    );
    if (!user) {
      return res.status(404).json({
        Status: "Failed",
        Message: "User Not found",
      });
    }

    res.status(200).json({
      Status: "Success",
      Message: "Email Changed Successfully",
      Data: user,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      Status: "Failed",
      Message: "Internal Server Error",
    });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        status: "Failed",
        message: "Please provide current password and new password",
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        status: "Failed",
        message: "User not found",
      });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({
        status: "Failed",
        message: "Current password is incorrect",
      });
    }

    user.password = await bcrypt.hash(newPassword, 12);
    await user.save({ validateBeforeSave: false });

    return res.status(200).json({
      status: "Success",
      message: "Password changed successfully",
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      status: "Failed",
      message: "An error occurred while changing the password",
    });
  }
};

exports.changeUserName = async (req, res) => {
  try {
    const { userName, id } = req.body;

    const existingUser = await User.findOne({ username: userName });
    if (existingUser) {
      return res.status(400).json({
        Status: "Failed",
        Message: "This Username is already in use",
      });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { username: userName },
      { new: true }
    );
    if (!user) {
      return res.status(404).json({
        Status: "Failed",
        Message: "User Not found",
      });
    }

    res.status(200).json({
      Status: "Success",
      Message: "Username Changed Successfully",
      Data: user,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      Status: "Failed",
      Message: "Internal Server Error",
    });
  }
};

exports.forgetPassword = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(400).json({
        Status: "Failed",
        Message: "Cannot find user with this email",
      });
    }

    const token = crypto.randomBytes(5).toString("hex");

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    user.resetToken = hashedToken;
    user.passwordexpries = Date.now() + 10 * 60 * 1000;
    await user.save({ validateBeforeSave: false });

    const message = `Reset token: ${token}`;

    await sendEmail.sendEmail({
      email: req.body.email,
      subject: "Your Reset Token",
      message: message,
    });

    res.status(200).json({
      Status: "Success",
      UserToken: token,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      Status: "Failed",
      Message: "Try again later",
    });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword) {
      return res.status(400).json({
        Status: "Failed",
        Message: "Please provide new password",
      });
    }
    const hashedtoken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");
    const user = await User.findOne({
      resetToken: hashedtoken,
      passwordexpries: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        Status: "Failed",
        Message: "Token is invalid or Token has expired",
      });
    }
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    user.password = hashedPassword;
    user.resetToken = undefined;
    user.passwordexpries = undefined;
    await user.save();

    res.status(200).json({
      Status: "Success",
      Message: "password has updated",
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      Status: "Failed",
      Message: "Please try again later",
    });
  }
};

exports.AllUsers = async (req, res) => {
  try {
    const users = await User.find();
    if (!users) {
      return res.status(400).json({
        Statua: "Failed",
        Message: "There Are No Users Till Now",
      });
    }
    res.status(200).json({
      users,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      Status: "Failed",
      Message: "Please Try Again Later, Internal Error",
    });
  }
};

exports.deleteUsers = async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findOneAndDelete({ _id: userId });
    if (!user) {
      return res.status(404).json({
        Status: "Failed",
        Message: "Users Not Found",
      });
    }
    res.status(200).json({
      Status: "Success",
      Message: "User Deleted Successfully",
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      Status: "Failed",
      Message: "Please Try Again Later, Internal Error",
    });
  }
};

/// Admin
exports.changeEmailByAdmin = async (req, res) => {
  try {
    const { email, newEmail } = req.body;

    // Regular expression for validating an email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email || !newEmail) {
      return res.status(400).json({
        Status: "Failed",
        Message: "Please provide email and newEmail",
      });
    }

    // Check if email format is valid
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        Status: "Failed",
        Message: "Invalid email format",
      });
    }

    const existingUser = await User.findOne({ email: newEmail });
    if (existingUser) {
      return res.status(400).json({
        Status: "Failed",
        Message: "This email is already in use",
      });
    }

    const user = await User.findOneAndUpdate(
      { email: email },
      { email: newEmail },
      { new: true }
    );
    if (!user) {
      return res.status(404).json({
        Status: "Failed",
        Message: "User Not found",
      });
    }

    res.status(200).json({
      Status: "Success",
      Message: "Email Changed Successfully",
      Data: user,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      Status: "Failed",
      Message: "Internal Server Error",
    });
  }
};

exports.changeUserNameByAdmin = async (req, res) => {
  try {
    const { userName, newUserName } = req.body;

    if (!userName || !newUserName) {
      return res.status(400).json({
        Status: "Failed",
        Message: "Please provide username and newUserName",
      });
    }

    const existingUser = await User.findOne({ username: newUserName });
    if (existingUser) {
      return res.status(400).json({
        Status: "Failed",
        Message: "This Username is already in use",
      });
    }

    const user = await User.findOneAndUpdate(
      { username: userName },
      { username: newUserName },
      { new: true }
    );
    if (!user) {
      return res.status(404).json({
        Status: "Failed",
        Message: "User Not found",
      });
    }

    res.status(200).json({
      Status: "Success",
      Message: "Username Changed Successfully",
      Data: user,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      Status: "Failed",
      Message: "Internal Server Error",
    });
  }
};
