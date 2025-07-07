import { Resend } from "resend";
import dotenv from "dotenv";
import {
  getAdminNotificationTemplate,
  getUserAutoResponseTemplate,
} from "./templates";
// s3Service se cargará dinámicamente después de cargar las variables de entorno

// Cargar variables de entorno
dotenv.config({ path: ".env.local" });

// Variables de configuración
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.EMAIL_FROM || "onboarding@resend.dev";
const TO_EMAIL = process.env.EMAIL_TO || "electricautomaticchile@gmail.com";

// Cliente Resend lazy-loaded
let resendClient: Resend | null = null;

// Función para inicializar el cliente Resend de forma lazy
function getResendClient(): Resend {
  if (!resendClient) {
    if (!RESEND_API_KEY) {
      throw new Error(
        `❌ RESEND_API_KEY no está configurada.

📋 Pasos para configurar:
1. Obtén tu API key desde: https://resend.com/api-keys
2. Agrega a tu archivo .env: RESEND_API_KEY=re_tu_api_key_aqui
3. Reinicia el servidor

💡 Tip: Copia el archivo .env.example y renómbralo a .env con tus configuraciones reales.`
      );
    }

    if (!RESEND_API_KEY.startsWith("re_")) {
      throw new Error(
        `❌ RESEND_API_KEY inválida.

Las API keys de Resend deben comenzar con 're_'.
Verifica que hayas copiado correctamente la clave desde https://resend.com/api-keys`
      );
    }

    try {
      resendClient = new Resend(RESEND_API_KEY);
      console.log("✅ Cliente Resend inicializado correctamente");
    } catch (error) {
      throw new Error(
        `❌ Error al inicializar cliente Resend: ${error instanceof Error ? error.message : "Error desconocido"}`
      );
    }
  }

  return resendClient;
}

// Función para verificar la configuración del servicio de email
export function verifyEmailConfiguration(): {
  isConfigured: boolean;
  message: string;
} {
  try {
    if (!RESEND_API_KEY) {
      return {
        isConfigured: false,
        message: "❌ RESEND_API_KEY no está configurada",
      };
    }

    if (!RESEND_API_KEY.startsWith("re_")) {
      return {
        isConfigured: false,
        message: "❌ RESEND_API_KEY tiene formato inválido",
      };
    }

    // Intentar inicializar el cliente
    getResendClient();

    return {
      isConfigured: true,
      message: "✅ Servicio de email configurado correctamente",
    };
  } catch (error) {
    return {
      isConfigured: false,
      message:
        error instanceof Error
          ? error.message
          : "❌ Error desconocido en configuración de email",
    };
  }
}

// Interfaz para datos del formulario
interface IFormularioContacto {
  nombre: string;
  email: string;
  empresa?: string;
  telefono?: string;
  servicio: string;
  plazo?: string;
  mensaje: string;
  archivoUrl?: string;
  archivo?: string;
  archivoTipo?: string;
}

// Función para formatear el servicio
const formatServicio = (servicio: string): string => {
  if (!servicio) return "";

  const servicioMap: Record<string, string> = {
    cotizacion_reposicion: "Sistema de Reposición",
    cotizacion_monitoreo: "Sistema de Monitoreo",
    cotizacion_mantenimiento: "Mantenimiento",
    cotizacion_completa: "Solución Integral",
  };

  return (
    servicioMap[servicio] ||
    servicio
      .replace("cotizacion_", "")
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  );
};

// Función para formatear el plazo
const formatPlazo = (plazo: string): string => {
  if (!plazo) return "No especificado";

  const plazoMap: Record<string, string> = {
    urgente: "Urgente (1-2 días)",
    pronto: "Pronto (3-7 días)",
    normal: "Normal (1-2 semanas)",
    planificacion: "En planificación (1 mes o más)",
  };

  return plazoMap[plazo] || plazo;
};

// Enviar notificación al administrador
export async function sendContactNotification(formData: IFormularioContacto) {
  try {
    console.log("📧 Preparando email de notificación...");

    // Verificar configuración antes de enviar
    const configCheck = verifyEmailConfiguration();
    if (!configCheck.isConfigured) {
      console.warn("⚠️ Email no configurado:", configCheck.message);

      // En desarrollo, solo logear sin fallar
      if (process.env.NODE_ENV === "development") {
        console.log("🔄 Modo desarrollo: Simulando envío de email...");
        console.log("📧 Datos del formulario:", {
          nombre: formData.nombre,
          email: formData.email,
          servicio: formatServicio(formData.servicio),
          mensaje: formData.mensaje.substring(0, 100) + "...",
        });
        return {
          id: "dev-mock-" + Date.now(),
          message: "Email simulado en desarrollo",
        };
      }

      throw new Error(configCheck.message);
    }

    const resend = getResendClient();

    // Usar el template profesional
    const htmlContent = getAdminNotificationTemplate(formData);

    // Texto plano simplificado para clientes de email que no soportan HTML
    const textContent = `NUEVA SOLICITUD DE COTIZACIÓN - Electric Automatic Chile

Estimado equipo,

Se ha recibido una nueva solicitud de cotización:

Cliente: ${formData.nombre}
Email: ${formData.email}
${formData.empresa ? `Empresa: ${formData.empresa}` : ""}
${formData.telefono ? `Teléfono: ${formData.telefono}` : ""}

Servicio solicitado: ${formatServicio(formData.servicio)}
${formData.plazo ? `Plazo: ${formatPlazo(formData.plazo)}` : ""}

Descripción:
${formData.mensaje}

${formData.archivo ? `Archivo adjunto: ${formData.archivo}` : ""}

Fecha: ${new Date().toLocaleDateString("es-ES")} ${new Date().toLocaleTimeString("es-ES")}

---
Electric Automatic Chile - Sistema de Cotizaciones`;

    // Formatear tipo de cotización para el asunto
    const tipoServicio = formatServicio(formData.servicio);

    console.log("📧 Enviando a:", TO_EMAIL);
    console.log("📧 Desde:", FROM_EMAIL);

    let attachments: any[] = [];
    if (formData.archivoUrl) {
      try {
        const url = formData.archivoUrl as string;
        const bucketUrlPrefix = `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/`;
        const key = url.replace(bucketUrlPrefix, "");
        const { s3Service } = await import("../s3Service");
        const fileBuffer = await s3Service.downloadFile(key);
        const base64Content = fileBuffer.toString("base64");
        const filename =
          formData.archivo || key.split("/").pop() || "archivo.pdf";
        attachments.push({ filename, content: base64Content });
      } catch (attErr) {
        console.warn("No se pudo adjuntar archivo:", attErr);
      }
    }

    // Enviar el correo
    const data = await resend.emails.send({
      from: FROM_EMAIL,
      to: TO_EMAIL,
      subject: `🆕 Nueva cotización: ${tipoServicio} - ${formData.nombre}`,
      html: htmlContent,
      text: textContent,
      attachments,
    });

    console.log("✅ Email de notificación enviado:", data);
    return data;
  } catch (error) {
    console.error("❌ Error al enviar email de notificación:", error);
    throw error;
  }
}

// Enviar respuesta automática al usuario
export async function sendAutoResponse(nombre: string, email: string) {
  try {
    console.log("📧 Preparando respuesta automática...");

    // Verificar configuración antes de enviar
    const configCheck = verifyEmailConfiguration();
    if (!configCheck.isConfigured) {
      console.warn("⚠️ Email no configurado:", configCheck.message);

      // En desarrollo, solo logear sin fallar
      if (process.env.NODE_ENV === "development") {
        console.log("🔄 Modo desarrollo: Simulando respuesta automática...");
        console.log("📧 Respuesta para:", { nombre, email });
        return {
          id: "dev-mock-autoresponse-" + Date.now(),
          message: "Respuesta automática simulada en desarrollo",
        };
      }

      throw new Error(configCheck.message);
    }

    const resend = getResendClient();

    // Usar el template profesional
    const htmlContent = getUserAutoResponseTemplate(nombre, email);

    // Texto plano simplificado
    const textContent = `Estimado/a ${nombre},

¡Gracias por contactar a Electric Automatic Chile!

Hemos recibido tu solicitud de cotización y queremos confirmarte que está siendo revisada por nuestro equipo de especialistas.

¿QUÉ SIGUE AHORA?
• Revisión técnica de tu proyecto (1-2 horas)
• Contacto directo de nuestro equipo (24 horas)
• Propuesta personalizada y detallada

NUESTROS SERVICIOS:
⚡ Automatización Industrial
📊 Sistemas de Monitoreo IoT
🔧 Mantenimiento Preventivo
🔄 Sistemas de Reposición Automática

Si tienes alguna pregunta urgente, no dudes en contactarnos directamente.

Saludos cordiales,
Equipo Electric Automatic Chile

---
Electric Automatic Chile
Automatización Industrial • IoT • Eficiencia Energética
📧 electricautomaticchile@gmail.com
🌐 electricautomaticchile.com

Este es un mensaje automático de confirmación.`;

    console.log("📧 Enviando respuesta a:", email);

    // Enviar el correo
    const data = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `✅ Confirmación de Solicitud - Electric Automatic Chile | ${nombre}`,
      html: htmlContent,
      text: textContent,
    });

    console.log("✅ Respuesta automática enviada:", data);
    return data;
  } catch (error) {
    console.error("❌ Error al enviar respuesta automática:", error);
    throw error;
  }
}

// Enviar email de recuperación de contraseña
export async function sendRecoveryEmail(
  email: string,
  nombre: string,
  numeroCliente: string,
  tipoUsuario: string,
  recoveryUrl: string
) {
  try {
    console.log("📧 Preparando email de recuperación de contraseña...");

    // Verificar configuración antes de enviar
    const configCheck = verifyEmailConfiguration();
    if (!configCheck.isConfigured) {
      console.warn("⚠️ Email no configurado:", configCheck.message);

      // En desarrollo, solo logear sin fallar
      if (process.env.NODE_ENV === "development") {
        console.log(
          "🔄 Modo desarrollo: Simulando envío de email de recuperación..."
        );
        console.log("📧 Datos del email:", {
          email,
          nombre,
          numeroCliente,
          tipoUsuario,
          recoveryUrl: recoveryUrl.substring(0, 50) + "...",
        });
        return {
          id: "dev-mock-recovery-" + Date.now(),
          message: "Email de recuperación simulado en desarrollo",
        };
      }

      throw new Error(configCheck.message);
    }

    const resend = getResendClient();

    // Usar el template de recuperación
    const { recoveryEmailTemplate } = await import("./recoveryTemplate");
    const emailContent = recoveryEmailTemplate(
      nombre,
      numeroCliente,
      tipoUsuario,
      recoveryUrl
    );

    console.log("📧 Enviando email de recuperación a:", email);
    console.log("📧 Desde:", FROM_EMAIL);

    // Enviar el correo
    const data = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    });

    console.log("✅ Email de recuperación enviado:", data);
    return data;
  } catch (error) {
    console.error("❌ Error al enviar email de recuperación:", error);
    throw error;
  }
}

// Función de utilidad para testing y desarrollo
export function getEmailConfiguration() {
  return {
    hasApiKey: !!RESEND_API_KEY,
    fromEmail: FROM_EMAIL,
    toEmail: TO_EMAIL,
    isValidApiKey: RESEND_API_KEY?.startsWith("re_") || false,
    environment: process.env.NODE_ENV || "development",
  };
}

export async function sendClientCredentials(
  nombre: string,
  email: string,
  numeroCliente: string,
  passwordTemporal: string
) {
  try {
    console.log("📧 Enviando credenciales al cliente...");

    const configCheck = verifyEmailConfiguration();
    if (!configCheck.isConfigured) {
      console.warn("⚠️ Email no configurado:", configCheck.message);
      return;
    }

    const resend = getResendClient();

    const htmlContent = `
      <h2>Bienvenido a Electric Automatic Chile</h2>
      <p>Estimado/a <strong>${nombre}</strong>,</p>
      <p>Tu cuenta ha sido creada correctamente. A continuación encontrarás tus credenciales de acceso:</p>
      <ul>
        <li><strong>Número de cliente:</strong> ${numeroCliente}</li>
        <li><strong>Contraseña temporal:</strong> ${passwordTemporal}</li>
      </ul>
      <p>Inicia sesión en <a href="https://electricautomaticchile.com/auth/login">Nuestro portal</a> y cambia tu contraseña cuanto antes.</p>
      <p>Saludos cordiales,<br/>Equipo Electric Automatic Chile</p>`;

    const textContent = `Bienvenido a Electric Automatic Chile\n\nEstimado/a ${nombre},\n\nTu cuenta ha sido creada correctamente.\n\nNúmero de cliente: ${numeroCliente}\nContraseña temporal: ${passwordTemporal}\n\nInicia sesión en https://electricautomaticchile.com/auth/login y cambia tu contraseña cuanto antes.\n\nSaludos,\nElectric Automatic Chile`;

    await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: "Credenciales de acceso - Electric Automatic Chile",
      html: htmlContent,
      text: textContent,
    });
  } catch (err) {
    console.error("❌ Error enviando credenciales al cliente:", err);
  }
}
