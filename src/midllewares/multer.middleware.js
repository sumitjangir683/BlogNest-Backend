import multer from 'multer';
import fs from 'fs/promises'; // Using fs promises for async file operations
import path from 'path';

const tempDir = '/tmp'; // Use the /tmp directory for serverless environments

async function ensureTempDirExists() {
    try {
        await fs.mkdir(tempDir, { recursive: true });
        console.log(`Directory '${tempDir}' created successfully.`);
    } catch (err) {
        if (err.code === 'EEXIST') {
            console.log(`Directory '${tempDir}' already exists.`);
        } else {
            console.error(`Error creating directory '${tempDir}':`, err);
            throw err;
        }
    }
}

// Call the function to ensure tempDir exists
ensureTempDirExists().catch(err => {
    console.error('Error ensuring temp directory exists:', err);
    process.exit(1); // Exit with non-zero status on error
});

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, tempDir);
    },
    filename: function(req, file, cb) {
        cb(null, file.originalname);
    }
});

export const upload = multer({ storage });
