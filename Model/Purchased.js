const mongoose = require("mongoose");

const purchaseSchema = new mongoose.Schema({
  item: {
    type: mongoose.Schema.ObjectId,
    ref: "Product",
    required: [true, "item must belong to product"],
  },
  user: {
    type: mongoose.Schema.ObjectId,
    ref: "User",
    required: [true, "User must belong to user"],
  },
  paid: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
});

const Purchased = mongoose.model("Purchased", purchaseSchema);
module.exports = Purchased;
