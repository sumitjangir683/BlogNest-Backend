import mongoose, {Schema} from "mongoose";
const postSchema = new Schema(
    {
     title:{
        type:String,
        required:true
     },
     content:{
        type:String,
        required:true
     },
     status:{
      type:String,
      required:true
     },
     image:{
     type: String,
     required:true,
     },
     owner:{
      type:String,
      required:true
   },
    },
    {timestamps:true}
)
export const Post = mongoose.model("Post",postSchema)