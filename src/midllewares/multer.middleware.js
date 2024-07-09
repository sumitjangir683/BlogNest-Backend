import multer from "multer";
const fs = require('fs');
const path = require('path');

const tempDir = path.join(__dirname, 'public', 'temp');
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}
const storage = multer.diskStorage({
    
    destination:function(req,file,cb){
        //console.log("multer");
        cb(null,tempDir)
    },
    filename: function(req,file,cb){
        cb(null,file.originalname)
    }
})

export const upload = multer({
    storage,
})
