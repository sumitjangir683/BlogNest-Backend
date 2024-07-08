import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express()
const allowedOrigins = [
  process.env.CORS_ORIGIN,
  'https://blog-nest-frontend.vercel.app',
  'http://localhost:5173'
];

const corsOptions = {
  origin: function (origin, callback) {
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: 'GET,POST,PUT',
  allowedHeaders: 'Content-Type',
  credentials: true,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));

// Preflight request handling
app.options('*', cors(corsOptions));

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
