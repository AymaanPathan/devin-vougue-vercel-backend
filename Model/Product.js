const mongoose = require("mongoose");
const ProductSchema = mongoose.Schema({
  ItemId: {
    type: Number,
    unique: [true, "ItemId Must be Unique"],
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  newPrice: {
    type: Number,
    required: true,
  },
  sales: {
    type: Number,
    default: 0,
  },
  oldPrice: {
    type: Number,
    required: true,
  },
  color: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
});

const Product = mongoose.model("Product", ProductSchema);
module.exports = Product;
