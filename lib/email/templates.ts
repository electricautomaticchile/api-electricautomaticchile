// Templates profesionales para emails de Electric Automatic Chile

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
  const servicios: { [key: string]: string } = {
    cotizacion_reposicion: "🔄 Sistema de Reposición Automática",
    cotizacion_monitoreo: "📊 Sistema de Monitoreo IoT",
    cotizacion_mantenimiento: "🔧 Mantenimiento Preventivo",
    cotizacion_completa: "⚡ Solución Integral de Automatización",
    cotizacion_hardware: "🖥️ Hardware Especializado",
    cotizacion_consumo: "📈 Análisis de Consumo Energético",
  };

  return (
    servicios[servicio] ||
    servicio
      .replace("cotizacion_", "")
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  );
};

// Función para formatear el plazo
const formatPlazo = (plazo: string): string => {
  const plazos: { [key: string]: string } = {
    urgente: "🚨 Urgente (1-2 días)",
    pronto: "⚡ Pronto (3-7 días)",
    normal: "📅 Normal (1-2 semanas)",
    planificacion: "📋 En planificación (1 mes o más)",
  };

  return plazos[plazo] || plazo;
};

// Estilos CSS comunes para todos los templates
const baseStyles = `
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #333333;
      background-color: #f8fafc;
    }
    
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    
    .header {
      background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%);
      padding: 30px 20px;
      text-align: center;
      color: white;
    }
    
    .header h1 {
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 8px;
    }
    
    .header p {
      font-size: 16px;
      opacity: 0.9;
      font-weight: 300;
    }
    
    .content {
      padding: 30px;
    }
    
    .section {
      margin-bottom: 25px;
      padding: 20px;
      background-color: #f8fafc;
      border-radius: 8px;
      border-left: 4px solid #ff6b35;
    }
    
    .section h3 {
      color: #1e293b;
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 15px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .info-grid {
      display: grid;
      gap: 12px;
    }
    
    .info-item {
      display: flex;
      align-items: flex-start;
      gap: 10px;
    }
    
    .info-label {
      font-weight: 600;
      color: #475569;
      min-width: 100px;
    }
    
    .info-value {
      color: #1e293b;
      flex: 1;
    }
    
    .message-box {
      background-color: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 16px;
      white-space: pre-wrap;
      font-size: 14px;
      line-height: 1.5;
    }
    
    .priority-high {
      background-color: #fef2f2;
      border-left-color: #ef4444;
    }
    
    .priority-medium {
      background-color: #fffbeb;
      border-left-color: #f59e0b;
    }
    
    .footer {
      background-color: #1e293b;
      padding: 25px;
      text-align: center;
      color: #94a3b8;
    }
    
    .footer h4 {
      color: #ffffff;
      font-size: 18px;
      margin-bottom: 10px;
    }
    
    .footer p {
      font-size: 14px;
      margin-bottom: 8px;
    }
    
    .footer a {
      color: #ff6b35;
      text-decoration: none;
    }
    
    .footer a:hover {
      text-decoration: underline;
    }
    
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%);
      color: white;
      padding: 12px 24px;
      border-radius: 6px;
      text-decoration: none;
      font-weight: 600;
      margin: 15px 0;
      transition: transform 0.2s;
    }
    
    .cta-button:hover {
      transform: translateY(-1px);
    }
    
    .timestamp {
      font-size: 12px;
      color: #64748b;
      text-align: center;
      margin-top: 20px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
    }
    
    @media (max-width: 600px) {
      .email-container {
        margin: 0;
        border-radius: 0;
      }
      
      .content {
        padding: 20px;
      }
      
      .section {
        padding: 15px;
      }
    }
  </style>
`;

// Template para notificación al administrador
export function getAdminNotificationTemplate(
  formData: IFormularioContacto
): string {
  const fechaActual = new Date();
  const fechaFormateada = fechaActual.toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const horaFormateada = fechaActual.toLocaleTimeString("es-ES");

  const servicioFormateado = formatServicio(formData.servicio);
  const plazoFormateado = formData.plazo ? formatPlazo(formData.plazo) : null;

  // Determinar prioridad basada en el servicio y plazo
  const esPrioridadAlta =
    formData.plazo === "urgente" || formData.servicio === "cotizacion_completa";
  const clasePrioridad = esPrioridadAlta ? "priority-high" : "priority-medium";

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Nueva Solicitud de Cotización - Electric Automatic Chile</title>
      ${baseStyles}
    </head>
    <body>
      <div class="email-container">
        <!-- Header -->
        <div class="header">
          <h1>⚡ Electric Automatic Chile</h1>
          <p>Nueva Solicitud de Cotización Recibida</p>
        </div>
        
        <!-- Content -->
        <div class="content">
          <!-- Alerta de prioridad -->
          ${
            esPrioridadAlta
              ? `
            <div class="section priority-high">
              <h3>🚨 Solicitud de Alta Prioridad</h3>
              <p>Esta cotización requiere atención inmediata debido a su urgencia o complejidad.</p>
            </div>
          `
              : ""
          }
          
          <!-- Información del cliente -->
          <div class="section">
            <h3>👤 Información del Cliente</h3>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Nombre:</span>
                <span class="info-value"><strong>${formData.nombre}</strong></span>
              </div>
              <div class="info-item">
                <span class="info-label">Email:</span>
                <span class="info-value">
                  <a href="mailto:${formData.email}" style="color: #ff6b35;">${formData.email}</a>
                </span>
              </div>
              ${
                formData.empresa
                  ? `
                <div class="info-item">
                  <span class="info-label">Empresa:</span>
                  <span class="info-value">${formData.empresa}</span>
                </div>
              `
                  : ""
              }
              ${
                formData.telefono
                  ? `
                <div class="info-item">
                  <span class="info-label">Teléfono:</span>
                  <span class="info-value">
                    <a href="tel:${formData.telefono}" style="color: #ff6b35;">${formData.telefono}</a>
                  </span>
                </div>
              `
                  : ""
              }
            </div>
          </div>
          
          <!-- Detalles del proyecto -->
          <div class="section">
            <h3>📋 Detalles del Proyecto</h3>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Servicio:</span>
                <span class="info-value"><strong>${servicioFormateado}</strong></span>
              </div>
              ${
                plazoFormateado
                  ? `
                <div class="info-item">
                  <span class="info-label">Plazo:</span>
                  <span class="info-value">${plazoFormateado}</span>
                </div>
              `
                  : ""
              }
              <div class="info-item">
                <span class="info-label">Fecha:</span>
                <span class="info-value">${fechaFormateada} a las ${horaFormateada}</span>
              </div>
            </div>
          </div>
          
          <!-- Descripción del proyecto -->
          <div class="section">
            <h3>💬 Descripción del Proyecto</h3>
            <div class="message-box">${formData.mensaje}</div>
          </div>
          
          ${
            formData.archivo
              ? `
            <!-- Archivo adjunto -->
            <div class="section">
              <h3>📎 Archivo Adjunto</h3>
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">Archivo:</span>
                  <span class="info-value">${formData.archivo}</span>
                </div>
                ${
                  formData.archivoTipo
                    ? `
                  <div class="info-item">
                    <span class="info-label">Tipo:</span>
                    <span class="info-value">${formData.archivoTipo}</span>
                  </div>
                `
                    : ""
                }
              </div>
              <p style="margin-top: 10px; font-size: 14px; color: #64748b;">
                📁 El archivo está disponible en el sistema de gestión.
              </p>
            </div>
          `
              : ""
          }
          
          <!-- Acciones recomendadas -->
          <div class="section">
            <h3>🎯 Próximos Pasos</h3>
            <p style="margin-bottom: 15px;">Te recomendamos:</p>
            <ul style="margin-left: 20px; color: #475569;">
              <li>Contactar al cliente en las próximas 2 horas</li>
              <li>Revisar los detalles técnicos del proyecto</li>
              <li>Preparar una propuesta inicial</li>
              ${esPrioridadAlta ? "<li><strong>⚠️ Dar prioridad alta a esta solicitud</strong></li>" : ""}
            </ul>
            
            <div style="text-align: center; margin-top: 20px;">
              <a href="mailto:${formData.email}?subject=Re: Cotización ${servicioFormateado}&body=Estimado/a ${formData.nombre},%0D%0A%0D%0AGracias por contactarnos..." 
                 class="cta-button">
                📧 Responder al Cliente
              </a>
            </div>
          </div>
          
          <!-- Timestamp -->
          <div class="timestamp">
            Mensaje generado automáticamente el ${fechaFormateada} a las ${horaFormateada}
          </div>
        </div>
        
        <!-- Footer -->
        <div class="footer">
          <h4>Electric Automatic Chile</h4>
          <p>Automatización Industrial • IoT • Eficiencia Energética</p>
          <p>
            📧 <a href="mailto:electricautomaticchile@gmail.com">electricautomaticchile@gmail.com</a> • 
            🌐 <a href="https://electricautomaticchile.com">electricautomaticchile.com</a>
          </p>
          <p style="margin-top: 15px; font-size: 12px;">
            Este es un mensaje automático del sistema de cotizaciones.<br>
            Para responder, contacta directamente al cliente.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Template para respuesta automática al usuario
export function getUserAutoResponseTemplate(
  nombre: string,
  email: string
): string {
  const fechaActual = new Date();
  const fechaFormateada = fechaActual.toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Confirmación de Solicitud - Electric Automatic Chile</title>
      ${baseStyles}
    </head>
    <body>
      <div class="email-container">
        <!-- Header -->
        <div class="header">
          <h1>⚡ Electric Automatic Chile</h1>
          <p>Confirmación de Solicitud de Cotización</p>
        </div>
        
        <!-- Content -->
        <div class="content">
          <!-- Saludo personalizado -->
          <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="color: #1e293b; font-size: 24px; margin-bottom: 10px;">
              ¡Hola ${nombre}! 👋
            </h2>
            <p style="font-size: 18px; color: #475569;">
              Hemos recibido tu solicitud de cotización
            </p>
          </div>
          
          <!-- Confirmación -->
          <div class="section">
            <h3>✅ Solicitud Recibida Exitosamente</h3>
            <p style="margin-bottom: 15px;">
              Tu solicitud de cotización ha sido recibida y registrada en nuestro sistema. 
              Nuestro equipo de especialistas la está revisando y te contactaremos pronto.
            </p>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Fecha:</span>
                <span class="info-value">${fechaFormateada}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Email:</span>
                <span class="info-value">${email}</span>
              </div>
            </div>
          </div>
          
          <!-- Qué esperar -->
          <div class="section">
            <h3>⏰ ¿Qué Sigue Ahora?</h3>
            <div style="margin-left: 20px;">
              <div style="margin-bottom: 12px; display: flex; align-items: flex-start; gap: 10px;">
                <span style="color: #ff6b35; font-weight: bold;">1.</span>
                <span><strong>Revisión Técnica</strong> - Analizaremos los detalles de tu proyecto</span>
              </div>
              <div style="margin-bottom: 12px; display: flex; align-items: flex-start; gap: 10px;">
                <span style="color: #ff6b35; font-weight: bold;">2.</span>
                <span><strong>Contacto Directo</strong> - Te llamaremos o escribiremos en las próximas 24 horas</span>
              </div>
              <div style="margin-bottom: 12px; display: flex; align-items: flex-start; gap: 10px;">
                <span style="color: #ff6b35; font-weight: bold;">3.</span>
                <span><strong>Propuesta Personalizada</strong> - Recibirás una cotización detallada</span>
              </div>
            </div>
          </div>
          
          <!-- Servicios destacados -->
          <div class="section">
            <h3>🚀 Nuestros Servicios</h3>
            <div style="display: grid; gap: 10px; margin-top: 15px;">
              <div style="padding: 10px; background: white; border-radius: 6px; border-left: 3px solid #ff6b35;">
                <strong>⚡ Automatización Industrial</strong><br>
                <span style="color: #64748b; font-size: 14px;">Sistemas inteligentes para optimizar tus procesos</span>
              </div>
              <div style="padding: 10px; background: white; border-radius: 6px; border-left: 3px solid #ff6b35;">
                <strong>📊 Monitoreo IoT</strong><br>
                <span style="color: #64748b; font-size: 14px;">Control en tiempo real de tus equipos y consumos</span>
              </div>
              <div style="padding: 10px; background: white; border-radius: 6px; border-left: 3px solid #ff6b35;">
                <strong>🔧 Mantenimiento Preventivo</strong><br>
                <span style="color: #64748b; font-size: 14px;">Evita fallas y reduce costos operativos</span>
              </div>
            </div>
          </div>
          
          <!-- Contacto de emergencia -->
          <div class="section">
            <h3>📞 ¿Necesitas Contactarnos?</h3>
            <p style="margin-bottom: 15px;">
              Si tienes alguna pregunta urgente o quieres agregar información adicional:
            </p>
            <div style="text-align: center;">
              <a href="mailto:electricautomaticchile@gmail.com?subject=Consulta sobre mi cotización&body=Hola, tengo una consulta sobre mi solicitud de cotización..." 
                 class="cta-button">
                📧 Contactar Ahora
              </a>
            </div>
          </div>
          
          <!-- Timestamp -->
          <div class="timestamp">
            Mensaje enviado automáticamente el ${fechaFormateada}
          </div>
        </div>
        
        <!-- Footer -->
        <div class="footer">
          <h4>Electric Automatic Chile</h4>
          <p>Automatización Industrial • IoT • Eficiencia Energética</p>
          <p>
            📧 <a href="mailto:electricautomaticchile@gmail.com">electricautomaticchile@gmail.com</a> • 
            🌐 <a href="https://electricautomaticchile.com">electricautomaticchile.com</a>
          </p>
          <p style="margin-top: 15px; font-size: 12px;">
            Gracias por confiar en Electric Automatic Chile.<br>
            Tu éxito es nuestro compromiso.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// Template para notificaciones de seguimiento
export function getFollowUpTemplate(
  nombre: string,
  email: string,
  diasTranscurridos: number
): string {
  return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Seguimiento de Cotización - Electric Automatic Chile</title>
      ${baseStyles}
    </head>
    <body>
      <div class="email-container">
        <div class="header">
          <h1>⚡ Electric Automatic Chile</h1>
          <p>Seguimiento de tu Cotización</p>
        </div>
        
        <div class="content">
          <div style="text-align: center; margin-bottom: 30px;">
            <h2 style="color: #1e293b; font-size: 24px; margin-bottom: 10px;">
              Hola ${nombre} 👋
            </h2>
            <p style="font-size: 18px; color: #475569;">
              Queremos saber cómo podemos ayudarte mejor
            </p>
          </div>
          
          <div class="section">
            <h3>⏰ Estado de tu Solicitud</h3>
            <p>
              Han pasado ${diasTranscurridos} días desde tu solicitud de cotización. 
              Queremos asegurarnos de que tengas toda la información que necesitas.
            </p>
          </div>
          
          <div class="section">
            <h3>🤝 ¿Cómo Podemos Ayudarte?</h3>
            <p>Si tienes alguna pregunta o necesitas información adicional:</p>
            <div style="text-align: center; margin-top: 20px;">
              <a href="mailto:electricautomaticchile@gmail.com?subject=Seguimiento de cotización&body=Hola, quiero hacer seguimiento a mi cotización..." 
                 class="cta-button">
                📧 Contactar Ahora
              </a>
            </div>
          </div>
        </div>
        
        <div class="footer">
          <h4>Electric Automatic Chile</h4>
          <p>Tu éxito es nuestro compromiso</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
