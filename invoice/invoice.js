const express = require("express");
const easyinvoice = require("easyinvoice");
const fs = require("fs");
const path = require("path");
const User = require("../Model/User");

const app = express();
app.use(express.json()); // To parse JSON request bodies

exports.handleInvoice = async (req, res) => {
  try {
    const userId = req.query.user;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Ensure user.purchasedhistory has at least one item
    if (!user.purchasedhistory || user.purchasedhistory.length === 0) {
      return res.status(400).json({ error: "No purchase history available" });
    }

    // Get the first product's details
    const product = user.purchasedhistory;

    const data = {
      apiKey:
        "bRgHO3V690vaHLSku7XORN9w7bvCLTqmoXNUrRAyglhCnBxGat3YPqHnysKGLI0O",
      mode: "production",
      images: {
        logo: "https://logos-world.net/wp-content/uploads/2021/11/Vogue-Logo-1908.png",
      },
      sender: {
        company: "Sample Corp",
        address: "Sample Street 123",
        zip: "1234 AB",
        city: "Sampletown",
        country: "Samplecountry",
      },
      client: {
        company: "Client Corp",
        address: "Clientstreet 456",
        zip: "4567 CD",
        city: "Clientcity",
        country: "Clientcountry",
      },
      information: {
        number: "2021.0001",
        date: new Date().toISOString().split("T")[0],
        dueDate: new Date(new Date().setDate(new Date().getDate() + 30))
          .toISOString()
          .split("T")[0], // Due date 30 days from now
      },
      products: [
        {
          quantity: product.quantity,
          description: product.description,
          name: product.name,
          price: product.price,
          total: product.price * product.quantity,
        },
      ],
      bottomNotice: "Thanks For Shopping In Devin Vogue",
      settings: { currency: "INR" },
      translate: {},
    };

    const result = await easyinvoice.createInvoice(data);

    const filePath = path.join(__dirname, "myInvoice.pdf");
    fs.writeFileSync(filePath, result.pdf, "base64");

    // Send the file as a download
    res.download(filePath, "invoice.pdf", (err) => {
      if (err) {
        console.error("Error sending file:", err);
        res.status(500).json({ error: "Error sending invoice file" });
      }
      fs.unlinkSync(filePath);
    });
  } catch (error) {
    console.error("Error generating invoice:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
