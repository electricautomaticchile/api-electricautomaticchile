import multer from "multer";

const maxFileSize = Number(process.env.MAX_FILE_SIZE || 10 * 1024 * 1024); // 10 MB por defecto
const allowedTypes = (process.env.ALLOWED_FILE_TYPES || "")
  .split(",")
  .map((t) => t.trim());

const storage = multer.memoryStorage();

const fileFilter: multer.Options["fileFilter"] = (req, file, cb) => {
  if (allowedTypes.length === 0) {
    cb(null, true);
    return;
  }
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Tipo de archivo no permitido"));
  }
};

export const upload = multer({
  storage,
  limits: { fileSize: maxFileSize },
  fileFilter,
});
export default upload;
