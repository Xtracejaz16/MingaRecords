import multer from 'multer';

const MAX_AUDIO_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;  // 5 MB

const ALLOWED_AUDIO_MIMES = ['audio/mpeg', 'audio/wav', 'audio/x-wav'];
const ALLOWED_IMAGE_MIMES = ['image/jpeg', 'image/png'];

const storage = multer.memoryStorage();

function fileFilter(
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
): void {
  if (file.fieldname === 'audio') {
    if (ALLOWED_AUDIO_MIMES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('INVALID_AUDIO_TYPE'));
    }
  } else if (file.fieldname === 'cover') {
    if (ALLOWED_IMAGE_MIMES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('INVALID_COVER_TYPE'));
    }
  } else {
    cb(new Error('UNEXPECTED_FIELD'));
  }
}

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_AUDIO_SIZE, // highest limit; per-field enforced by filter
  },
});

export const beatUpload = upload.fields([
  { name: 'audio', maxCount: 1 },
  { name: 'cover', maxCount: 1 },
]);
