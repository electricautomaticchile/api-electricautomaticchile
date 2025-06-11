import { Resend } from "resend";
import dotenv from "dotenv";

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

    // Preparar el contenido del correo (texto plano y HTML)
    const textContent = `NUEVA SOLICITUD DE COTIZACIÓN
--------------------------------------
Fecha: ${new Date().toLocaleDateString(
      "es-ES"
    )} ${new Date().toLocaleTimeString("es-ES")}

DATOS DEL SOLICITANTE
--------------------------------------
Nombre: ${formData.nombre}
Correo electrónico: ${formData.email}
${formData.empresa ? `Empresa: ${formData.empresa}` : ""}
${formData.telefono ? `Teléfono: ${formData.telefono}` : ""}

DETALLES DE LA COTIZACIÓN
--------------------------------------
Tipo de cotización: ${formatServicio(formData.servicio)}
${formData.plazo ? `Plazo deseado: ${formatPlazo(formData.plazo)}` : ""}

DESCRIPCIÓN DEL PROYECTO
--------------------------------------
${formData.mensaje}

${
  formData.archivo
    ? `ARCHIVO ADJUNTO: ${formData.archivo}
El archivo está disponible en el sistema.`
    : ""
}

--------------------------------------
Este es un mensaje automático del sistema de cotizaciones de Electric Automatic Chile.
Para responder, contacte directamente al cliente.`;

    // HTML básico para el correo
    const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
      <h2 style="color: #ff6b35; text-align: center;">🔔 Nueva Solicitud de Cotización</h2>
      
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>📅 Fecha:</strong> ${new Date().toLocaleDateString(
          "es-ES"
        )} ${new Date().toLocaleTimeString("es-ES")}</p>
      </div>

      <h3 style="color: #333; border-bottom: 2px solid #ff6b35; padding-bottom: 5px;">👤 Datos del Solicitante</h3>
      <ul style="background-color: #f8f9fa; padding: 15px; border-radius: 5px;">
        <li><strong>Nombre:</strong> ${formData.nombre}</li>
        <li><strong>Correo:</strong> <a href="mailto:${formData.email}">${
      formData.email
    }</a></li>
        ${
          formData.empresa
            ? `<li><strong>Empresa:</strong> ${formData.empresa}</li>`
            : ""
        }
        ${
          formData.telefono
            ? `<li><strong>Teléfono:</strong> <a href="tel:${formData.telefono}">${formData.telefono}</a></li>`
            : ""
        }
      </ul>

      <h3 style="color: #333; border-bottom: 2px solid #ff6b35; padding-bottom: 5px;">📋 Detalles de la Cotización</h3>
      <ul style="background-color: #f8f9fa; padding: 15px; border-radius: 5px;">
        <li><strong>Tipo:</strong> ${formatServicio(formData.servicio)}</li>
        ${
          formData.plazo
            ? `<li><strong>Plazo:</strong> ${formatPlazo(formData.plazo)}</li>`
            : ""
        }
      </ul>

      <h3 style="color: #333; border-bottom: 2px solid #ff6b35; padding-bottom: 5px;">💬 Descripción del Proyecto</h3>
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; white-space: pre-wrap;">${
        formData.mensaje
      }</div>

      ${
        formData.archivo
          ? `
      <h3 style="color: #333; border-bottom: 2px solid #ff6b35; padding-bottom: 5px;">📎 Archivo Adjunto</h3>
      <div style="background-color: #e3f2fd; padding: 15px; border-radius: 5px;">
        <p><strong>Archivo:</strong> ${formData.archivo}</p>
        <p><em>El archivo está disponible en el sistema.</em></p>
      </div>
      `
          : ""
      }

      <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
      <p style="text-align: center; color: #666; font-size: 12px;">
        Este es un mensaje automático del sistema de cotizaciones de Electric Automatic Chile.<br>
        Para responder, contacte directamente al cliente.
      </p>
    </div>`;

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

    // Preparar el contenido del correo (texto plano)
    const textContent = `Estimado/a ${nombre},

Hemos recibido su solicitud de cotización y queremos agradecerle por contactarnos.

Nuestro equipo técnico está revisando su solicitud y nos pondremos en contacto con usted lo antes posible con su cotización personalizada.

Tiempo estimado de respuesta: 24-48 horas hábiles.

Mientras tanto, lo invitamos a visitar nuestra página web para conocer más sobre nuestros servicios y soluciones:
https://www.electricautomaticchile.com

Si tiene alguna pregunta urgente, puede contactarnos directamente:
📧 Email: electricautomaticchile@gmail.com
📞 Teléfono: +56 9 XXXX XXXX

Este es un mensaje automático. Por favor, no responda directamente a este correo.

Saludos cordiales,
El equipo de Electric Automatic Chile

© ${new Date().getFullYear()} Electric Automatic Chile. Todos los derechos reservados.`;

    // HTML básico para el correo
    const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
      <h2 style="color: #ff6b35; text-align: center;">¡Gracias por contactarnos!</h2>
      
      <p>Estimado/a <strong>${nombre}</strong>,</p>
      
      <div style="background-color: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p style="margin: 0; color: #155724;">✅ Hemos recibido su solicitud de cotización y queremos agradecerle por contactarnos.</p>
      </div>

      <p>Nuestro equipo técnico está revisando su solicitud y nos pondremos en contacto con usted lo antes posible con su cotización personalizada.</p>
      
      <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p style="margin: 0; color: #856404;"><strong>⏱️ Tiempo estimado de respuesta:</strong> 24-48 horas hábiles</p>
      </div>

      <p>Mientras tanto, lo invitamos a visitar nuestra página web para conocer más sobre nuestros servicios:</p>
      <p style="text-align: center;">
        <a href="https://www.electricautomaticchile.com" style="background-color: #ff6b35; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">🌐 Visitar nuestro sitio web</a>
      </p>

      <h3 style="color: #333; border-bottom: 2px solid #ff6b35; padding-bottom: 5px;">📞 Contacto directo</h3>
      <ul style="background-color: #f8f9fa; padding: 15px; border-radius: 5px;">
        <li>📧 <strong>Email:</strong> <a href="mailto:electricautomaticchile@gmail.com">electricautomaticchile@gmail.com</a></li>
        <li>📞 <strong>Teléfono:</strong> +56 9 XXXX XXXX</li>
      </ul>

      <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
      <p style="text-align: center; color: #666; font-size: 12px;">
        Este es un mensaje automático. Por favor, no responda directamente a este correo.<br><br>
        <strong>El equipo de Electric Automatic Chile</strong><br>
        © ${new Date().getFullYear()} Electric Automatic Chile. Todos los derechos reservados.
      </p>
    </div>`;

    console.log("📧 Enviando respuesta a:", email);

    // Enviar el correo
    const data = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject:
        "✅ Gracias por solicitar una cotización - Electric Automatic Chile",
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
