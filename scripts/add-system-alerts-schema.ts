// One-off schema script for the platform-wide "system alerts" feature
// (the previously-dead "Create Alert" button on the admin dashboard).
// Raw SQL, matching the established pattern this ticket series.
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
dotenv.config();

const isExecute = process.argv.includes('--execute');

async function run() {
  const ds = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    ssl: { rejectUnauthorized: false },
  });
  await ds.initialize();
  console.log(`Connected to ${process.env.DB_DATABASE}. Mode: ${isExecute ? 'EXECUTE' : 'DRY RUN (pass --execute to apply)'}\n`);

  const statements: { label: string; sql: string }[] = [
    {
      label: 'system_alert_severity_enum',
      sql: `DO $$ BEGIN
        CREATE TYPE "system_alert_severity_enum" AS ENUM ('info', 'warning', 'critical');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
    },
    {
      label: 'system_alert_audience_enum',
      sql: `DO $$ BEGIN
        CREATE TYPE "system_alert_audience_enum" AS ENUM ('merchant', 'customer', 'all');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
    },
    {
      label: 'system_alerts table',
      sql: `
        CREATE TABLE IF NOT EXISTS "system_alerts" (
          "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          "title" varchar(200) NOT NULL,
          "message" text NOT NULL,
          "severity" "system_alert_severity_enum" NOT NULL DEFAULT 'info',
          "audience" "system_alert_audience_enum" NOT NULL DEFAULT 'all',
          "isActive" boolean NOT NULL DEFAULT true,
          "createdBy" uuid,
          "expiresAt" timestamptz,
          "createdAt" timestamptz NOT NULL DEFAULT now(),
          "updatedAt" timestamptz NOT NULL DEFAULT now()
        );
      `,
    },
    {
      label: 'system_alerts indexes',
      sql: `
        CREATE INDEX IF NOT EXISTS "IDX_system_alerts_active" ON "system_alerts" ("isActive");
        CREATE INDEX IF NOT EXISTS "IDX_system_alerts_audience" ON "system_alerts" ("audience");
      `,
    },
  ];

  for (const { label, sql } of statements) {
    console.log(`--- ${label} ---`);
    console.log(sql.trim());
    if (isExecute) {
      await ds.query(sql);
      console.log('APPLIED\n');
    } else {
      console.log('(dry run, not applied)\n');
    }
  }

  await ds.destroy();
}

run().catch((err) => {
  console.error('Schema script failed:', err);
  process.exit(1);
});
