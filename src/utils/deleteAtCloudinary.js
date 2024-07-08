import {v2 as cloudinary} from 'cloudinary'
import dotenv from "dotenv"
dotenv.config({
    path: './.env'
})
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET 
});

const deleteAtCloudinary = async(url) => {

    const publicId = url.split('/').pop().split('.')[0];
   await cloudinary.uploader.destroy(publicId, function(error, result) {
  if (error) {
    console.error('Error deleting image:', error);
  } else {
    console.log('Image deleted successfully:', result);
  }
});
}

export {deleteAtCloudinary}