import { Router } from "express";
import { addPost, deletePost, getAllPosts, getCurrentPost, updatePost } from "../controllers/post.controller.js";
import jwt from "jsonwebtoken"
import { upload } from "../midllewares/multer.middleware.js";
import { verifyJWT } from "../midllewares/auth.middleware.js";

const router = Router()

router.route("/add-post").post(verifyJWT,upload.single("image"),addPost)
router.route("/all-posts").post(verifyJWT,getAllPosts)
router.route("/post/:_id").post(verifyJWT, getCurrentPost)
router.route("/delete-post/:_id").post(verifyJWT, deletePost)
router.route("/edit-post/:_id").post(verifyJWT,upload.single("image"), updatePost)
export default router