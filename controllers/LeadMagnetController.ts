import { Request, Response } from "express";
import { Resend } from "resend";

// Configurar Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// Modelo simple para leads (opcional - para tracking)
interface ILead {
  email: string;
  nombre?: string;
  empresa?: string;
  fechaDescarga: Date;
  ipAddress?: string;
  userAgent?: string;
}

export class LeadMagnetController {
  // Endpoint para enviar el PDF lead magnet
  static async enviarPDFLeadMagnet(req: Request, res: Response): Promise<void> {
    try {
      const { email, nombre, empresa } = req.body;

      // Validaciones básicas
      if (!email) {
        res.status(400).json({
          success: false,
          message: "Email es requerido",
        });
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        res.status(400).json({
          success: false,
          message: "Formato de email inválido",
        });
        return;
      }

      // Configuración del email con HTML más profesional
      const htmlContent = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Su Informe Exclusivo - Electric Automatic Chile</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white;">

            <!-- Header -->
            <div style="background: linear-gradient(135deg, #ea580c, #f97316); padding: 40px 30px; text-align: center; color: white;">
              <h1 style="margin: 0; font-size: 28px; font-weight: bold;">¡Gracias por su interés!</h1>
              <p style="margin: 15px 0 0 0; font-size: 18px; opacity: 0.9;">Su informe exclusivo está adjunto</p>
            </div>

            <!-- Content -->
            <div style="padding: 40px 30px; background-color: #ffffff;">
              <h2 style="color: #ea580c; margin-bottom: 25px; font-size: 24px;">
                📊 Análisis Exclusivo: El Futuro de la Gestión Energética en Chile
              </h2>

              <p style="color: #374151; line-height: 1.7; margin-bottom: 20px;">
                ${nombre ? `Estimado/a ${nombre},` : "Estimado/a profesional,"}
              </p>

              <p style="color: #374151; line-height: 1.7; margin-bottom: 25px;">
                Nos complace enviarle nuestro informe completo sobre la infraestructura energética inteligente en Chile.
                Este documento incluye análisis detallados y proyecciones estratégicas para el sector eléctrico nacional.
              </p>

              <!-- Features List -->
              <div style="background-color: #fef3c7; border-left: 5px solid #f59e0b; padding: 25px; margin: 30px 0;">
                <h3 style="color: #92400e; margin-top: 0; margin-bottom: 15px; font-size: 18px;">
                  🔍 Contenido del Informe:
                </h3>
                <ul style="color: #92400e; line-height: 1.8; margin: 0; padding-left: 20px;">
                  <li>🔋 Análisis del panorama actual de la distribución eléctrica</li>
                  <li>📈 Tendencias tecnológicas en IoT energético y automatización</li>
                  <li>⚖️ Marco regulatorio de la SEC y nuevas normativas</li>
                  <li>💡 Casos de éxito y mejores prácticas internacionales</li>
                  <li>🚀 Proyecciones del mercado energético inteligente 2024-2030</li>
                  <li>💰 Análisis de ROI en implementaciones de automatización</li>
                </ul>
              </div>

              <!-- Call to Action -->
              <div style="text-align: center; margin: 40px 0; padding: 30px; background-color: #f8fafc; border-radius: 8px;">
                <h3 style="color: #1f2937; margin-top: 0; margin-bottom: 15px;">
                  ¿Listo para implementar estas tecnologías en su organización?
                </h3>
                <p style="color: #6b7280; margin-bottom: 25px; line-height: 1.6;">
                  Nuestro equipo de especialistas está disponible para una consulta personalizada
                  y evaluación técnica sin costo.
                </p>
                <a href="${
                  process.env.NEXT_PUBLIC_BASE_URL ||
                  "https://electricautomaticchile.com"
                }/formulario"
                   style="display: inline-block; background: linear-gradient(135deg, #ea580c, #f97316);
                          color: white; padding: 15px 35px; text-decoration: none; border-radius: 8px;
                          font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                  Solicitar Consulta Gratuita
                </a>
              </div>

              <!-- Contact Info -->
              <div style="border-top: 1px solid #e5e7eb; padding-top: 25px; margin-top: 30px;">
                <p style="color: #374151; line-height: 1.6; margin-bottom: 5px;">
                  Saludos cordiales,
                </p>
                <p style="color: #374151; line-height: 1.6; margin-bottom: 20px;">
                  <strong>Equipo Electric Automatic Chile</strong><br>
                  Especialistas en Automatización Energética<br>
                  📧 <a href="mailto:${
                    process.env.EMAIL_FROM
                  }" style="color: #ea580c; text-decoration: none;">${
                    process.env.EMAIL_FROM
                  }</a><br>
                  🌐 <a href="${
                    process.env.NEXT_PUBLIC_BASE_URL
                  }" style="color: #ea580c; text-decoration: none;">electricautomaticchile.com</a>
                </p>
              </div>
            </div>

            <!-- Footer -->
            <div style="background-color: #374151; color: white; padding: 25px 30px; text-align: center; font-size: 12px; line-height: 1.5;">
              <p style="margin: 0 0 10px 0; font-weight: bold;">
                Electric Automatic Chile - Automatización Energética Inteligente
              </p>
              <p style="margin: 0; opacity: 0.8;">
                Este email contiene información confidencial. Si lo recibió por error, por favor elimínelo.
              </p>
            </div>
          </div>
        </body>
        </html>
      `;

      // Enviar email usando Resend
      const emailData = {
        from: process.env.EMAIL_FROM || "contacto@electricautomaticchile.com",
        to: email,
        subject:
          "📊 Su Informe Exclusivo: El Futuro de la Gestión Energética en Chile",
        html: htmlContent,
        // Nota: Aquí normalmente incluirías el PDF como attachment
        // Para este ejemplo, se podría integrar con S3 o un servicio de archivos
        /*
        attachments: [
          {
            filename: 'Informe-Gestion-Energetica-Chile-2024.pdf',
            content: pdfBuffer, // Buffer del PDF
          },
        ],
        */
      };

      await resend.emails.send(emailData);

      // Opcional: Guardar el lead en base de datos para tracking
      const leadData: ILead = {
        email,
        nombre,
        empresa,
        fechaDescarga: new Date(),
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.headers["user-agent"],
      };

      // Aquí podrías guardar en MongoDB si tienes un modelo Lead
      console.log("Nuevo lead registrado:", leadData);

      res.status(200).json({
        success: true,
        message: "Informe enviado exitosamente a su email",
        data: {
          email,
          fechaEnvio: new Date().toISOString(),
        },
      });
    } catch (error) {
      console.error("Error en lead magnet:", error);

      if (error instanceof Error) {
        // Errores específicos de Resend
        if (error.message.includes("rate limit")) {
          res.status(429).json({
            success: false,
            message:
              "Demasiadas solicitudes. Por favor intente en unos minutos.",
          });
          return;
        }

        if (error.message.includes("invalid email")) {
          res.status(400).json({
            success: false,
            message: "Dirección de email inválida",
          });
          return;
        }
      }

      res.status(500).json({
        success: false,
        message: "Error interno del servidor. Por favor intente más tarde.",
        error: process.env.NODE_ENV === "development" ? error : undefined,
      });
    }
  }

  // Endpoint para obtener estadísticas de leads (para dashboard admin)
  static async obtenerEstadisticasLeads(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      // En una implementación completa, aquí consultarías la base de datos
      // Por ahora devolvemos datos simulados

      const estadisticas = {
        totalLeads: 0, // await Lead.countDocuments()
        leadsHoy: 0, // await Lead.countDocuments({ fechaDescarga: { $gte: hoy } })
        leadsSemana: 0, // await Lead.countDocuments({ fechaDescarga: { $gte: semanaAtras } })
        leadsMes: 0, // await Lead.countDocuments({ fechaDescarga: { $gte: mesAtras } })
        conversionRate: 0, // Calculado basado en leads vs clientes convertidos
      };

      res.status(200).json({
        success: true,
        data: estadisticas,
      });
    } catch (error) {
      console.error("Error al obtener estadísticas de leads:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }

  // Endpoint para obtener lista de leads (para dashboard admin)
  static async obtenerLeads(req: Request, res: Response): Promise<void> {
    try {
      const { page = 1, limit = 10, fechaInicio, fechaFin } = req.query;

      // En una implementación completa, aquí consultarías la base de datos
      // Por ahora devolvemos un array vacío con tipo explícito
      const leads: ILead[] = []; // await Lead.find(filtros).populate().sort().limit().skip()
      const total = 0; // await Lead.countDocuments(filtros)

      res.status(200).json({
        success: true,
        data: leads,
        pagination: {
          currentPage: parseInt(page as string),
          totalPages: Math.ceil(total / parseInt(limit as string)),
          totalItems: total,
          itemsPerPage: parseInt(limit as string),
        },
      });
    } catch (error) {
      console.error("Error al obtener leads:", error);
      res.status(500).json({
        success: false,
        message: "Error interno del servidor",
        error: error instanceof Error ? error.message : "Error desconocido",
      });
    }
  }
}
