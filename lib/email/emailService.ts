import { Resend } from "resend";
import dotenv from "dotenv";
import {
  getAdminNotificationTemplate,
  getUserAutoResponseTemplate,
} from "./templates";

// Cargar variables de entorno
dotenv.config();

// Inicializar Resend con la API key
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const resend = new Resend(RESEND_API_KEY);

// Email de origen y destino
const FROM_EMAIL = process.env.EMAIL_FROM || "onboarding@resend.dev";
const TO_EMAIL = process.env.EMAIL_TO || "electricautomaticchile@gmail.com";

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

  if (servicio === "cotizacion_reposicion") return "Sistema de Reposición";
  if (servicio === "cotizacion_monitoreo") return "Sistema de Monitoreo";
  if (servicio === "cotizacion_mantenimiento") return "Mantenimiento";
  if (servicio === "cotizacion_completa") return "Solución Integral";

  return servicio
    .replace("cotizacion_", "")
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

// Función para formatear el plazo
const formatPlazo = (plazo: string): string => {
  if (!plazo) return "No especificado";

  if (plazo === "urgente") return "Urgente (1-2 días)";
  if (plazo === "pronto") return "Pronto (3-7 días)";
  if (plazo === "normal") return "Normal (1-2 semanas)";
  if (plazo === "planificacion") return "En planificación (1 mes o más)";

  return plazo;
};

// Enviar notificación al administrador
export async function sendContactNotification(formData: IFormularioContacto) {
  try {
    console.log("📧 Preparando email de notificación...");

    if (!RESEND_API_KEY) {
      throw new Error(
        "API Key de Resend no configurada. Verifica tu archivo .env"
      );
    }

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

    // Enviar el correo
    const data = await resend.emails.send({
      from: FROM_EMAIL,
      to: TO_EMAIL,
      subject: `🆕 Nueva cotización: ${tipoServicio} - ${formData.nombre}`,
      html: htmlContent,
      text: textContent,
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

    if (!RESEND_API_KEY) {
      throw new Error(
        "API Key de Resend no configurada. Verifica tu archivo .env"
      );
    }

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
