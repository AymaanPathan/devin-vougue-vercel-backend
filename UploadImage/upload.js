const multer = require("multer");
const path = require("path");

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./uploads"); // Ensure 'uploads' directory exists
  },
  filename: function (req, file, cb) {
    cb(
      null,
      `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`
    );
  },
});

// Initialize multer with storage configuration
const upload = multer({ storage: storage });

const uploadFile = (req, res) => {
  console.log(req.body);
  console.log(req.file);
  if (!req.file) {
    return res.status(400).send("No file uploaded");
  }
  return res.status(200).json({
    Status: "Success",
    image_url: `http://localhost:8080/uploads/${req.file.filename}`,
  });
};

module.exports = {
  upload,
  uploadFile,
};
