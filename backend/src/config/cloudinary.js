const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const isCloudinaryConfigured = process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_KEY !== 'your_api_key';

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

// Fallback local storage
const localUploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(localUploadsDir)) {
  fs.mkdirSync(localUploadsDir, { recursive: true });
}

const localDiskStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, localUploadsDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const storage = isCloudinaryConfigured ? new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'library/books',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 400, height: 600, crop: 'fill', quality: 'auto' }],
  },
}) : localDiskStorage;

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

const avatarStorage = isCloudinaryConfigured ? new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'library/avatars',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 250, height: 250, crop: 'fill', gravity: 'face', quality: 'auto', radius: 'max' }],
  },
}) : localDiskStorage;

const uploadAvatar = multer({
  storage: avatarStorage,
  limits: { fileSize: 3 * 1024 * 1024 }, // 3MB for avatars
});

module.exports = { cloudinary: isCloudinaryConfigured ? cloudinary : null, upload, uploadAvatar };
