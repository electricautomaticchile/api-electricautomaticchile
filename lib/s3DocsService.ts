import { S3Service } from "./s3Service";

export const s3DocsService = new S3Service(
  process.env.AWS_S3_BUCKET_NAME || "documentos-formulario"
);
