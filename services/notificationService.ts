import { Resend } from "resend";
import { ITicket, IRespuestaTicket } from "../models/Ticket";

// Lazy initialization de Resend
let resendInstance: Resend | null = null;

const getResend = (): Resend => {
  if (!resendInstance) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn(
        "⚠️ RESEND_API_KEY no está configurada. Las notificaciones por email no funcionarán."
      );
      throw new Error("RESEND_API_KEY no está configurada");
    }
    resendInstance = new Resend(apiKey);
  }
  return resendInstance;
};

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";
const SOPORTE_EMAIL =
  process.env.SOPORTE_EMAIL || "soporte@electricautomaticchile.com";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:3000";

export class NotificationService {
  /**
   * Enviar email cuando se crea un nuevo ticket
   */
  static async notificarTicketCreado(ticket: ITicket): Promise<void> {
    try {
      const resend = getResend();

      // Email al cliente (confirmación)
      await getResend().emails.send({
        from: FROM_EMAIL,
        to: ticket.emailCliente,
        subject: `✅ Ticket #${ticket.numeroTicket} creado exitosamente`,
        html: this.templateTicketCreado(ticket, "cliente"),
      });

      // Email al soporte (notificación)
      await getResend().emails.send({
        from: FROM_EMAIL,
        to: SOPORTE_EMAIL,
        subject: `🔔 Nuevo Ticket #${ticket.numeroTicket} - ${ticket.asunto}`,
        html: this.templateTicketCreado(ticket, "soporte"),
      });

      console.log(
        `✅ Notificaciones enviadas para ticket ${ticket.numeroTicket}`
      );
    } catch (error) {
      console.error("❌ Error enviando notificaciones:", error);
      throw error;
    }
  }

  /**
   * Enviar email cuando se agrega una respuesta
   */
  static async notificarNuevaRespuesta(
    ticket: ITicket,
    respuesta: IRespuestaTicket
  ): Promise<void> {
    try {
      // Si responde soporte, notificar al cliente
      if (
        respuesta.autorTipo === "soporte" ||
        respuesta.autorTipo === "empresa"
      ) {
        await getResend().emails.send({
          from: FROM_EMAIL,
          to: ticket.emailCliente,
          subject: `💬 Nueva respuesta en Ticket #${ticket.numeroTicket}`,
          html: this.templateNuevaRespuesta(ticket, respuesta, "cliente"),
        });
      }

      // Si responde cliente, notificar al soporte
      if (respuesta.autorTipo === "cliente") {
        await getResend().emails.send({
          from: FROM_EMAIL,
          to: SOPORTE_EMAIL,
          subject: `💬 Nueva respuesta del cliente en Ticket #${ticket.numeroTicket}`,
          html: this.templateNuevaRespuesta(ticket, respuesta, "soporte"),
        });
      }

      console.log(
        `✅ Notificación de respuesta enviada para ticket ${ticket.numeroTicket}`
      );
    } catch (error) {
      console.error("❌ Error enviando notificación de respuesta:", error);
      throw error;
    }
  }

  /**
   * Enviar email cuando cambia el estado del ticket
   */
  static async notificarCambioEstado(
    ticket: ITicket,
    estadoAnterior: string
  ): Promise<void> {
    try {
      await getResend().emails.send({
        from: FROM_EMAIL,
        to: ticket.emailCliente,
        subject: `🔄 Actualización de Ticket #${ticket.numeroTicket}`,
        html: this.templateCambioEstado(ticket, estadoAnterior),
      });

      console.log(
        `✅ Notificación de cambio de estado enviada para ticket ${ticket.numeroTicket}`
      );
    } catch (error) {
      console.error(
        "❌ Error enviando notificación de cambio de estado:",
        error
      );
      throw error;
    }
  }

  /**
   * Enviar email cuando se cierra el ticket
   */
  static async notificarTicketCerrado(ticket: ITicket): Promise<void> {
    try {
      await getResend().emails.send({
        from: FROM_EMAIL,
        to: ticket.emailCliente,
        subject: `✅ Ticket #${ticket.numeroTicket} cerrado`,
        html: this.templateTicketCerrado(ticket),
      });

      console.log(
        `✅ Notificación de cierre enviada para ticket ${ticket.numeroTicket}`
      );
    } catch (error) {
      console.error("❌ Error enviando notificación de cierre:", error);
      throw error;
    }
  }

  // ==================== TEMPLATES HTML ====================

  private static templateTicketCreado(
    ticket: ITicket,
    destinatario: "cliente" | "soporte"
  ): string {
    const urlTicket = `${FRONTEND_URL}/dashboard-${destinatario === "cliente" ? "cliente" : "empresa"}/soporte?ticket=${ticket.numeroTicket}`;

    if (destinatario === "cliente") {
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #ea580c 0%, #f97316 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .ticket-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ea580c; }
            .info-row { display: flex; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
            .info-label { font-weight: bold; width: 150px; color: #6b7280; }
            .info-value { flex: 1; color: #111827; }
            .button { display: inline-block; background: #ea580c; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
            .priority-badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold; }
            .priority-baja { background: #dbeafe; color: #1e40af; }
            .priority-media { background: #fef3c7; color: #92400e; }
            .priority-alta { background: #fee2e2; color: #991b1b; }
            .priority-urgente { background: #fecaca; color: #7f1d1d; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Ticket Creado Exitosamente</h1>
            </div>
            <div class="content">
              <p>Hola <strong>${ticket.nombreCliente}</strong>,</p>
              <p>Tu ticket de soporte ha sido creado exitosamente. Nuestro equipo lo revisará y te responderá pronto.</p>
              
              <div class="ticket-info">
                <h2 style="margin-top: 0; color: #ea580c;">📋 Información del Ticket</h2>
                <div class="info-row">
                  <div class="info-label">Número:</div>
                  <div class="info-value"><strong>${ticket.numeroTicket}</strong></div>
                </div>
                <div class="info-row">
                  <div class="info-label">Asunto:</div>
                  <div class="info-value">${ticket.asunto}</div>
                </div>
                <div class="info-row">
                  <div class="info-label">Categoría:</div>
                  <div class="info-value">${this.formatCategoria(ticket.categoria)}</div>
                </div>
                <div class="info-row">
                  <div class="info-label">Prioridad:</div>
                  <div class="info-value">
                    <span class="priority-badge priority-${ticket.prioridad}">
                      ${this.formatPrioridad(ticket.prioridad)}
                    </span>
                  </div>
                </div>
                ${
                  ticket.numeroDispositivo
                    ? `
                <div class="info-row">
                  <div class="info-label">Dispositivo:</div>
                  <div class="info-value">${ticket.nombreDispositivo || ticket.numeroDispositivo}</div>
                </div>
                `
                    : ""
                }
                <div class="info-row">
                  <div class="info-label">Fecha:</div>
                  <div class="info-value">${new Date(ticket.fechaCreacion).toLocaleString("es-CL")}</div>
                </div>
              </div>

              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #374151;">Descripción:</h3>
                <p style="color: #6b7280;">${ticket.descripcion}</p>
              </div>

              <div style="text-align: center;">
                <a href="${urlTicket}" class="button">Ver Mi Ticket</a>
              </div>

              <div style="background: #eff6ff; padding: 15px; border-radius: 8px; margin-top: 20px; border-left: 4px solid #3b82f6;">
                <p style="margin: 0; color: #1e40af;">
                  <strong>💡 Tip:</strong> Recibirás un email cada vez que haya una actualización en tu ticket.
                </p>
              </div>
            </div>
            <div class="footer">
              <p><strong>Electric Automatic Chile</strong></p>
              <p>Soluciones Inteligentes en Energía Eléctrica</p>
              <p>📧 ${SOPORTE_EMAIL} | 📞 +56 9 1234 5678</p>
              <p style="font-size: 12px; color: #9ca3af;">
                Este es un mensaje automático, por favor no respondas a este email.
              </p>
            </div>
          </div>
        </body>
        </html>
      `;
    } else {
      // Template para soporte
      return `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .ticket-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626; }
            .info-row { display: flex; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
            .info-label { font-weight: bold; width: 150px; color: #6b7280; }
            .info-value { flex: 1; color: #111827; }
            .button { display: inline-block; background: #dc2626; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .priority-badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: bold; }
            .priority-urgente { background: #fecaca; color: #7f1d1d; animation: pulse 2s infinite; }
            @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔔 Nuevo Ticket de Soporte</h1>
            </div>
            <div class="content">
              <p><strong>Se ha recibido un nuevo ticket que requiere atención:</strong></p>
              
              <div class="ticket-info">
                <h2 style="margin-top: 0; color: #dc2626;">📋 ${ticket.numeroTicket}</h2>
                <div class="info-row">
                  <div class="info-label">Cliente:</div>
                  <div class="info-value"><strong>${ticket.nombreCliente}</strong> (${ticket.numeroCliente})</div>
                </div>
                <div class="info-row">
                  <div class="info-label">Email:</div>
                  <div class="info-value">${ticket.emailCliente}</div>
                </div>
                ${
                  ticket.telefonoCliente
                    ? `
                <div class="info-row">
                  <div class="info-label">Teléfono:</div>
                  <div class="info-value">${ticket.telefonoCliente}</div>
                </div>
                `
                    : ""
                }
                <div class="info-row">
                  <div class="info-label">Asunto:</div>
                  <div class="info-value"><strong>${ticket.asunto}</strong></div>
                </div>
                <div class="info-row">
                  <div class="info-label">Categoría:</div>
                  <div class="info-value">${this.formatCategoria(ticket.categoria)}</div>
                </div>
                <div class="info-row">
                  <div class="info-label">Prioridad:</div>
                  <div class="info-value">
                    <span class="priority-badge priority-${ticket.prioridad}">
                      ${this.formatPrioridad(ticket.prioridad).toUpperCase()}
                    </span>
                  </div>
                </div>
                ${
                  ticket.numeroDispositivo
                    ? `
                <div class="info-row">
                  <div class="info-label">Dispositivo:</div>
                  <div class="info-value">🔧 ${ticket.nombreDispositivo || ticket.numeroDispositivo}</div>
                </div>
                `
                    : ""
                }
              </div>

              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #374151;">Descripción del Problema:</h3>
                <p style="color: #6b7280;">${ticket.descripcion}</p>
              </div>

              <div style="text-align: center;">
                <a href="${urlTicket}" class="button">Atender Ticket</a>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;
    }
  }

  private static templateNuevaRespuesta(
    ticket: ITicket,
    respuesta: IRespuestaTicket,
    destinatario: "cliente" | "soporte"
  ): string {
    const urlTicket = `${FRONTEND_URL}/dashboard-${destinatario === "cliente" ? "cliente" : "empresa"}/soporte?ticket=${ticket.numeroTicket}`;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .message-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #7c3aed; }
          .button { display: inline-block; background: #7c3aed; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
          .author { color: #6b7280; font-size: 14px; margin-bottom: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>💬 Nueva Respuesta</h1>
          </div>
          <div class="content">
            <p>Hola,</p>
            <p>Hay una nueva respuesta en el ticket <strong>#${ticket.numeroTicket}</strong>:</p>
            
            <div class="message-box">
              <div class="author">
                <strong>${respuesta.autorNombre}</strong> • ${new Date(respuesta.fecha).toLocaleString("es-CL")}
              </div>
              <p>${respuesta.mensaje}</p>
            </div>

            <div style="text-align: center;">
              <a href="${urlTicket}" class="button">Ver Conversación Completa</a>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private static templateCambioEstado(
    ticket: ITicket,
    estadoAnterior: string
  ): string {
    const urlTicket = `${FRONTEND_URL}/dashboard-cliente/soporte?ticket=${ticket.numeroTicket}`;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #0891b2 0%, #06b6d4 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .status-box { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
          .status-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; font-weight: bold; margin: 10px; }
          .button { display: inline-block; background: #0891b2; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🔄 Actualización de Ticket</h1>
          </div>
          <div class="content">
            <p>Hola <strong>${ticket.nombreCliente}</strong>,</p>
            <p>El estado de tu ticket <strong>#${ticket.numeroTicket}</strong> ha sido actualizado:</p>
            
            <div class="status-box">
              <div>
                <span class="status-badge" style="background: #e5e7eb; color: #6b7280;">
                  ${this.formatEstado(estadoAnterior)}
                </span>
                <span style="font-size: 24px;">→</span>
                <span class="status-badge" style="background: #dcfce7; color: #166534;">
                  ${this.formatEstado(ticket.estado)}
                </span>
              </div>
            </div>

            <div style="text-align: center;">
              <a href="${urlTicket}" class="button">Ver Detalles</a>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private static templateTicketCerrado(ticket: ITicket): string {
    const urlEncuesta = `${FRONTEND_URL}/dashboard-cliente/soporte?ticket=${ticket.numeroTicket}&encuesta=true`;

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #16a34a 0%, #22c55e 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #16a34a; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>✅ Ticket Cerrado</h1>
          </div>
          <div class="content">
            <p>Hola <strong>${ticket.nombreCliente}</strong>,</p>
            <p>Tu ticket <strong>#${ticket.numeroTicket}</strong> ha sido cerrado exitosamente.</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
              <h3 style="color: #16a34a;">¿Cómo fue tu experiencia?</h3>
              <p>Nos encantaría conocer tu opinión sobre el servicio recibido.</p>
              <a href="${urlEncuesta}" class="button">Completar Encuesta</a>
            </div>

            <p style="color: #6b7280; font-size: 14px;">
              Si necesitas reabrir este ticket o tienes alguna otra consulta, no dudes en contactarnos.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  // Helpers de formato
  private static formatCategoria(categoria: string): string {
    const categorias: Record<string, string> = {
      tecnico: "🔧 Técnico",
      facturacion: "💰 Facturación",
      consulta: "❓ Consulta",
      reclamo: "⚠️ Reclamo",
    };
    return categorias[categoria] || categoria;
  }

  private static formatPrioridad(prioridad: string): string {
    const prioridades: Record<string, string> = {
      baja: "Baja",
      media: "Media",
      alta: "Alta",
      urgente: "Urgente",
    };
    return prioridades[prioridad] || prioridad;
  }

  private static formatEstado(estado: string): string {
    const estados: Record<string, string> = {
      abierto: "Abierto",
      "en-proceso": "En Proceso",
      resuelto: "Resuelto",
      cerrado: "Cerrado",
    };
    return estados[estado] || estado;
  }
}
