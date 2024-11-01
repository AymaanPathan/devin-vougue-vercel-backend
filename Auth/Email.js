const nodemailer = require("nodemailer");

const sendEmail = async (options) => {
  const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: {
      user: "aymaanpathan5@gmail.com",
      pass: "shke aviz whyw uhwd",
    },
  });

  const mailOption = {
    from: '"DevinVogue.com" <no-reply@devinvogue.com>',
    to: options.email,
    subject: options.subject,
    text: options.message,
  };

  try {
    await transporter.sendMail(mailOption);
    console.log("Email sent successfully!");
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

const sendNewsLetter = async (req, res) => {
  try {
    const { email } = req.body;
    const emailSplit = email.split("@");
    const name = emailSplit[0];
    if (!email || !name) {
      return res.status(400).json({
        status: "Failed",
        message: "Email and name are required",
      });
    }

    const subject = "Welcome! You’re Subscribed to Our Newsletter";
    const message = `
Hi ${name},

Congratulations and Welcome!

We are delighted to announce that you are now officially subscribed to our newsletter. Thank you for joining our community! We are excited to bring you the latest news and updates on our upcoming collection.

Here’s What You Can Look Forward To:
- First Look at New Collections: Be among the first to know about our newest arrivals.
- Exclusive Offers and Discounts: Enjoy special promotions available only to our subscribers.
- Behind-the-Scenes Sneak Peeks: Get insider access to the creative process behind our products.
- Latest News and Updates: Stay informed about our brand’s latest endeavors, events, and more.

Stay Tuned!
Our team is dedicated to providing you with content that is both inspiring and informative. Expect to see exciting updates and exclusive previews in your inbox soon.

Got Questions?
If you have any questions, feedback, or just want to say hello, feel free to reach out to us at [Your Contact Information]. We are always here to help and love hearing from our community.

Thank You!
Thank you once again for subscribing. We are thrilled to have you with us and look forward to sharing our journey with you.`;

    await sendEmail({ email, subject, message });

    console.log("Message sent: %s");
    res.status(200).json({
      status: "Success",
      message: "Email sent successfully",
      data: { email, subject, message },
    });
  } catch (error) {
    console.error("Error sending email:", error);
    res.status(500).json({
      status: "Error",
      message: "Error sending email",
      error: error.message,
    });
  }
};

module.exports = { sendEmail, sendNewsLetter };
