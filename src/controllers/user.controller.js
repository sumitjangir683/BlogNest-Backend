import { asyncHandler } from "../utils/asyncHandler.js";
import mongoose from "mongoose";
import {ApiError} from "../utils/ApiError.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import {User} from "../models/user.models.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"
import { deleteAtCloudinary } from "../utils/deleteAtCloudinary.js";
import dotenv from 'dotenv'
dotenv.config({
    path: './.env'
})
const generateAccessAndRefereshTokens = async(userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()
        console.log("fun",refreshToken);
        user.refreshToken = refreshToken
        user.save({validateBeforeSave: false})
        return { accessToken, refreshToken}
        
    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating referesh and access token")
    }
}
const registerUser = asyncHandler(async(req,res) => {
    // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res
    const{ fullName , email, username, password } = req.body
  
    if ([fullName, email, username, password].some((field) => field?.trim() == "")){
        throw new ApiError(400,"All Fields are required")
    }
    const existedUser = await User.findOne({
        $or : [{ username }, { email }]
    })
    if (existedUser) {
        throw new ApiError(409, "User with email or username already exists")
    }
   console.log(email);
   console.log(req.files)
    
   // console.log(req.files);
   const avatarLocalPath = req.files?.avatar[0].path;
   //console.log(avatarLocalPath);
  // console.log("sumit is here at avatarlocal path");
   //const coverImageLocalPath = req.files?.coverImage[0]?.path;
   
   let coverImageLocalPath;
   if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
       coverImageLocalPath = req.files.coverImage[0].path
   }
//    console.log(avatarLocalPath);
//    console.log(req.files.avatar[0].path)

   if (!avatarLocalPath) {
       throw new ApiError(400, "Avatar file is required")
   }

   const avatar = await uploadOnCloudinary(avatarLocalPath)
   const coverImage = await uploadOnCloudinary(coverImageLocalPath)
 // console.log(avatar);
   if (!avatar) {
       throw new ApiError(400, "Avatar file is required")
   }
  

   const user = await User.create({
       fullName,
       avatar: avatar.url,
       coverImage: coverImage?.url || "",
       email, 
       password,
       username: username.toLowerCase()
   })
   const {accessToken, refreshToken} = await generateAccessAndRefereshTokens(user._id)
   const createdUser = await User.findById(user._id).select(
       "-password -refreshToken"
   )

   if (!createdUser) {
       throw new ApiError(500, "Something went wrong while registering the user")
   }
    
   const options ={
    httpOnly:false,
    secure:false
   }
  return res
  .status(200)
  .cookie("accessToken", accessToken,options)
  .cookie("refreshToken",refreshToken,options).json(
       new ApiResponse(200, createdUser, "User registered Successfully")
   )

} )

const loginUser = asyncHandler(async(req,res) => {
     // req body -> data
    // username or email
    //find the user
    //password check
    //access and referesh token
    //send cookie
   const { username, email, password} =req.body
  // console.log(email);
   if(!username && !email){
    throw new ApiError(400, "username or email is required")
   }
   const user = await User.findOne({
    $or: [{username},{email}]
   })
   if(!user){
    throw new ApiError(401, "Please sign up")
   }
   const isPasswordValid = await user.isPasswordCorrect(password)
  if(!isPasswordValid){
    throw new ApiError(401, "Invalid user credentials")
    }
    const {accessToken, refreshToken} = await generateAccessAndRefereshTokens(user._id)
   // console.log("login time", refreshToken);
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
   const options ={
    httpOnly:false,
    secure:false
   }
   
  return res
  .status(200)
  .cookie("accessToken", accessToken,options)
  .cookie("refreshToken",refreshToken,options)
  .json(
    new ApiResponse(
        200,
        {
            user: loggedInUser, accessToken, refreshToken
        },
        "User logged In Successfully"
    )
  )
})

const logoutUser = asyncHandler(async(req,res) => {
   User.findByIdAndUpdate(
    req.user._id,
    {
        $unset:{
         refreshToken:1
        }
    },
    {
        new:true
    }
   )

   const options = {
    httpOnly:false,
    secure:false
   }

   return res
   .status(200)
   .clearCookie("accessToken",options)
   .clearCookie("refreshToken",options)
   .json(new ApiResponse(200, {}, "User logged Out"))
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
console.log(incomingRefreshToken);
    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
    
        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }
    
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
            
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const {accessToken, refreshToken} = await generateAccessAndRefereshTokens(user._id)
        // console.log("sumit new",accessToken);
        // console.log("sumit ref",refreshToken);
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200, 
                {accessToken, refreshToken: refreshToken},
                "Access token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }

})

const changeCurrentPassword = asyncHandler(async(req,res)=> {
    const { oldPassword, newPassword } = req.body
    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password")
    }
    user.password = newPassword
    await user.save({validateBeforeSave})
    
    return res
    .status(200)
    .json(new ApiResponse(
        200,
        {},
        "Password changed successfully"
    ))

})

const getCurrentUser = asyncHandler(async(req, res) => {
    
    
    return res
    .status(200)
    .json(new ApiResponse(
        200,
        req.user,
        "User fetched successfully"
    ))
})

const updateAccountDetails = asyncHandler(async(req,res) => {
    const {fullName, email} = req.body
    console.log(fullName);
    if(!fullName &&  !email){
        throw new ApiError(400, "All fields are required")
    }
    console.log(req.user._id);
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName:fullName,
                email:email
            }
        },
        {
            new:true
        }
    ).select("-password")
    
    return res
    .status(200)
    .json(new ApiResponse(200,user,"Account details updated successfully"))
})

const updateUserAvatar = asyncHandler(async(req,res) => {
    const avatarLocalPath = req.file?.path
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing")
    }
   const avatar = await uploadOnCloudinary(avatarLocalPath)

   if (!avatar.url) {
    throw new ApiError(400, "Error while uploading on avatar")
    
}
const previousAvatarUrl = req.user?.avatar

const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
        $set:{
                avatar:avatar.url
        }
    }
).select("-password")

const publicId = previousAvatarUrl.split('/').pop().split('.')[0];


cloudinary.uploader.destroy(publicId, function(error, result) {
  if (error) {
    console.error('Error deleting image:', error);
  } else {
    console.log('Image deleted successfully:', result);
  }
});

return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Avatar image updated successfully")
    )
})

const updateUserCoverImage = asyncHandler(async(req,res) => {
    const coverImageLocalPath = req.files?.path

    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover image file is missing")
    }
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!coverImage.url) {
        throw new ApiError(400, "Error while uploading on avatar")
        
    }
    const previousCoverImageUrl = req.user?.coverImage
    const user = User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage:coverImage.url
            }
        },
        {
            new:true
        }
    ).select("password")
  const publicId = previousCoverImageUrl.split('/').pop().split('.')[0]
  
cloudinary.uploader.destroy(publicId, function(error, result) {
    if (error) {
      console.error('Error deleting image:', error);
    } else {
      console.log('Image deleted successfully:', result);
    }
  });
  return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Cover image updated successfully")
    )
})

const updateProfile = asyncHandler(async (req, res) => {
   const { fullName,email } = req.body
   
  //console.log(req.files);
   const avatarLocalPath = req.files?.avatar[0].path;
   const coverImageLocalPath = req.files?.coverImage[0].path;
   let uploadedAvatar,uploadedCoverImage;
   if(avatarLocalPath)
  {  uploadedAvatar = await uploadOnCloudinary(avatarLocalPath)}
  
   if(coverImageLocalPath)
    {  uploadedCoverImage = await uploadOnCloudinary(coverImageLocalPath)}

   const prev_name = req.user.fullName;
   const prev_email = req.user.email
   
  const previosUrlAvatar = req.user.avatar
  const previousUrlCoverImage = req.user.coverImage
  if (uploadedAvatar && previosUrlAvatar){
     await deleteAtCloudinary(previosUrlAvatar)
  }
  if(uploadedCoverImage && previousUrlCoverImage){
    await deleteAtCloudinary(previousUrlCoverImage)
  }
console.log(uploadedCoverImage);
   const updatedProfile = await User.findByIdAndUpdate(
       req.user._id,
       {
           $set:{
               fullName:fullName? fullName : prev_name,
               email: email? email :prev_email,
               avatar: uploadedAvatar? uploadedAvatar.url : previosUrlAvatar,
               coverImage: uploadedCoverImage? uploadedCoverImage.url :previousUrlCoverImage
           }
       }
   )
 
   if (!updatedProfile) {
       throw new ApiError(500, "Something went wrong while updating the post")
   }


   return res
       .status(200)
       .json(
           new ApiResponse(200, updatedProfile, "Post updated Successfully")
       )

})
const getUserChannelProfile = asyncHandler(async(req,res) => {
    const {username} = req.params

    if (!username?.trim()) {
        throw new ApiError(400, "username is missing")
    }

    const channel = await User.aggregate([
        {
            $match:{
                username: username.toLowerCase()
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"channel",
                as:"subscribers"
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields:{
                subscribersCount:{
                    $size:"$subscribers"
                },
                channelsSubscribedToCount:{
                    $size:"$subscribedTo"
                },
                isSubscribed: {
                    $cond: {
                        if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1

            }
        }
    ])
    if (!channel?.length) {
        throw new ApiError(404, "channel does not exists")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, channel[0], "User channel fetched successfully")
    )
})

const getWatchHistory = asyncHandler(async(req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user[0].watchHistory,
            "Watch history fetched successfully"
        )
    )
})
export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory,
    updateProfile
}