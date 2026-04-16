// Módulo de email con Nodemailer
// Decisión: Nodemailer sobre servicios de terceros (Resend, SendGrid) para MVP
// Facilmente reemplazable cambiando el transporter
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: Number(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ─── Templates ───────────────────────────────────────────────

function baseTemplate(content: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: Inter, Arial, sans-serif; background: #0a0a0f; color: #e5e7eb; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
        .logo { color: #ff1a7c; font-size: 24px; font-weight: 800; margin-bottom: 32px; }
        .card { background: #141422; border: 1px solid #22223b; border-radius: 16px; padding: 32px; }
        h1 { font-size: 24px; font-weight: 700; margin: 0 0 16px; }
        p { color: #9ca3af; line-height: 1.6; margin: 0 0 16px; }
        .btn { display: inline-block; background: linear-gradient(135deg, #ff1a7c, #8b5cf6); color: white;
               padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 8px; }
        .footer { margin-top: 32px; color: #4b5563; font-size: 12px; text-align: center; }
        .event-info { background: #1a1a2e; border-radius: 8px; padding: 16px; margin: 16px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">Eventure ✦</div>
        <div class="card">${content}</div>
        <div class="footer">
          <p>© 2024 Eventure. Plataforma para mayores de 18 años.</p>
          <p>Si no solicitaste este email, ignóralo.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// ─── Funciones de envío ───────────────────────────────────────

export async function sendAttendanceConfirmation(
  to: string,
  nombre: string,
  evento: { nombre: string; fechaInicio: Date; direccion: string; id: string }
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const content = `
    <h1>¡Confirmado! Nos vemos ahí 🎉</h1>
    <p>Hola ${nombre}, tu asistencia ha sido confirmada para:</p>
    <div class="event-info">
      <strong style="color: #ff1a7c; font-size: 18px;">${evento.nombre}</strong><br>
      <p style="margin: 8px 0 0;">📅 ${evento.fechaInicio.toLocaleDateString("es-MX", { weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
      <p style="margin: 4px 0 0;">📍 ${evento.direccion}</p>
    </div>
    <a href="${appUrl}/evento/${evento.id}" class="btn">Ver evento →</a>
    <p style="margin-top: 24px; font-size: 13px; color: #6b7280;">
      Recuerda que la plataforma es un intermediario tecnológico.
      El organizador del evento es el único responsable de su realización.
    </p>
  `;
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: `✅ Confirmado: ${evento.nombre}`,
    html: baseTemplate(content),
  });
}

export async function sendApprovalNotification(
  to: string,
  nombre: string,
  evento: { nombre: string; id: string },
  aprobado: boolean,
  nota?: string
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const content = aprobado
    ? `
      <h1>¡Tu solicitud fue aprobada! ✅</h1>
      <p>Hola ${nombre}, el organizador de <strong>${evento.nombre}</strong> aprobó tu solicitud de asistencia.</p>
      ${nota ? `<div class="event-info"><strong>Nota del organizador:</strong><br><p>${nota}</p></div>` : ""}
      <a href="${appUrl}/evento/${evento.id}" class="btn">Ver detalles del evento →</a>
    `
    : `
      <h1>Solicitud no aprobada</h1>
      <p>Hola ${nombre}, lamentablemente el organizador de <strong>${evento.nombre}</strong> no aprobó tu solicitud.</p>
      ${nota ? `<div class="event-info"><strong>Motivo:</strong><br><p>${nota}</p></div>` : ""}
      <a href="${process.env.NEXT_PUBLIC_APP_URL}/explorar" class="btn">Explorar otros eventos →</a>
    `;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: aprobado
      ? `✅ Aprobado: ${evento.nombre}`
      : `❌ Solicitud no aprobada: ${evento.nombre}`,
    html: baseTemplate(content),
  });
}

export async function sendEventReminder(
  to: string,
  nombre: string,
  evento: { nombre: string; fechaInicio: Date; direccion: string; id: string }
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const content = `
    <h1>Tu evento es mañana 🔔</h1>
    <p>Hola ${nombre}, te recordamos que mañana tienes:</p>
    <div class="event-info">
      <strong style="color: #ff1a7c; font-size: 18px;">${evento.nombre}</strong><br>
      <p style="margin: 8px 0 0;">🕐 ${evento.fechaInicio.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}</p>
      <p style="margin: 4px 0 0;">📍 ${evento.direccion}</p>
    </div>
    <a href="${appUrl}/evento/${evento.id}" class="btn">Ver evento →</a>
  `;
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: `⏰ Mañana: ${evento.nombre}`,
    html: baseTemplate(content),
  });
}

export async function sendCapacityReductionNotification(
  to: string,
  nombre: string,
  evento: { nombre: string; id: string }
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const content = `
    <h1>Tu asistencia fue cancelada</h1>
    <p>Hola ${nombre}, el organizador de <strong>${evento.nombre}</strong> redujo la capacidad máxima del evento y tu lugar fue liberado.</p>
    <p style="color:#9ca3af; font-size:13px;">Los lugares se asignan por orden de registro; los últimos en registrarse son los primeros en ser removidos cuando se reduce la capacidad.</p>
    <a href="${appUrl}/explorar" class="btn">Explorar otros eventos →</a>
  `;
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: `ℹ️ Asistencia cancelada: ${evento.nombre}`,
    html: baseTemplate(content),
  });
}

export async function sendEventUpdate(
  to: string,
  nombre: string,
  evento: { nombre: string; fechaInicio: Date; direccion: string; id: string },
  cambios: string
) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL;
  const content = `
    <h1>Actualización del evento 📝</h1>
    <p>Hola ${nombre}, el organizador ha realizado cambios en un evento al que vas a asistir:</p>
    <div class="event-info">
      <strong style="color: #ff1a7c; font-size: 18px;">${evento.nombre}</strong><br>
      <p style="margin: 8px 0 0;">📅 ${evento.fechaInicio.toLocaleDateString("es-MX", { weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
      <p style="margin: 4px 0 0;">📍 ${evento.direccion}</p>
    </div>
    ${cambios ? `<div class="event-info"><strong>Cambios:</strong><br><p>${cambios}</p></div>` : ""}
    <a href="${appUrl}/evento/${evento.id}" class="btn">Ver evento actualizado →</a>
  `;
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: `📝 Actualización: ${evento.nombre}`,
    html: baseTemplate(content),
  });
}

export async function sendEventCancellation(
  to: string,
  nombre: string,
  evento: { nombre: string; fechaInicio: Date }
) {
  const content = `
    <h1>Evento cancelado</h1>
    <p>Hola ${nombre}, lamentamos informarte que el siguiente evento fue cancelado por el organizador:</p>
    <div class="event-info">
      <strong style="color: #ff1a7c; font-size: 18px;">${evento.nombre}</strong><br>
      <p style="margin: 8px 0 0;">📅 ${evento.fechaInicio.toLocaleDateString("es-MX", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
    </div>
    <p>Si realizaste un pago, el reembolso será procesado en 5-10 días hábiles.</p>
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/explorar" class="btn">Buscar otros eventos →</a>
  `;
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: `❌ Cancelado: ${evento.nombre}`,
    html: baseTemplate(content),
  });
}
