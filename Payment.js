const User = require("./Model/User");
const express = require("express");
const PRODUCT = require("./Model/Product");
const Purchased = require("./Model/Purchased");
const axios = require("axios");
const PDFDocument = require("pdfkit");
const path = require("path");
const fs = require("fs");
const stripe = require("stripe")(
  "sk_test_51PWcHdF8JrqSkfOZEcEQJTlGI18r7EvmXIBwfNFJIqrlpUPGjc6xa8zRlYG1EdUT8Nkbn7hA9o4sIpZiegYBNknr00zhj44VoR"
);

const app = express();
app.use(express.json());

exports.getUserItems = async (req, res) => {
  try {
    const findUser = await User.findOne({ _id: req.user.id });

    if (!findUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const carts = findUser.cartdata;
    const carKey = Object.keys(carts).filter((id) => carts[id] >= 1);
    const Items = await PRODUCT.find({ ItemId: carKey });

    res.json({ Items });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

exports.createStripePayment = async (req, res) => {
  try {
    const findUser = await User.findOne({ _id: req.user.id });

    if (!findUser) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!findUser.purchasedhistory) {
      findUser.purchasedhistory = [];
    }

    const carts = findUser.cartdata;
    const carKey = Object.keys(carts).filter((id) => carts[id] >= 1);
    const products = await PRODUCT.find({ ItemId: carKey });

    const stripeProducts = [];
    let stripeProduct;

    for (const product of products) {
      stripeProduct = await stripe.products.create({
        name: product.name,
        description: product.description,
        metadata: {
          category: product.category,
          color: product.color,
          ItemId: product.ItemId,
          oldPrice: product.oldPrice,
          newPrice: product.newPrice,
        },
      });

      const price = await stripe.prices.create({
        product: stripeProduct.id,
        unit_amount: product.newPrice * 100,
        currency: "inr",
      });

      stripeProducts.push({
        price: price.id,
        quantity: carts[product.ItemId] || 1,
      });
    }

    const itemsParam = products.map((items) => items._id);

    const session = await stripe.checkout.sessions.create({
      line_items: stripeProducts,
      mode: "payment",
      success_url: `http://localhost:5173/success/?item=${itemsParam}&user=${req.user.id}`,
      cancel_url: "http://localhost:5173/payment/cancel",
      customer_email: findUser.email,
    });

    res.json(session);
  } catch (error) {
    console.error("Error creating payment session:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.createPurchasedItems = async (req, res) => {
  try {
    const { item, user } = req.query;

    if (!item || !user) {
      return res.status(400).json({
        Status: "Failed",
        Message: "Please provide all info",
      });
    }

    const items = item.split(",").map((id) => id.trim());
    const purchasedItems = items.map((itemId) => ({ item: itemId, user }));

    await Purchased.insertMany(purchasedItems);

    const userFind = await User.findOne({ _id: user });

    if (!userFind) {
      return res.status(404).json({
        Status: "Failed",
        Message: "User not found",
      });
    }

    const carts = userFind.cartdata;
    const carKey = Object.keys(carts).filter((id) => carts[id] >= 1);
    const itemAdded = await PRODUCT.find({ ItemId: { $in: carKey } });

    for (const product of itemAdded) {
      const quantity = carts[product.ItemId];
      await PRODUCT.updateOne(
        { _id: product._id },
        { $inc: { sales: quantity } }
      );
    }

    if (itemAdded.length === 0) {
      return res.status(404).json({
        Status: "Failed",
        Message: "No products found",
      });
    }

    const data = {
      images: {
        logo: "https://logos-world.net/wp-content/uploads/2021/11/Vogue-Logo-1908.png",
      },
      sender: {
        company: "Devin Vogue",
        address: "Regent Street ",
        zip: "1234 RS",
        city: "London",
        country: "United States",
      },
      client: {
        company: userFind.username,
        address: userFind.email,
        zip: "4567 CD",
        city: "Clientcity",
        country: "Clientcountry",
      },
      information: {
        number: "2021.0001",
        date: new Date().toISOString().split("T")[0],
      },
      products: itemAdded.map((product) => ({
        name: product.name,
        price: product.newPrice,
        quantity: carts[product.ItemId],
        total: product.newPrice * carts[product.ItemId],
      })),
      bottomNotice: "Thanks For Shopping In Devin Vogue",
      settings: { currency: "INR" },
    };

    // Calculate the total price of all items
    const totalPrice = data.products.reduce(
      (sum, product) => sum + product.total,
      0
    );

    // Download the logo image
    const logoResponse = await axios.get(data.images.logo, {
      responseType: "arraybuffer",
    });
    const logoBuffer = Buffer.from(logoResponse.data, "binary");

    // Create a new PDF document
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const filePath = path.join(__dirname, "invoice.pdf");
    const stream = fs.createWriteStream(filePath);

    doc.pipe(stream);

    // Add the logo centered
    doc
      .image(logoBuffer, (doc.page.width - 150) / 2, 30, { width: 150 })
      .moveDown();

    // Add the sender and client information
    doc
      .fontSize(12)
      .text(`From: ${data.sender.company}`, 50, 150)
      .text(`${data.sender.address}`, 50)
      .text(`${data.sender.zip} ${data.sender.city}`, 50)
      .text(`${data.sender.country}`, 50)
      .moveDown();

    doc
      .fontSize(12)
      .text(`To: ${data.client.company}`, 300, 150)
      .text(`${data.client.address}`, 300)
      .moveDown();

    // Add invoice information
    doc
      .fontSize(12)
      .text(`Invoice Number: ${data.information.number}`, 50, 250)
      .text(`Date: ${data.information.date}`)
      .moveDown();

    // Add table header
    doc
      .fontSize(12)
      .text("Product Name", 50, 300)
      .text("Quantity", 250, 300)
      .text("Price", 350, 300)
      .text("Total", 450, 300);

    // Add product details
    let y = 320;
    data.products.forEach((product) => {
      doc
        .fontSize(10)
        .text(product.name, 50, y)
        .text(product.quantity, 250, y)
        .text(`${data.settings.currency} ${product.price}`, 350, y)
        .text(`${data.settings.currency} ${product.total}`, 450, y);
      y += 20; // Adjust vertical position for the next item
    });

    // Add the total price
    doc
      .fontSize(12)
      .text("Total", 350, y)
      .text(`${data.settings.currency} ${totalPrice}`, 450, y + 20);

    // Add bottom notice
    doc.fontSize(12).text(data.bottomNotice, 50, y + 60, { align: "center" });

    // Finalize the PDF and end the stream
    doc.end();

    stream.on("finish", () => {
      res.download(filePath, "Bill.pdf", (err) => {
        if (err) {
          console.error("Error sending file:", err);
          res.status(500).json({ error: "Error sending invoice file" });
        } else {
          fs.unlinkSync(filePath); // Remove the file after sending
          // Redirect to http://localhost:5173/ after download
        }
      });
    });
  } catch (error) {
    console.error("Error generating invoice:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
