import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { Readable } from "stream";

// Configuración del cliente S3
export class S3Service {
  private s3Client: S3Client;
  private bucketName: string;

  constructor() {
    // Validar que las variables de entorno estén configuradas
    if (
      !process.env.AWS_ACCESS_KEY_ID ||
      !process.env.AWS_SECRET_ACCESS_KEY ||
      !process.env.AWS_REGION
    ) {
      throw new Error(
        "AWS credentials or region not configured. Please check your environment variables."
      );
    }

    this.s3Client = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });

    this.bucketName = process.env.AWS_S3_BUCKET_NAME || "documentos-formulario";
  }

  /**
   * Descarga un archivo desde S3 y retorna su buffer
   * @param key - Clave del archivo en S3
   * @returns Buffer del archivo
   */
  async downloadFile(key: string): Promise<Buffer> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const response = await this.s3Client.send(command);

      if (!response.Body) {
        throw new Error(`No se pudo obtener el archivo: ${key}`);
      }

      // Convertir el stream a buffer
      const buffer = await this.streamToBuffer(response.Body as Readable);
      return buffer;
    } catch (error) {
      console.error(`Error descargando archivo ${key} desde S3:`, error);

      if (error instanceof Error) {
        if (error.name === "NoSuchKey") {
          throw new Error(
            `El archivo ${key} no existe en el bucket ${this.bucketName}`
          );
        }
        if (error.name === "AccessDenied") {
          throw new Error(
            `Sin permisos para acceder al archivo ${key} en el bucket ${this.bucketName}`
          );
        }
        if (error.name === "NoSuchBucket") {
          throw new Error(`El bucket ${this.bucketName} no existe`);
        }
      }

      throw new Error(
        `Error inesperado al descargar el archivo: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }

  /**
   * Convierte un stream a buffer
   * @param stream - Stream de datos
   * @returns Buffer con los datos
   */
  private async streamToBuffer(stream: Readable): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];

      stream.on("data", (chunk) => {
        chunks.push(Buffer.from(chunk));
      });

      stream.on("end", () => {
        resolve(Buffer.concat(chunks));
      });

      stream.on("error", (error) => {
        reject(error);
      });
    });
  }

  /**
   * Verifica si un archivo existe en S3
   * @param key - Clave del archivo en S3
   * @returns true si existe, false si no
   */
  async fileExists(key: string): Promise<boolean> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      await this.s3Client.send(command);
      return true;
    } catch (error) {
      if (error instanceof Error && error.name === "NoSuchKey") {
        return false;
      }
      // Para otros errores, los re-lanzamos
      throw error;
    }
  }

  /**
   * Obtiene información del archivo sin descargarlo
   * @param key - Clave del archivo en S3
   * @returns Metadata del archivo
   */
  async getFileInfo(key: string): Promise<{
    size?: number;
    lastModified?: Date;
    contentType?: string;
  }> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const response = await this.s3Client.send(command);

      return {
        size: response.ContentLength,
        lastModified: response.LastModified,
        contentType: response.ContentType,
      };
    } catch (error) {
      console.error(`Error obteniendo información del archivo ${key}:`, error);
      throw error;
    }
  }
}

// Instancia singleton del servicio S3
export const s3Service = new S3Service();
