// One-off schema script for informational staff commission tracking.
// Raw SQL, matching the established pattern this ticket series — a
// nullable rate column on staff, plus a new table of per-booking
// commission records (never moves money, no staff wallet exists).
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
      label: 'staff.commissionRate column',
      sql: `ALTER TABLE "staff" ADD COLUMN IF NOT EXISTS "commissionRate" decimal(5,2);`,
    },
    {
      label: 'staff_commission_earnings table',
      sql: `
        CREATE TABLE IF NOT EXISTS "staff_commission_earnings" (
          "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          "staffId" uuid NOT NULL REFERENCES "staff"("id") ON DELETE CASCADE,
          "businessId" uuid NOT NULL REFERENCES "businesses"("id") ON DELETE CASCADE,
          "orderId" varchar(100) NOT NULL,
          "netAmount" decimal(12,2) NOT NULL,
          "commissionRate" decimal(5,2) NOT NULL,
          "commissionAmount" decimal(12,2) NOT NULL,
          "createdAt" timestamptz NOT NULL DEFAULT now()
        );
      `,
    },
    {
      label: 'staff_commission_earnings indexes',
      sql: `
        CREATE INDEX IF NOT EXISTS "IDX_sce_staff" ON "staff_commission_earnings" ("staffId");
        CREATE INDEX IF NOT EXISTS "IDX_sce_business" ON "staff_commission_earnings" ("businessId");
        CREATE INDEX IF NOT EXISTS "IDX_sce_order" ON "staff_commission_earnings" ("orderId");
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
