const { Resend } = require("resend");
require("dotenv").config();

async function testEmail() {
  console.log("🧪 INICIANDO TEST DE EMAIL");
  console.log("=".repeat(50));

  // Verificar variables de entorno
  console.log("📋 Variables de entorno:");
  console.log(
    "  RESEND_API_KEY:",
    process.env.RESEND_API_KEY
      ? `✅ Configurada (${process.env.RESEND_API_KEY.substring(0, 8)}...)`
      : "❌ No encontrada"
  );
  console.log("  EMAIL_FROM:", process.env.EMAIL_FROM);
  console.log("  EMAIL_TO:", process.env.EMAIL_TO);

  if (!process.env.RESEND_API_KEY) {
    console.log("❌ Error: No se encontró RESEND_API_KEY");
    return;
  }

  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    console.log("\n📧 Enviando email de prueba...");

    const result = await resend.emails.send({
      from: process.env.EMAIL_FROM || "onboarding@resend.dev",
      to: process.env.EMAIL_TO || "electricautomaticchile@gmail.com",
      subject: "🧪 TEST - Prueba del sistema de emails",
      html: `
        <h2>✅ Email de Prueba Exitoso</h2>
        <p>Si estás leyendo este mensaje, significa que el sistema de emails está funcionando correctamente.</p>
        <p><strong>Hora de envío:</strong> ${new Date().toLocaleString("es-ES")}</p>
        <p><strong>Desde:</strong> ${process.env.EMAIL_FROM}</p>
        <hr>
        <p><em>Este es un mensaje de prueba del sistema Electric Automatic Chile</em></p>
      `,
      text: "Email de prueba - Sistema funcionando correctamente",
    });

    console.log("✅ Email enviado exitosamente!");
    console.log("📧 ID del mensaje:", result.id);
    console.log("📧 Resultado completo:", JSON.stringify(result, null, 2));
  } catch (error) {
    console.log("❌ ERROR al enviar email:");
    console.log("  Tipo:", error.name);
    console.log("  Mensaje:", error.message);

    if (error.message.includes("unauthorized")) {
      console.log(
        "\n💡 POSIBLE SOLUCIÓN: El dominio no está verificado en Resend"
      );
      console.log("   1. Ve a https://resend.com/domains");
      console.log("   2. Verifica el dominio electricautomaticchile.com");
      console.log("   3. O usa onboarding@resend.dev temporalmente");
    }

    if (error.message.includes("api_key")) {
      console.log("\n💡 POSIBLE SOLUCIÓN: Problema con la API Key");
      console.log("   1. Verifica que la API Key sea correcta en .env");
      console.log("   2. Genera una nueva API Key en Resend");
    }
  }
}

testEmail();
