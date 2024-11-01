const express = require("express");
const PRODUCT = require("../Model/Product");
const purchasedItems = require("../Model/Purchased");
const User = require("../Model/User");
const app = express();

app.use(express.json());

// Add Product

exports.AddProduct = async (req, res) => {
  try {
    const {
      ItemId,
      name,
      category,
      image,
      newPrice,
      oldPrice,
      color,
      description,
    } = req.body;

    // Validate input data
    if (
      !ItemId ||
      !name ||
      !description ||
      !category ||
      !image ||
      !newPrice ||
      !oldPrice ||
      !color
    ) {
      return res.status(400).json({
        status: "Error",
        message: "All fields are required.",
      });
    }

    if (isNaN(ItemId) || isNaN(newPrice) || isNaN(oldPrice)) {
      return res.status(400).json({
        status: "Error",
        message: "Prices & ID must be valid numbers.",
      });
    }

    // Create product
    const item = await PRODUCT.create({
      ItemId: parseFloat(ItemId),
      name,
      category,
      image,
      newPrice: parseFloat(newPrice),
      oldPrice: parseFloat(oldPrice),
      color: color,
      description,
    });

    res.status(200).json({
      status: "Success",
      product: item,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "Error",
      message: "Failed to add product.",
    });
  }
};

// Remove Product
exports.DeleteProduct = async (req, res) => {
  try {
    const { ItemId } = req.body;

    if (!ItemId) {
      return res.status(400).json({
        status: "Error",
        message: "ItemId is required.",
      });
    }

    const product = await PRODUCT.findOneAndDelete({ ItemId });

    if (!product) {
      return res.status(404).json({
        status: "Error",
        message: "Product not found.",
      });
    }

    res.status(200).json({
      status: "Success",
      message: "Product deleted successfully.",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "Error",
      message: "Failed to delete product.",
    });
  }
};

exports.GetAllProducts = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const AllProduct = await PRODUCT.find();
    const products = await PRODUCT.find().skip(skip).limit(limit);

    const count = await PRODUCT.countDocuments();
    const totalPage = count / limit;

    res.status(200).json({
      status: "Success",
      data: products.length,
      TotalPage: totalPage,
      currentPage: page,
      count,
      products,
      AllProduct,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "Error",
      message: "Failed to retrieve products.",
    });
  }
};

exports.BestSelling = async (req, res, next) => {
  try {
    const sort = (req.query.sort = "-sales");
    const limit = (req.query.limit = 4);

    const products = await PRODUCT.find().sort(sort).limit(limit);
    res.status(200).json({
      Status: "Success",
      length: products.length,
      Data: products,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      Status: "Failed",
      Message: "Try Again Later",
    });
  }
};

// ProductController.js or ProductModule.js
exports.GetOneProduct = async (req, res) => {
  try {
    let query = await PRODUCT.findOne({ ItemId: Number(req.params.id) });
    res.json(query);
  } catch (error) {
    console.log(error);
  }
};

// Add To Cart   ---> Here Users Id Will Add Items
exports.AddToCart = async (req, res) => {
  let userData = await User.findOne({ _id: req.user.id });
  userData.cartdata[req.body.ItemId] += 1;
  await User.findOneAndUpdate(
    { _id: req.user.id },
    { cartdata: userData.cartdata }
  );
  res.json(userData.cartdata);
};

// Remove From cart
exports.RemoveFromCart = async (req, res) => {
  let UserData = await User.findOne({ _id: req.user.id });
  UserData.cartdata[req.body.ItemId] -= 1;

  if (UserData.cartdata[req.body.ItemId] <= 0) {
    UserData.cartdata[req.body.ItemId] = 0;
  }
  await User.findOneAndUpdate(
    { _id: req.user.id },
    { cartdata: UserData.cartdata }
  );
  res.json(UserData.cartdata);
};

// Get Cart
exports.GetCart = async (req, res) => {
  try {
    // Find the user by ID
    const userData = await User.findOne({ _id: req.user.id });
    if (!userData) {
      return res.status(404).json({
        status: "Failure",
        message: "User not found",
      });
    }

    res.json({
      status: "Success",
      data: userData.cartdata,
    });
  } catch (error) {
    console.error("Error fetching cart data:", error);
    res.status(500).json({
      status: "Error",
      message: "An error occurred while fetching cart data",
    });
  }
};

exports.EmptyCart = async (req, res) => {
  let cart = {};
  for (let i = 1; i <= 300; i++) {
    cart[i] = 0;
  }
  try {
    // Empty the cart using findOneAndUpdate
    const updatedUser = await User.findOneAndUpdate(
      { _id: req.user.id },
      { $set: { cartdata: cart } },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({
        status: "error",
        message: "User Not Found",
      });
    }

    // Send a success response with the updated cart data
    res.status(200).json({
      status: "success",
      message: "Cart is now empty",
      data: updatedUser.cartdata,
    });
  } catch (error) {
    // Handle any errors that occur
    console.error("Error emptying cart:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to empty cart",
    });
  }
};

exports.CartCount = async (req, res) => {
  try {
    const id = req.user.id;
    const user = await User.findById(id);
    const userCartData = user.cartdata;
    const userProducts = Object.keys(userCartData).filter(
      (id) => Number(userCartData[id]) > 0
    );
    const userItems = userProducts.map((id) => Number(id));

    const userCartItem = await PRODUCT.find({ ItemId: userItems });

    res.status(200).json({
      Status: "Sucess",
      Data: userItems,
      userCartCount: userCartItem.length,
      userCartItem,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      Status: "Failed",
    });
  }
};

// Wishlist
exports.AddWishlist = async (req, res) => {
  try {
    const { _id } = req.body;
    const userData = await User.findOneAndUpdate(
      { _id: req.user.id },
      { $addToSet: { Wishlist: _id } },
      { new: true }
    );
    res.json(userData);
  } catch (error) {
    console.log(error);
  }
};

exports.RemoveWishlist = async (req, res) => {
  try {
    const { _id } = req.body;

    const userData = await User.findOneAndUpdate(
      { _id: req.user.id },
      { $pull: { Wishlist: _id } },
      { new: true }
    );

    res.json(userData);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Server error" });
  }
};

exports.GetWishlist = async (req, res) => {
  try {
    const user = req.user.id;
    if (!user) {
      res.status(401).json({
        Status: "Failed",
        Message: "User Not found",
      });
    }
    const UserData = await User.findById(user);
    const UserWishlist = UserData.Wishlist;

    const Items = await PRODUCT.find({ _id: { $in: UserWishlist } });

    res.status(200).json({
      Status: "Success",
      Data: Items,
    });
  } catch (err) {
    res.status(500).json({
      Status: "Failed",
      Message: "Please try again later",
    });
    console.log(err);
  }
};

exports.myOrders = async (req, res) => {
  try {
    const user = req.user.id;
    // Fetch purchased items associated with the user
    const items = await purchasedItems.find({ user: user });

    if (!items || items.length === 0) {
      return res.status(404).json({
        Status: "Failed",
        Message: "No Order found",
      });
    }

    // Collect all item IDs from the purchased items
    const userItemsId = items.map((item) => item.item);

    // Fetch details of the items using the collected item IDs
    const userItems = await PRODUCT.find({ _id: userItemsId });

    const usersUpdated = await User.findOneAndUpdate(
      { _id: user },
      { purchasedhistory: userItems },
      { new: true }
    );

    res.status(200).json({
      Status: "Success",
      TotalItems: userItems.length,
      userIds: userItemsId.length,
      userItemsId,
      userItems,
    });
  } catch (err) {
    console.error("Unexpected Error:", err);
    res.status(500).json({
      Status: "Failed",
      Message: "Internal Server Error",
    });
  }
};

exports.GetMenProducts = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = req.query.limit || 10;
    const skip = (page - 1) * limit;
    const category = "men";
    if (!category) {
      res.status(400).json({
        Data: "please provide category",
      });
    }
    const menItems = await PRODUCT.find({ category: category })
      .skip(skip)
      .limit(limit);
    const count = await PRODUCT.countDocuments({ category: category });
    if (!menItems) {
      return res.status(400).json({
        Message: `No Item Found Of  ${category}`,
        Status: "Failed",
      });
    }
    res.status(200).json({
      Status: "Success",
      length: menItems.length,
      currentPage: page,
      totalPage: count / limit,
      Data: menItems,
    });
  } catch (err) {
    res.status(500).json({
      Status: "failed",
    });
    console.log(err);
  }
};

exports.GetWomenProducts = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = req.query.limit || 10;
    const skip = (page - 1) * limit;
    const category = "women";
    if (!category) {
      res.status(400).json({
        Data: "please provide category",
      });
    }
    const menItems = await PRODUCT.find({ category: category })
      .skip(skip)
      .limit(limit);
    const count = await PRODUCT.countDocuments({ category: category });
    if (!menItems) {
      return res.status(400).json({
        Message: `No Item Found Of  ${category}`,
        Status: "Failed",
      });
    }
    res.status(200).json({
      Status: "Success",
      length: menItems.length,
      currentPage: page,
      totalPage: count / limit,
      Data: menItems,
    });
  } catch (err) {
    res.status(500).json({
      Status: "failed",
    });
    console.log(err);
  }
};
