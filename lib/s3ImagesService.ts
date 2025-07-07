import { S3Service } from "./s3Service";

export const s3ImagesService = new S3Service(
  process.env.AWS_S3_IMAGES_BUCKET_NAME || "imagenes-perfil"
);
