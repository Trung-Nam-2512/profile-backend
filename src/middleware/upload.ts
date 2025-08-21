import multer from 'multer'
import path from 'path'
import { Request } from 'express'
import { AppError } from '../utils/errorHandler'

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/images/')
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-randomnumber.ext
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    const extension = path.extname(file.originalname)
    cb(null, `img-${uniqueSuffix}${extension}`)
  },
})

// File filter - only allow images
const fileFilter = (req: Request, file: any, cb: multer.FileFilterCallback) => {
  // Check if file is image
  if (file.mimetype.startsWith('image/')) {
    cb(null, true)
  } else {
    cb(new AppError('Only image files are allowed!', 400, 'INVALID_FILE_TYPE'))
  }
}

// Multer configuration
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5, // Max 5 files at once
  },
})

export const uploadSingle = upload.single('image')
export const uploadMultiple = upload.array('images', 5)
