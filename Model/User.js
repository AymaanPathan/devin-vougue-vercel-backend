const mongoose = require("mongoose");
const { isEmail } = require("validator");

const purchasedItemSchema = mongoose.Schema({
  productId: {
    type: mongoose.SchemaTypes.ObjectId,
    ref: "Product",
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  description: String,
  quantity: {
    type: Number,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  purchaseDate: {
    type: Date,
    default: Date.now,
  },
});

const userSchema = mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: isEmail,
      message: "Please provide a valid email",
    },
  },
  password: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  resetToken: String,
  passwordexpries: Date,
  cartdata: {
    type: Object,
  },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },
  Wishlist: [
    {
      type: mongoose.SchemaTypes.ObjectId,
      ref: "Product",
    },
  ],
  purchasedhistory: [purchasedItemSchema],
});

const User = mongoose.model("User", userSchema);
module.exports = User;
