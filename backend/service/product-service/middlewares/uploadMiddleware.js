const fs = require("fs");
const path = require("path");
const multer = require("multer");

const uploadDir = path.join(__dirname, "../../../public/img");

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "");
    const baseName = path
      .basename(file.originalname || "image", ext)
      .replace(/[^a-zA-Z0-9_-]/g, "-");
    cb(null, `${Date.now()}-${baseName}${ext}`);
  }
});

const imageFileFilter = (req, file, cb) => {
  if (!file.mimetype || !file.mimetype.startsWith("image/")) {
    return cb(new Error("Only image files are allowed"));
  }
  return cb(null, true);
};

const uploadProductImage = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});

module.exports = {
  uploadProductImage
};
