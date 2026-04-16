// Seed data para desarrollo — crea usuarios y eventos de ejemplo
import { PrismaClient, EventType, PrivacyType, EventStatus, AttendanceStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Usuarios de ejemplo
  const user1 = await prisma.user.upsert({
    where: { email: "alex@example.com" },
    update: {},
    create: {
      clerkId: "clerk_seed_001",
      email: "alex@example.com",
      nombre: "Alex Torres",
      fechaNacimiento: new Date("1995-03-15"),
      bio: "Organizador de eventos underground en CDMX. Amante de la música electrónica.",
      verificadoEdad: true,
      aceptoTerminos: true,
      fechaAceptacion: new Date(),
    },
  });

  const user2 = await prisma.user.upsert({
    where: { email: "sofia@example.com" },
    update: {},
    create: {
      clerkId: "clerk_seed_002",
      email: "sofia@example.com",
      nombre: "Sofía Ramírez",
      fechaNacimiento: new Date("1998-07-22"),
      bio: "Amante del arte y los eventos culturales. Fotógrafa freelance.",
      verificadoEdad: true,
      aceptoTerminos: true,
      fechaAceptacion: new Date(),
    },
  });

  // Eventos de ejemplo en CDMX
  const evento1 = await prisma.event.create({
    data: {
      creatorId: user1.id,
      nombre: "Warehouse Rave: Techno Obscuro",
      descripcion:
        "Una noche de techno industrial en las entrañas de la ciudad. DJs internacionales, instalaciones de luz y sonido de alta fidelidad. Experiencia inmersiva desde la medianoche hasta el amanecer.",
      tipo: EventType.PARTY,
      tags: ["techno", "underground", "rave", "electrónica"],
      fechaInicio: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // en 7 días
      fechaFin: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 8 * 60 * 60 * 1000),
      direccion: "Fábrica de Papel, Col. Santa María la Ribera",
      ciudad: "Ciudad de México",
      lat: 19.4396,
      lng: -99.1574,
      capacidadMaxima: 300,
      privacidad: PrivacyType.PUBLIC,
      codigoVestimenta: "Negro obligatorio",
      precio: 350,
      estado: EventStatus.ACTIVE,
    },
  });

  const evento2 = await prisma.event.create({
    data: {
      creatorId: user2.id,
      nombre: "Rooftop Jazz & Vinos",
      descripcion:
        "Tarde de jazz en vivo en la azotea del edificio más icónico de Roma Norte. Vinos naturales, quesos artesanales y la mejor vista de la ciudad al atardecer.",
      tipo: EventType.CULTURAL,
      tags: ["jazz", "rooftop", "vinos", "atardecer", "música en vivo"],
      fechaInicio: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      fechaFin: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
      direccion: "Orizaba 101, Roma Norte",
      ciudad: "Ciudad de México",
      lat: 19.4194,
      lng: -99.1587,
      capacidadMaxima: 80,
      privacidad: PrivacyType.APPROVAL,
      precio: 650,
      estado: EventStatus.ACTIVE,
    },
  });

  await prisma.event.create({
    data: {
      creatorId: user1.id,
      nombre: "Networking Tech & Startups CDMX",
      descripcion:
        "El encuentro mensual de emprendedores y desarrolladores de CDMX. Pitches de startups, charlas relámpago y networking en formato cocktail. Entra gratis.",
      tipo: EventType.NETWORKING,
      tags: ["startups", "tech", "networking", "emprendimiento"],
      fechaInicio: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      fechaFin: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000),
      direccion: "WeWork Insurgentes Sur 1338",
      ciudad: "Ciudad de México",
      lat: 19.3752,
      lng: -99.1681,
      capacidadMaxima: 150,
      privacidad: PrivacyType.PUBLIC,
      precio: null, // gratis
      estado: EventStatus.ACTIVE,
    },
  });

  // Asistencias de ejemplo
  await prisma.attendance.create({
    data: {
      userId: user2.id,
      eventId: evento1.id,
      estado: AttendanceStatus.RESERVED,
    },
  });

  await prisma.attendance.create({
    data: {
      userId: user1.id,
      eventId: evento2.id,
      estado: AttendanceStatus.PENDING,
    },
  });

  console.log("✅ Seed completado");
  console.log(`  - 2 usuarios creados`);
  console.log(`  - 3 eventos creados`);
  console.log(`  - 2 asistencias creadas`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
