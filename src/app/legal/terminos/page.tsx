// Términos y Condiciones COMPLETOS de Eventure
// Última actualización: 2024
import Link from "next/link";

export const metadata = {
  title: "Términos y Condiciones",
  description: "Términos y Condiciones de uso de la plataforma Eventure",
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="text-xl font-bold text-white mb-4 pb-2 border-b border-surface-500">{title}</h2>
      <div className="space-y-4 text-gray-300 leading-relaxed text-sm">{children}</div>
    </section>
  );
}

function Highlight({ children }: { children: React.ReactNode }) {
  return (
    <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-200 text-sm leading-relaxed my-4">
      {children}
    </div>
  );
}

export default function TerminosPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="mb-10">
        <Link href="/" className="text-brand-400 text-sm hover:underline mb-4 inline-block">
          ← Volver al inicio
        </Link>
        <h1 className="text-4xl font-black text-white mb-3">Términos y Condiciones</h1>
        <p className="text-gray-400 text-sm">
          Última actualización: 1 de enero de 2024<br/>
          Versión: 1.0
        </p>
        <Highlight>
          <strong>IMPORTANTE — LEE DETENIDAMENTE ANTES DE USAR EVENTURE.</strong><br/>
          Al acceder y usar esta plataforma, aceptas estar vinculado/a por estos Términos y Condiciones
          en su totalidad. Si no estás de acuerdo con alguna parte, debes abstenerte de usar la plataforma.
        </Highlight>
      </div>

      <div className="card p-8">

        {/* 1. Definiciones */}
        <Section title="1. Definiciones">
          <p>Para efectos de estos Términos y Condiciones, los siguientes términos tendrán el significado que se les asigna a continuación:</p>
          <ul className="list-disc ml-5 space-y-2">
            <li><strong className="text-white">"Eventure" / "la Plataforma" / "nosotros":</strong> Se refiere a Eventure, la plataforma tecnológica en línea accesible a través de eventure.mx y sus aplicaciones relacionadas, operada como intermediario tecnológico.</li>
            <li><strong className="text-white">"Usuario":</strong> Toda persona que accede a la Plataforma, ya sea como visitante, usuario registrado, organizador de eventos o asistente.</li>
            <li><strong className="text-white">"Organizador":</strong> Usuario que crea y publica un evento a través de la Plataforma.</li>
            <li><strong className="text-white">"Asistente":</strong> Usuario que se registra para asistir o asiste a un evento publicado en la Plataforma.</li>
            <li><strong className="text-white">"Evento":</strong> Cualquier actividad, reunión, espectáculo o encuentro social publicado por un Organizador en la Plataforma.</li>
            <li><strong className="text-white">"Contenido":</strong> Cualquier información, texto, imagen, video, datos o material publicado en la Plataforma por cualquier Usuario.</li>
          </ul>
        </Section>

        {/* 2. Naturaleza de la plataforma */}
        <Section title="2. Naturaleza de Eventure — Intermediario Tecnológico">
          <Highlight>
            <strong>⚠️ DECLARACIÓN FUNDAMENTAL:</strong> Eventure es ÚNICAMENTE una plataforma tecnológica intermediaria.
            NO organiza eventos, NO supervisa eventos, NO participa en eventos y NO es responsable de los eventos
            publicados en la plataforma. Eventure actúa exclusivamente como un marketplace tecnológico que permite
            a los Organizadores publicar eventos y a los Asistentes encontrarlos.
          </Highlight>

          <p>Específicamente, Eventure:</p>
          <ul className="list-disc ml-5 space-y-2">
            <li><strong className="text-white">NO organiza</strong> ninguno de los eventos listados en la plataforma.</li>
            <li><strong className="text-white">NO supervisa</strong> el desarrollo, seguridad ni cumplimiento de los eventos.</li>
            <li><strong className="text-white">NO garantiza</strong> la veracidad, exactitud, legalidad ni calidad de la información publicada por los Organizadores.</li>
            <li><strong className="text-white">NO verifica</strong> la identidad real de los Organizadores más allá del proceso de registro estándar.</li>
            <li><strong className="text-white">NO es responsable</strong> de las acciones, omisiones, conducta o comportamiento de Organizadores o Asistentes.</li>
            <li><strong className="text-white">NO es responsable</strong> de los incidentes, accidentes, daños, lesiones o muertes ocurridas durante o en el contexto de cualquier evento.</li>
            <li><strong className="text-white">NO garantiza</strong> que los eventos publicados se llevarán a cabo tal como se describen, o que se llevarán a cabo en absoluto.</li>
          </ul>

          <p>La relación principal en todo momento es entre el Organizador y los Asistentes. Eventure facilita
          el contacto entre ellos pero no es parte de esa relación contractual.</p>
        </Section>

        {/* 3. Requisito de mayoría de edad */}
        <Section title="3. Requisito de Mayoría de Edad (+18)">
          <Highlight>
            <strong>🔞 USO EXCLUSIVO PARA MAYORES DE 18 AÑOS.</strong> El acceso y uso de Eventure está
            estrictamente prohibido para personas menores de 18 años de edad.
          </Highlight>

          <p>Al registrarte en Eventure y/o al confirmar haber leído estos términos, declaras y garantizas que:</p>
          <ul className="list-disc ml-5 space-y-2">
            <li>Tienes 18 años de edad o más.</li>
            <li>Eres legalmente capaz de celebrar contratos vinculantes.</li>
            <li>La información de fecha de nacimiento que proporcionas es verdadera y precisa.</li>
          </ul>

          <p><strong className="text-white">Consecuencias de proporcionar datos falsos sobre la edad:</strong></p>
          <ul className="list-disc ml-5 space-y-2">
            <li>La cuenta será eliminada permanentemente sin previo aviso al descubrirse el fraude.</li>
            <li>Eventure se reserva el derecho de reportar el incidente a las autoridades competentes.</li>
            <li>El usuario menor que acceda usando datos falsos lo hace bajo su exclusiva responsabilidad y la de sus padres o tutores legales.</li>
            <li>Eventure queda totalmente exonerada de cualquier responsabilidad derivada del acceso no autorizado de menores.</li>
          </ul>

          <p>Los padres y tutores legales son responsables de supervisar el uso de internet por parte de sus hijos menores.</p>
        </Section>

        {/* 4. Responsabilidad del Organizador */}
        <Section title="4. Responsabilidades del Organizador">
          <Highlight>
            <strong>El Organizador es el ÚNICO responsable del evento que publica.</strong> Al publicar un evento,
            el Organizador acepta plena e irrevocablemente todas las responsabilidades derivadas de su organización,
            ejecución, seguridad y cumplimiento legal.
          </Highlight>

          <p>El Organizador declara, garantiza y se obliga a:</p>
          <ul className="list-disc ml-5 space-y-2">
            <li>Que toda la información publicada sobre el evento es <strong className="text-white">verídica, precisa y actualizada</strong>.</li>
            <li>Que el evento cumple con <strong className="text-white">todas las leyes, reglamentos y normativas aplicables</strong> en la jurisdicción donde se realiza, incluyendo permisos, licencias, cumplimiento fiscal y normas de salud y seguridad.</li>
            <li>Que cuenta con todos los <strong className="text-white">seguros necesarios</strong> para la realización del evento.</li>
            <li>Que no publicará eventos que promuevan actividades <strong className="text-white">ilegales, discriminatorias, violentas o de cualquier manera contrarias a la moral pública</strong>.</li>
            <li>Que gestionará de manera responsable los <strong className="text-white">datos personales</strong> de los Asistentes que accedan a través de su evento.</li>
            <li>Que garantizará la <strong className="text-white">seguridad</strong> de los Asistentes durante el evento en la medida de sus posibilidades.</li>
            <li>Que, en caso de cobrar por el evento, procesará los pagos de manera <strong className="text-white">transparente y legal</strong>.</li>
            <li>Que, si cancela el evento, notificará a los Asistentes con la mayor antelación posible y realizará los <strong className="text-white">reembolsos correspondientes</strong>.</li>
          </ul>
        </Section>

        {/* 5. Exoneración de responsabilidad */}
        <Section title="5. Exoneración de Responsabilidad de Eventure">
          <Highlight>
            <strong>⚠️ EXONERACIÓN TOTAL:</strong> En la máxima medida permitida por la ley aplicable,
            Eventure, sus directivos, empleados, socios, proveedores y agentes quedan expresamente exonerados
            de toda responsabilidad por cualquier daño, perjuicio, lesión o pérdida derivada del uso de la
            plataforma o de la asistencia a cualquier evento publicado en ella.
          </Highlight>

          <p>Eventure no será responsable por:</p>
          <ul className="list-disc ml-5 space-y-2">
            <li>Cualquier <strong className="text-white">accidente, lesión, enfermedad o muerte</strong> ocurrida durante un evento.</li>
            <li>Cualquier <strong className="text-white">robo, pérdida o daño a la propiedad</strong> durante un evento.</li>
            <li>La <strong className="text-white">cancelación, modificación o no realización</strong> de un evento por parte del Organizador.</li>
            <li>La <strong className="text-white">veracidad o exactitud</strong> de la información publicada por los Organizadores.</li>
            <li>El <strong className="text-white">comportamiento de los Organizadores</strong> o de los Asistentes.</li>
            <li>Cualquier <strong className="text-white">incidente de seguridad</strong> durante o relacionado con un evento.</li>
            <li>Daños <strong className="text-white">directos, indirectos, incidentales, especiales, punitivos o consecuentes</strong> derivados del uso de la plataforma.</li>
            <li>La <strong className="text-white">conducta fraudulenta</strong> de cualquier Organizador o Usuario.</li>
            <li>Fallos en las <strong className="text-white">plataformas de terceros</strong> (procesadores de pago, servicios de autenticación, etc.).</li>
          </ul>

          <p>
            El Usuario acepta que Eventure actúa únicamente como intermediario tecnológico y que asume todos
            los riesgos asociados a la participación en eventos organizados por terceros.
          </p>
        </Section>

        {/* 6. Conducta del usuario */}
        <Section title="6. Conducta del Usuario y Contenido Prohibido">
          <p>Los usuarios se comprometen a no publicar, compartir o promover a través de la plataforma:</p>
          <ul className="list-disc ml-5 space-y-2">
            <li>Eventos que impliquen <strong className="text-white">actividades ilegales</strong> de cualquier tipo.</li>
            <li>Contenido que promueva la <strong className="text-white">violencia, odio, discriminación o terrorismo</strong>.</li>
            <li>Contenido <strong className="text-white">pornográfico o sexualmente explícito</strong> no consensuado.</li>
            <li>Contenido que <strong className="text-white">infrinja derechos de autor</strong> o propiedad intelectual de terceros.</li>
            <li>Información <strong className="text-white">falsa o engañosa</strong> sobre eventos.</li>
            <li><strong className="text-white">Spam</strong> o comunicaciones comerciales no solicitadas.</li>
            <li>Cualquier contenido que <strong className="text-white">viole la ley aplicable</strong>.</li>
          </ul>
        </Section>

        {/* 7. Moderación y eliminación */}
        <Section title="7. Moderación de Contenido y Eliminación de Eventos">
          <p>Eventure se reserva el derecho, pero no la obligación, de:</p>
          <ul className="list-disc ml-5 space-y-2">
            <li><strong className="text-white">Eliminar cualquier evento</strong> que, a su sola discreción, viole estos Términos, sea inapropiado, ilegal, o que haya recibido denuncias.</li>
            <li><strong className="text-white">Suspender o eliminar cuentas</strong> de usuarios que violen estos Términos.</li>
            <li><strong className="text-white">Reportar a las autoridades</strong> cualquier actividad que pueda constituir un delito.</li>
            <li><strong className="text-white">Modificar o eliminar contenido</strong> sin previo aviso.</li>
          </ul>
          <p>
            La moderación de contenido no implica que Eventure supervise de manera continua todos los eventos
            publicados, ni que garantice que todos los eventos cumplan con estos Términos en todo momento.
          </p>
        </Section>

        {/* 8. Propiedad intelectual */}
        <Section title="8. Propiedad Intelectual">
          <p>
            La plataforma Eventure, su diseño, código, logotipos, nombre y todos los elementos propios son
            propiedad intelectual de Eventure y están protegidos por las leyes de propiedad intelectual aplicables.
          </p>
          <p>
            Al publicar contenido (fotos, descripciones, etc.) en la plataforma, el Usuario otorga a Eventure
            una licencia mundial, no exclusiva, libre de regalías y transferible para usar, reproducir, mostrar
            y distribuir dicho contenido con fines de operación de la plataforma.
          </p>
        </Section>

        {/* 9. Pagos */}
        <Section title="9. Pagos y Transacciones">
          <p>
            Los pagos de eventos de pago se procesan a través de Stripe, un proveedor de servicios de pago
            externo sujeto a sus propios términos y condiciones. Eventure no almacena datos de tarjetas de crédito.
          </p>
          <p>
            Las <strong className="text-white">políticas de reembolso</strong> son establecidas por cada Organizador.
            Eventure no es responsable de reembolsos por cancelaciones o modificaciones de eventos.
            En caso de que un Organizador no realice reembolsos a los que esté obligado, el Usuario deberá
            gestionar su reclamación directamente con el Organizador.
          </p>
          <p>
            Eventure puede cobrar <strong className="text-white">comisiones de servicio</strong> sobre las transacciones
            realizadas a través de la plataforma, las cuales serán informadas de manera clara antes de cada transacción.
          </p>
        </Section>

        {/* 10. Modificaciones */}
        <Section title="10. Modificaciones a estos Términos">
          <p>
            Eventure se reserva el derecho de modificar estos Términos en cualquier momento. Las modificaciones
            entrarán en vigor a partir de su publicación en la plataforma. El uso continuado de la plataforma
            tras la publicación de modificaciones constituye la aceptación de los nuevos términos.
          </p>
        </Section>

        {/* 11. Ley aplicable */}
        <Section title="11. Ley Aplicable y Jurisdicción">
          <p>
            Estos Términos se rigen e interpretan de conformidad con las leyes de los <strong className="text-white">Estados Unidos Mexicanos</strong>.
            Para cualquier controversia derivada de estos Términos o del uso de la plataforma, las partes
            se someten a la jurisdicción de los tribunales competentes de la Ciudad de México, renunciando
            expresamente a cualquier otro fuero que pudiere corresponderles.
          </p>
        </Section>

        {/* 12. Contacto */}
        <Section title="12. Contacto">
          <p>Para cualquier pregunta sobre estos Términos y Condiciones, puedes contactarnos en:</p>
          <ul className="list-disc ml-5 space-y-1">
            <li>Email: legal@eventure.mx</li>
            <li>Web: eventure.mx</li>
          </ul>
        </Section>

        <div className="pt-6 border-t border-surface-500 text-xs text-gray-600">
          <p>
            Al usar Eventure, confirmas haber leído, entendido y aceptado estos Términos y Condiciones en su totalidad.
            Este documento fue redactado el 1 de enero de 2024 y puede ser actualizado periódicamente.
          </p>
        </div>
      </div>

      {/* Ver también */}
      <div className="mt-6 text-center">
        <Link href="/legal/privacidad" className="text-brand-400 hover:underline text-sm">
          Ver también: Aviso de Privacidad →
        </Link>
      </div>
    </div>
  );
}
