import express from "express";
import ImagenPerfilController from "../controllers/ImagenPerfilController";
import { upload } from "../middleware/upload";
import { authMiddleware } from "../middleware/authMiddleware";

const router = express.Router();

// Rutas para imagen de perfil
/**
 * @route POST /api/empresa/upload-image
 * @desc Subir imagen de perfil
 * @access Privado
 */
router.post(
  "/upload-image",
  authMiddleware,
  upload.single("image"),
  ImagenPerfilController.uploadImage
);

/**
 * @route POST /empresa/update-profile-image
 * @desc Actualizar imagen de perfil del usuario
 * @access Privado
 */
router.post(
  "/update-profile-image",
  authMiddleware,
  ImagenPerfilController.updateProfileImage
);

/**
 * @route GET /empresa/profile-image/:tipoUsuario/:userId
 * @desc Obtener imagen de perfil actual
 * @access Privado
 */
router.get(
  "/profile-image/:tipoUsuario/:userId",
  authMiddleware,
  ImagenPerfilController.getProfileImage
);

/**
 * @route DELETE /empresa/profile-image/:tipoUsuario/:userId
 * @desc Eliminar imagen de perfil
 * @access Privado
 */
router.delete(
  "/profile-image/:tipoUsuario/:userId",
  authMiddleware,
  ImagenPerfilController.deleteProfileImage
);

export default router;
