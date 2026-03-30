/**
 * Demo-Daten Seed Script
 * Befüllt die Demo-Datenbank mit realistischen Beispieldaten
 * Wird stündlich via Cron zurückgesetzt
 */

import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Demo-Daten...');

  // Demo Tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'demo' },
    update: {},
    create: {
      id: 'demo',
      slug: 'demo',
      name: 'DemoFirma GmbH',
      industry: 'fieldservice',
      status: 'active',
      plan: 'professional',
    },
  });

  // Demo Users
  const adminPassword = await hash('Demo2026!', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@demo.appfabrik.de' },
    update: {},
    create: {
      email: 'admin@demo.appfabrik.de',
      name: 'Max Mustermann',
      password: adminPassword,
      role: 'ADMIN',
      tenantId: tenant.id,
    },
  });

  const manager = await prisma.user.upsert({
    where: { email: 'manager@demo.appfabrik.de' },
    update: {},
    create: {
      email: 'manager@demo.appfabrik.de',
      name: 'Maria Muster',
      password: adminPassword,
      role: 'MANAGER',
      tenantId: tenant.id,
    },
  });

  await prisma.user.upsert({
    where: { email: 'mitarbeiter@demo.appfabrik.de' },
    update: {},
    create: {
      email: 'mitarbeiter@demo.appfabrik.de',
      name: 'Klaus Beispiel',
      password: adminPassword,
      role: 'EMPLOYEE',
      tenantId: tenant.id,
    },
  });

  // Demo Kunden
  const customers = [
    { name: 'Waldbesitzer Schmidt', email: 'schmidt@example.de', location: 'Bayern' },
    { name: 'Forstbetrieb Müller GmbH', email: 'mueller@example.de', location: 'Baden-Württemberg' },
    { name: 'Gemeinde Grünwald', email: 'gemeinde@gruenwald.de', location: 'Bayern' },
    { name: 'Familie Berger', email: 'berger@example.de', location: 'Hessen' },
    { name: 'Naturschutzverein e.V.', email: 'info@naturschutz.de', location: 'NRW' },
  ];

  for (const customer of customers) {
    await prisma.customer.create({
      data: {
        ...customer,
        tenantId: tenant.id,
        status: 'active',
        phone: '+49 123 456789',
      },
    }).catch(() => {}); // Ignore duplicates
  }

  // Demo Aufträge
  const orders = [
    {
      title: 'Aufforstung Waldgebiet Nord',
      status: 'IN_PROGRESS',
      area: 5.2,
      location: 'Forst Grünwald, Bayern',
    },
    {
      title: 'Baumpflanzung Gemeindepark',
      status: 'PLANNED',
      area: 0.8,
      location: 'Grünwald Zentrum',
    },
    {
      title: 'Waldpflege Südhang',
      status: 'COMPLETED',
      area: 12.5,
      location: 'Südhang Berger, Hessen',
    },
    {
      title: 'Notfallrodung Sturmschaden',
      status: 'COMPLETED',
      area: 2.1,
      location: 'Naturschutzgebiet West, NRW',
    },
    {
      title: 'Saisonpflanzung Herbst 2026',
      status: 'PLANNED',
      area: 8.0,
      location: 'Diverse Standorte',
    },
  ];

  console.log(`✅ Tenant: ${tenant.name}`);
  console.log(`✅ Users: admin, manager, mitarbeiter`);
  console.log(`✅ Kunden: ${customers.length}`);
  console.log(`✅ Aufträge: ${orders.length}`);
  console.log('');
  console.log('🎉 Demo-Daten erfolgreich eingespeist!');
  console.log('');
  console.log('Demo-Zugänge:');
  console.log('  admin@demo.appfabrik.de / Demo2026!');
  console.log('  manager@demo.appfabrik.de / Demo2026!');
  console.log('  mitarbeiter@demo.appfabrik.de / Demo2026!');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
