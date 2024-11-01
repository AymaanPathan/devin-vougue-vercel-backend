const express = require("express");
const mongoose = require("mongoose");
const Payment = require("./Payment");
const Auth = require("./Auth/Auth");
const User = require("./Model/User");
const Invoice = require("./invoice/invoice");
const cors = require("cors");
const Product = require("./Product/Product");
const { upload, uploadFile } = require("./UploadImage/upload"); // Import upload and handler
const path = require("path");
const app = express();
const sendEmail = require("./Auth/Email");

app.use(express.urlencoded({ extended: false }));
app.use(cors({ origin: "*" }));
app.use(express.json());

const port = 8080;

// MongoDb Connection
const connectDb = async () => {
  try {
    const response = await mongoose.connect(
      "mongodb+srv://aymaan:1234@cluster0.rv9jdh7.mongodb.net/ecommerce",
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 30000,
      }
    );
    console.log("Connected To DataBase⭐");
  } catch (error) {
    console.log("Error in Mongo", error);
  }
};
connectDb();

// Serve uploaded files statically
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routing
const Router = express.Router();

// Purchased Routes
Router.get("/success", Payment.createPurchasedItems);

Router.get("/myOrders", Auth.protect, Product.myOrders);

// Images
Router.post("/upload", upload.single("productImage"), uploadFile);

// Auth
Router.get("/AllUsers", Auth.AllUsers);
Router.delete("/deleteUser", Auth.deleteUsers);
Router.post("/register", Auth.Register);
Router.post("/login", Auth.Login);
Router.put("/updateEmail", Auth.protect, Auth.changeEmail);
Router.put("/updatePassword", Auth.protect, Auth.changePassword);
Router.put("/changeUserName", Auth.changeUserName);
Router.post("/forgetPassword", Auth.forgetPassword);
Router.post("/resetPassword/:token", Auth.resetPassword);

// Admin
Router.put("/updateEmailByAdmin", Auth.changeEmailByAdmin);
Router.put("/updateUserNameByAdmin", Auth.changeUserNameByAdmin);

// Product
Router.get("/all-products", Product.GetAllProducts);
Router.get("/bestSelling", Product.BestSelling);
Router.post("/Addproduct", Auth.protect, Auth.authRole, Product.AddProduct);
Router.delete("/delete-product", Auth.protect, Product.DeleteProduct);
Router.get("/product/:id", Product.GetOneProduct);
Router.post("/AddToCart", Auth.protect, Product.AddToCart);
Router.post("/RemoveFromCart", Auth.protect, Product.RemoveFromCart);
Router.post("/GetCart", Auth.protect, Product.GetCart);
Router.post("/EmptyCart", Auth.protect, Product.EmptyCart);
Router.post("/userCartCount", Auth.protect, Product.CartCount);
Router.get("/men", Product.GetMenProducts);
Router.get("/women", Product.GetWomenProducts);

// Wishlist
Router.get("/GetWishlist", Auth.protect, Product.GetWishlist);
Router.post("/AddWishlist", Auth.protect, Product.AddWishlist);
Router.post("/RemoveWishlist", Auth.protect, Product.RemoveWishlist);

// Payment
Router.post("/userItems", Auth.protect, Payment.getUserItems);
Router.post("/payment", Auth.protect, Payment.createStripePayment);

// Send News Mail
Router.post("/sendEmail", sendEmail.sendNewsLetter);

// Invoice
Router.post("/invoice", Invoice.handleInvoice);
// Route to get all
app.use(Router);

app.listen(port, "0.0.0.0", () => {
  console.log(`Server Started 🟢`);
});
