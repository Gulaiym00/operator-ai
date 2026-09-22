import multer, { diskStorage } from "multer";
import path from "path";
const storage = diskStorage({
  destination: (_, __, cd) => {
    cd(null, "src/upload");
  },
  filename(_, file, callback) {
    const ext = path.extname(file.originalname);
    callback(null, `${Date.now()}${ext}`);
  },
});
export const uploadMiddleware = multer({
  storage,
  limits: {
    fileSize: 1024 * 1024 * 5,
  },
});
