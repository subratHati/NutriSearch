const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
    cloud_name:process.env.CLOUD_NAME,
    api_key:process.env.CLOUD_API_KEY,
    api_secret:process.env.CLOUD_API_SECRET,
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: 'nutriSearch_DEV', // Here we set our folder name(where our files are saved in cloudinary)
      allowedFormats: ["png", "jpg", "jpeg"],  //And we allowed these formats.
    },
  });

  module.exports = {
    cloudinary,
    storage,
  }