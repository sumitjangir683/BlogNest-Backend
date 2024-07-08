import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express()
// const allowedOrigin =[process.env.CORS_ORIGIN,'http://localhost:5173']
// const corsOptions = {
//     origin: allowedOrigin, 
//     credentials: true, 
//   };
  
 app.use(cors());

// app.use(cors({
//     origin: process.env.CORS_ORIGIN,
//     credentials: true
// }))
// app.get('/api/v1/test', (req, res) => {
//     console.log('Cookies:', req.cookies);
//     res.send('Cookies received');
//   });
  
app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(express.static("public"))
app.use(cookieParser())

//routes
import userRouter from "./routes/user.routes.js"

app.use("/api/v1/users", userRouter)

import postRouter from "./routes/post.routes.js"
app.use("/api/v1/post", postRouter)
export {app}
