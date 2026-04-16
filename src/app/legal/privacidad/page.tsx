export const dynamic = "force-dynamic";
// Aviso de Privacidad COMPLETO — Cumplimiento LFPDPPP (México)
import Link from "next/link";

export const metadata = {
  title: "Aviso de Privacidad",
  description: "Aviso de Privacidad de Eventure — Cumplimiento LFPDPPP",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-xl font-bold text-white mb-4 pb-2 border-b border-surface-500">{title}</h2>
      <div className="space-y-4 text-gray-300 leading-relaxed text-sm">{children}</div>
    </section>
  );
}

function DataTable({ rows }: { rows: { dato: string; uso: string; base: string }[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-surface-400">
            <th className="text-left py-2 px-3 text-gray-400 font-medium">Dato</th>
            <th className="text-left py-2 px-3 text-gray-400 font-medium">Uso</th>
            <th className="text-left py-2 px-3 text-gray-400 font-medium">Base legal</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-600">
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-surface-600/30">
              <td className="py-2 px-3 text-white">{row.dato}</td>
              <td className="py-2 px-3 text-gray-300">{row.uso}</td>
              <td className="py-2 px-3 text-gray-400">{row.base}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function PrivacidadPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="mb-10">
        <Link href="/" className="text-brand-400 text-sm hover:underline mb-4 inline-block">
          ← Volver al inicio
        </Link>
        <h1 className="text-4xl font-black text-white mb-3">Aviso de Privacidad</h1>
        <p className="text-gray-400 text-sm">
          Última actualización: 1 de enero de 2024<br/>
          En cumplimiento con la <strong className="text-gray-300">Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP)</strong> y su Reglamento.
        </p>
      </div>

      <div className="card p-8">

        {/* Identidad del responsable */}
        <Section title="I. Identidad y Domicilio del Responsable">
          <p>
            <strong className="text-white">Eventure</strong> (en adelante, "el Responsable"), con domicilio en
            Ciudad de México, México, es responsable del tratamiento de sus datos personales conforme
            a lo establecido en la Ley Federal de Protección de Datos Personales en Posesión de los
            Particulares y su Reglamento.
          </p>
          <p>
            <strong className="text-white">Contacto del Responsable:</strong><br/>
            Email de privacidad: privacidad@eventure.mx<br/>
            Sitio web: eventure.mx
          </p>
        </Section>

        {/* Datos que se recopilan */}
        <Section title="II. Datos Personales que Recopilamos">
          <p>Recopilamos las siguientes categorías de datos personales:</p>

          <h3 className="text-white font-semibold mt-4 mb-2">A. Datos de registro obligatorios</h3>
          <DataTable rows={[
            { dato: "Nombre completo", uso: "Identificación en la plataforma, comunicaciones", base: "Contrato / Consentimiento" },
            { dato: "Correo electrónico", uso: "Autenticación, notificaciones, comunicaciones", base: "Contrato" },
            { dato: "Fecha de nacimiento", uso: "Verificación de mayoría de edad (+18)", base: "Cumplimiento legal / Contrato" },
            { dato: "Contraseña (hash)", uso: "Autenticación segura", base: "Contrato" },
          ]} />

          <h3 className="text-white font-semibold mt-4 mb-2">B. Datos de perfil opcionales</h3>
          <DataTable rows={[
            { dato: "Fotografía de perfil", uso: "Personalización del perfil público", base: "Consentimiento" },
            { dato: "Biografía / descripción", uso: "Perfil público de usuario", base: "Consentimiento" },
          ]} />

          <h3 className="text-white font-semibold mt-4 mb-2">C. Datos de eventos (para Organizadores)</h3>
          <DataTable rows={[
            { dato: "Nombre y descripción del evento", uso: "Publicación del evento en la plataforma", base: "Contrato" },
            { dato: "Dirección y coordenadas geográficas", uso: "Geolocalización del evento en el mapa", base: "Contrato" },
            { dato: "Fotografías y videos del evento", uso: "Presentación visual del evento", base: "Consentimiento" },
          ]} />

          <h3 className="text-white font-semibold mt-4 mb-2">D. Datos de uso y navegación</h3>
          <DataTable rows={[
            { dato: "Dirección IP", uso: "Seguridad, prevención de fraudes", base: "Interés legítimo" },
            { dato: "Datos de sesión y cookies", uso: "Funcionamiento de la plataforma, personalización", base: "Consentimiento / Contrato" },
            { dato: "Geolocalización (con permiso)", uso: "Mostrar eventos cercanos", base: "Consentimiento" },
            { dato: "Logs de actividad", uso: "Seguridad, auditoría, mejora del servicio", base: "Interés legítimo" },
          ]} />

          <h3 className="text-white font-semibold mt-4 mb-2">E. Datos financieros (procesados por terceros)</h3>
          <p className="text-gray-400">
            Los datos de tarjetas de crédito/débito son procesados directamente por <strong className="text-gray-300">Stripe, Inc.</strong>,
            un procesador de pagos certificado PCI DSS. Eventure <strong className="text-white">NO almacena</strong> datos de tarjetas bancarias.
            Stripe cuenta con su propio Aviso de Privacidad disponible en stripe.com/privacy.
          </p>
        </Section>

        {/* Finalidades */}
        <Section title="III. Finalidades del Tratamiento">
          <p><strong className="text-white">Finalidades primarias (necesarias para el servicio):</strong></p>
          <ul className="list-disc ml-5 space-y-2">
            <li>Crear y gestionar tu cuenta de usuario.</li>
            <li>Verificar que eres mayor de 18 años.</li>
            <li>Permitirte publicar, buscar y registrarte en eventos.</li>
            <li>Procesar pagos de eventos de pago a través de Stripe.</li>
            <li>Enviarte notificaciones relacionadas con eventos (confirmaciones, recordatorios, cambios).</li>
            <li>Mostrarte eventos cercanos a tu ubicación (con tu permiso).</li>
            <li>Gestionar solicitudes de asistencia y comunicación con Organizadores.</li>
            <li>Cumplir con obligaciones legales aplicables.</li>
          </ul>

          <p className="mt-4"><strong className="text-white">Finalidades secundarias (opcionales, requieren tu consentimiento):</strong></p>
          <ul className="list-disc ml-5 space-y-2">
            <li>Enviarte comunicaciones de marketing sobre nuevos eventos y funcionalidades.</li>
            <li>Realizar encuestas de satisfacción.</li>
            <li>Análisis estadísticos agregados sobre el uso de la plataforma.</li>
          </ul>
          <p>
            Si no deseas que tus datos sean tratados para las finalidades secundarias, puedes ejercer
            tu derecho de oposición en cualquier momento contactando a privacidad@eventure.mx.
          </p>
        </Section>

        {/* Transferencia de datos */}
        <Section title="IV. Transferencias de Datos Personales">
          <p>Tus datos personales pueden ser compartidos con las siguientes categorías de terceros:</p>
          <DataTable rows={[
            { dato: "Clerk, Inc.", uso: "Proveedor de autenticación. Gestiona inicio de sesión y seguridad de cuentas.", base: "Contrato" },
            { dato: "Stripe, Inc.", uso: "Procesamiento de pagos. Solo recibe los datos necesarios para transacciones.", base: "Contrato" },
            { dato: "Cloudinary Inc.", uso: "Almacenamiento de imágenes y videos subidos a la plataforma.", base: "Contrato" },
            { dato: "Mapbox Inc.", uso: "Servicios de mapas e geocodificación.", base: "Contrato" },
            { dato: "Autoridades", uso: "Cuando sea requerido por ley, orden judicial o para proteger derechos legales.", base: "Obligación legal" },
          ]} />
          <p>
            No vendemos ni alquilamos tus datos personales a terceros con fines comerciales. Todas las
            transferencias se realizan bajo estrictos contratos de procesamiento de datos.
          </p>
        </Section>

        {/* Derechos ARCO */}
        <Section title="V. Derechos ARCO y Cómo Ejercerlos">
          <p>
            Como titular de datos personales, tienes los siguientes derechos establecidos en la LFPDPPP:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-4">
            {[
              { letra: "A", nombre: "Acceso", desc: "Conocer qué datos personales tenemos sobre ti, para qué los usamos y a quién los hemos compartido." },
              { letra: "R", nombre: "Rectificación", desc: "Corregir tus datos personales cuando sean inexactos, incompletos o desactualizados." },
              { letra: "C", nombre: "Cancelación", desc: "Solicitar la eliminación de tus datos personales cuando consideres que no son necesarios o pertinentes." },
              { letra: "O", nombre: "Oposición", desc: "Oponerte al tratamiento de tus datos para finalidades específicas, especialmente las secundarias." },
            ].map((d) => (
              <div key={d.letra} className="bg-surface-600 rounded-xl p-4 border border-surface-400">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-8 h-8 bg-brand-500/20 border border-brand-500/30 rounded-lg flex items-center justify-center font-black text-brand-400">
                    {d.letra}
                  </div>
                  <strong className="text-white">{d.nombre}</strong>
                </div>
                <p className="text-gray-400 text-xs leading-relaxed">{d.desc}</p>
              </div>
            ))}
          </div>

          <p><strong className="text-white">¿Cómo ejercer tus derechos?</strong></p>
          <p>
            Puedes ejercer tus derechos ARCO enviando una solicitud a <strong className="text-white">privacidad@eventure.mx</strong> con:
          </p>
          <ul className="list-disc ml-5 space-y-1">
            <li>Nombre completo y correo electrónico registrado en la plataforma.</li>
            <li>Descripción clara del derecho que deseas ejercer.</li>
            <li>Copia de documento de identidad (para verificar tu identidad).</li>
          </ul>
          <p>
            Responderemos a tu solicitud en un plazo máximo de <strong className="text-white">20 días hábiles</strong>
            a partir de su recepción, de conformidad con la LFPDPPP.
          </p>
          <p>
            Si no estás satisfecho/a con nuestra respuesta, puedes presentar una queja ante el
            <strong className="text-white"> INAI (Instituto Nacional de Transparencia, Acceso a la Información y Protección de Datos Personales)</strong>
            en inai.org.mx.
          </p>
        </Section>

        {/* Cookies */}
        <Section title="VI. Política de Cookies">
          <p>
            Eventure utiliza cookies y tecnologías similares para el funcionamiento de la plataforma.
            Las cookies son pequeños archivos de texto que se almacenan en tu dispositivo.
          </p>

          <DataTable rows={[
            { dato: "Cookies esenciales", uso: "Necesarias para el funcionamiento de la plataforma (sesión, autenticación). No pueden desactivarse.", base: "Necesidad contractual" },
            { dato: "Cookies funcionales", uso: "Recuerdan tus preferencias (idioma, vista del mapa, filtros). Mejoran tu experiencia.", base: "Consentimiento" },
            { dato: "Cookies analíticas", uso: "Nos ayudan a entender cómo usas la plataforma para mejorarla (datos anonimizados).", base: "Consentimiento" },
          ]} />

          <p>
            Puedes gestionar tus preferencias de cookies a través de la configuración de tu navegador.
            Ten en cuenta que deshabilitar cookies esenciales puede afectar el funcionamiento de la plataforma.
          </p>
        </Section>

        {/* Seguridad */}
        <Section title="VII. Seguridad de los Datos">
          <p>
            Implementamos medidas técnicas y organizativas apropiadas para proteger tus datos personales:
          </p>
          <ul className="list-disc ml-5 space-y-2">
            <li><strong className="text-white">Cifrado en tránsito:</strong> Todas las comunicaciones se realizan mediante HTTPS/TLS.</li>
            <li><strong className="text-white">Cifrado de contraseñas:</strong> Las contraseñas nunca se almacenan en texto plano, siempre se hashean.</li>
            <li><strong className="text-white">Control de acceso:</strong> Acceso a datos limitado a personal autorizado con necesidad de conocer.</li>
            <li><strong className="text-white">Auditoría:</strong> Registros de acceso y actividad para detectar accesos no autorizados.</li>
            <li><strong className="text-white">Proveedores certificados:</strong> Usamos proveedores con certificaciones de seguridad reconocidas (SOC 2, PCI DSS).</li>
          </ul>
          <p>
            En caso de una brecha de seguridad que afecte tus datos, te notificaremos en el menor
            tiempo posible conforme a los requisitos legales aplicables.
          </p>
        </Section>

        {/* Retención */}
        <Section title="VIII. Período de Conservación de los Datos">
          <DataTable rows={[
            { dato: "Datos de cuenta", uso: "Mientras la cuenta esté activa, más 3 años después de su eliminación por obligaciones legales", base: "LFPDPPP / Código Fiscal" },
            { dato: "Datos de eventos", uso: "3 años después de la realización del evento", base: "Interés legítimo / Obligación legal" },
            { dato: "Datos de transacciones", uso: "5 años por requisitos fiscales mexicanos", base: "Obligación legal" },
            { dato: "Logs de seguridad", uso: "12 meses", base: "Interés legítimo" },
          ]} />
        </Section>

        {/* Datos de menores */}
        <Section title="IX. Protección de Menores de Edad">
          <p>
            Eventure está diseñada exclusivamente para personas mayores de 18 años. <strong className="text-white">No recopilamos
            intencionalmente datos personales de menores de edad.</strong> Si tomamos conocimiento de que hemos
            recopilado datos de un menor, eliminaremos dicha información de inmediato.
          </p>
          <p>
            Si eres padre, madre o tutor legal y crees que tu hijo/a menor de edad ha proporcionado
            datos personales en Eventure, por favor contáctanos en privacidad@eventure.mx para
            solicitar su eliminación inmediata.
          </p>
        </Section>

        {/* Cambios */}
        <Section title="X. Cambios al Aviso de Privacidad">
          <p>
            Nos reservamos el derecho de modificar este Aviso de Privacidad en cualquier momento.
            Los cambios serán publicados en esta página con la fecha de actualización. En caso de
            cambios significativos que afecten tus derechos, te notificaremos por correo electrónico
            con al menos 30 días de anticipación.
          </p>
          <p>
            El uso continuado de la plataforma tras la publicación de cambios constituye tu
            aceptación del Aviso de Privacidad actualizado.
          </p>
        </Section>

        {/* Contacto DPO */}
        <Section title="XI. Contacto y Oficial de Protección de Datos">
          <p>Para cualquier asunto relacionado con este Aviso de Privacidad o el tratamiento de tus datos:</p>
          <ul className="list-disc ml-5 space-y-2">
            <li><strong className="text-white">Email de privacidad:</strong> privacidad@eventure.mx</li>
            <li><strong className="text-white">Email general:</strong> contacto@eventure.mx</li>
            <li><strong className="text-white">Autoridad supervisora:</strong> INAI — inai.org.mx</li>
          </ul>
          <p>
            Eventure designa a un Oficial de Protección de Datos (DPO) para supervisar el cumplimiento
            en materia de privacidad. Para contactar directamente al DPO: dpo@eventure.mx
          </p>
        </Section>

        <div className="pt-6 border-t border-surface-500 text-xs text-gray-600">
          <p>
            Este Aviso de Privacidad fue elaborado en cumplimiento de la Ley Federal de Protección de
            Datos Personales en Posesión de los Particulares (LFPDPPP), publicada en el Diario Oficial
            de la Federación el 5 de julio de 2010, y su Reglamento publicado el 21 de diciembre de 2011.
          </p>
        </div>
      </div>

      {/* Ver también */}
      <div className="mt-6 text-center">
        <Link href="/legal/terminos" className="text-brand-400 hover:underline text-sm">
          Ver también: Términos y Condiciones →
        </Link>
      </div>
    </div>
  );
}
