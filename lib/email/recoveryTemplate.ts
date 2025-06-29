export const recoveryEmailTemplate = (
  nombre: string,
  numeroCliente: string,
  tipoUsuario: string,
  recoveryUrl: string
) => {
  const tipoTexto =
    tipoUsuario === "empresa"
      ? "empresa"
      : tipoUsuario === "superadmin"
        ? "administrador"
        : "cliente";

  return {
    subject: "Recuperación de Contraseña - Electric Automatic Chile",
    html: `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Recuperación de Contraseña</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            background: linear-gradient(135deg, #f97316, #ea580c);
            color: white;
            padding: 30px 20px;
            text-align: center;
        }
        .header h1 {
            margin: 0;
            font-size: 28px;
            font-weight: 600;
        }
        .header p {
            margin: 5px 0 0 0;
            opacity: 0.9;
            font-size: 16px;
        }
        .content {
            padding: 40px 30px;
        }
        .greeting {
            font-size: 18px;
            color: #333;
            margin-bottom: 20px;
        }
        .message {
            color: #555;
            font-size: 16px;
            margin-bottom: 30px;
            line-height: 1.6;
        }
        .info-box {
            background-color: #fef3cd;
            border: 1px solid #fde047;
            border-radius: 6px;
            padding: 20px;
            margin: 20px 0;
        }
        .info-box h3 {
            color: #92400e;
            margin: 0 0 10px 0;
            font-size: 16px;
        }
        .info-box p {
            color: #92400e;
            margin: 5px 0;
            font-size: 14px;
        }
        .button-container {
            text-align: center;
            margin: 30px 0;
        }
        .reset-button {
            display: inline-block;
            background: linear-gradient(135deg, #f97316, #ea580c);
            color: white;
            text-decoration: none;
            padding: 15px 30px;
            border-radius: 6px;
            font-weight: 600;
            font-size: 16px;
            transition: all 0.3s ease;
        }
        .reset-button:hover {
            background: linear-gradient(135deg, #ea580c, #c2410c);
            transform: translateY(-1px);
        }
        .security-notice {
            background-color: #fef2f2;
            border: 1px solid #fecaca;
            border-radius: 6px;
            padding: 20px;
            margin: 30px 0;
        }
        .security-notice h3 {
            color: #dc2626;
            margin: 0 0 10px 0;
            font-size: 16px;
        }
        .security-notice ul {
            color: #7f1d1d;
            margin: 10px 0;
            padding-left: 20px;
        }
        .security-notice li {
            margin: 5px 0;
            font-size: 14px;
        }
        .footer {
            background-color: #f9fafb;
            padding: 30px 20px;
            text-align: center;
            border-top: 1px solid #e5e7eb;
        }
        .footer p {
            color: #6b7280;
            margin: 5px 0;
            font-size: 14px;
        }
        .footer a {
            color: #f97316;
            text-decoration: none;
        }
        .footer a:hover {
            text-decoration: underline;
        }
        @media (max-width: 600px) {
            .container {
                margin: 10px;
                border-radius: 4px;
            }
            .content {
                padding: 30px 20px;
            }
            .header {
                padding: 25px 15px;
            }
            .header h1 {
                font-size: 24px;
            }
            .reset-button {
                padding: 12px 25px;
                font-size: 15px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔐 Recuperación de Contraseña</h1>
            <p>Electric Automatic Chile</p>
        </div>

        <div class="content">
            <div class="greeting">
                Hola <strong>${nombre}</strong>,
            </div>

            <div class="message">
                Hemos recibido una solicitud para restablecer la contraseña de tu cuenta de ${tipoTexto}.
            </div>

            <div class="info-box">
                <h3>📋 Información de tu cuenta:</h3>
                <p><strong>Número de Cliente:</strong> ${numeroCliente}</p>
                <p><strong>Tipo de Usuario:</strong> ${tipoTexto.charAt(0).toUpperCase() + tipoTexto.slice(1)}</p>
                <p><strong>Email:</strong> ${recoveryUrl.includes("@") ? recoveryUrl.split("/").pop() : "Este correo"}</p>
            </div>

            <div class="button-container">
                <a href="${recoveryUrl}" class="reset-button">
                    🔑 Restablecer mi Contraseña
                </a>
            </div>

            <div class="security-notice">
                <h3>🔒 Importante - Medidas de Seguridad:</h3>
                <ul>
                    <li><strong>Este enlace expira en 10 minutos</strong> por tu seguridad</li>
                    <li>Solo funciona una vez - si ya lo usaste, solicita uno nuevo</li>
                    <li>Si no solicitaste este cambio, ignora este email</li>
                    <li>Nunca compartas este enlace con otras personas</li>
                    <li>Asegúrate de estar en el sitio oficial antes de ingresar tu nueva contraseña</li>
                </ul>
            </div>

            <div class="message">
                Si el botón no funciona, copia y pega este enlace en tu navegador:
                <br><br>
                <a href="${recoveryUrl}" style="color: #f97316; word-break: break-all;">${recoveryUrl}</a>
            </div>
        </div>

        <div class="footer">
            <p><strong>Electric Automatic Chile</strong></p>
            <p>Soluciones Inteligentes en Energía Eléctrica</p>
            <br>
            <p>📧 <a href="mailto:soporte@electricautomaticchile.com">soporte@electricautomaticchile.com</a></p>
            <p>📞 <a href="tel:+56912345678">+56 9 1234 5678</a></p>
            <p>🌐 <a href="https://electricautomaticchile.com">www.electricautomaticchile.com</a></p>
            <br>
            <p style="font-size: 12px; color: #9ca3af;">
                Este es un mensaje automático, por favor no respondas a este email.
                <br>
                Si tienes problemas, contacta a nuestro equipo de soporte.
            </p>
        </div>
    </div>
</body>
</html>`,
    text: `
Recuperación de Contraseña - Electric Automatic Chile

Hola ${nombre},

Hemos recibido una solicitud para restablecer la contraseña de tu cuenta de ${tipoTexto}.

Información de tu cuenta:
- Número de Cliente: ${numeroCliente}
- Tipo de Usuario: ${tipoTexto.charAt(0).toUpperCase() + tipoTexto.slice(1)}

Para restablecer tu contraseña, haz clic en el siguiente enlace:
${recoveryUrl}

⚠️ IMPORTANTE:
- Este enlace expira en 10 minutos por tu seguridad
- Solo funciona una vez
- Si no solicitaste este cambio, ignora este email
- Nunca compartas este enlace con otras personas

Soporte:
- Email: soporte@electricautomaticchile.com
- Teléfono: +56 9 1234 5678
- Web: www.electricautomaticchile.com

Electric Automatic Chile
Soluciones Inteligentes en Energía Eléctrica
    `,
  };
};
