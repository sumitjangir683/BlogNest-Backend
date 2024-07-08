import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { User } from "../models/user.models.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"
import { Post } from "../models/post.model.js"
import dotenv from 'dotenv'
import { deleteAtCloudinary } from "../utils/deleteAtCloudinary.js";
dotenv.config({
    path: './.env'
})

const addPost = asyncHandler(async (req, res) => {

    const { title, content, status } = req.body
  console.log(title);
    if ([title, content, status].some((field) => field?.trim() == "")) {
        throw new ApiError(400, "All Fields are required")
    }
    //    console.log(email);
    //    console.log(req.files)
   //console.log(req.file);
    const imageLocalPath = req.file?.path;

    if (!imageLocalPath) {
        throw new ApiError(400, "Image file is required")
    }

    const image = await uploadOnCloudinary(imageLocalPath)

    // console.log(image);
    if (!image) {
        throw new ApiError(400, "Image file is required")
    }


    const post = await Post.create({
        title,
        image: image.url,
        content,
        status,
        owner: req.user._id
    })

    if (!post) {
        throw new ApiError(500, "Something went wrong while adding the post")
    }


    return res
        .status(200)
        .json(
            new ApiResponse(200, post, "Post added Successfully")
        )

})


const getAllPosts = asyncHandler(async (req,res) => {
   const posts = await Post.find({})
   return res
   .status(200)
   .json(
       new ApiResponse(200, posts, "All posts fetched Successfully")
   )

})

const getCurrentPost = asyncHandler(async(req,res) =>{
    const {_id }  = req.params
    if(!_id){
        throw new ApiError(400, "id is missing")
    }
    const post = await Post.findById(_id)
   // console.log(post)
    if(!post){
        throw new ApiError(400, "post doesn't exists")
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200, post, "Current post fetched successfully")
    )
})

const deletePost = asyncHandler(async(req,res) => {
const {_id } = req.params

if(!_id){
    throw new ApiError(400, "id is missing")
}
const post = await Post.findById(_id)
//console.log(post);
const previousImageUrl= post?.image;

await deleteAtCloudinary(previousImageUrl)

await Post.findByIdAndDelete(_id)

  return res
  .status(200)
  .json(
      new ApiResponse(200, {} , "Post deleted successfully")
  )
    
})

const updatePost = asyncHandler(async (req, res) => {
     const { _id } = req.params
    const { title, content, status } = req.body
    // console.log(_id);
    // console.log(title);
    if ([title, content, status].some((field) => field?.trim() == "")) {
        throw new ApiError(400, "All Fields are required")
    }
    //    console.log(email);
    // console.log(req.file)
  let imageLocalPath;
    if(req.file?.path){
    imageLocalPath = req.file?.path;
}
    let uploadedImage;
    if(imageLocalPath)
   {  uploadedImage = await uploadOnCloudinary(imageLocalPath)}

   const previosUrl = Post.findById(_id).image
   if(uploadedImage && previosUrl ){
    await deleteAtCloudinary(previosUrl)
   }
    const updatedPost = await Post.findByIdAndUpdate(
        _id,
        {
            $set:{
                title,
                content,
                status,
                image:uploadedImage ? uploadedImage.url : previosUrl
            }
        }
    )
  
    if (!updatePost) {
        throw new ApiError(500, "Something went wrong while updating the post")
    }


    return res
        .status(200)
        .json(
            new ApiResponse(200, updatedPost, "Post updated Successfully")
        )

})

export { 
    addPost,
    getAllPosts,
    getCurrentPost,
    deletePost,
    updatePost
 }