// One-off schema script for merchant-created membership packages +
// purchases (the KHS Money Trail membership ticket). Raw SQL, matching
// the same pattern used 5 times already this ticket series — sidesteps
// TypeORM's synchronize()-triggered ALTERs against the reporting-schema
// view dependencies.
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
      label: 'merchant_membership_packages table',
      sql: `
        CREATE TABLE IF NOT EXISTS "merchant_membership_packages" (
          "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          "businessId" uuid NOT NULL REFERENCES "businesses"("id") ON DELETE CASCADE,
          "serviceId" uuid NOT NULL REFERENCES "Service"("id") ON DELETE CASCADE,
          "pricePerSession" decimal(10,2) NOT NULL,
          "sessionCount" integer NOT NULL,
          "expiryDays" integer NOT NULL DEFAULT 365,
          "isActive" boolean NOT NULL DEFAULT true,
          "createdAt" timestamptz NOT NULL DEFAULT now(),
          "updatedAt" timestamptz NOT NULL DEFAULT now()
        );
      `,
    },
    {
      label: 'merchant_membership_packages indexes',
      sql: `
        CREATE INDEX IF NOT EXISTS "IDX_mmp_business" ON "merchant_membership_packages" ("businessId");
        CREATE INDEX IF NOT EXISTS "IDX_mmp_service" ON "merchant_membership_packages" ("serviceId");
      `,
    },
    {
      label: 'merchant_membership_purchase_status_enum type',
      sql: `
        DO $$ BEGIN
          CREATE TYPE "merchant_membership_purchase_status_enum" AS ENUM ('ACTIVE', 'EXPIRED', 'FULLY_REDEEMED');
        EXCEPTION WHEN duplicate_object THEN null;
        END $$;
      `,
    },
    {
      label: 'merchant_membership_purchases table',
      sql: `
        CREATE TABLE IF NOT EXISTS "merchant_membership_purchases" (
          "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          "packageId" uuid NOT NULL REFERENCES "merchant_membership_packages"("id") ON DELETE CASCADE,
          "businessId" uuid NOT NULL,
          "clientId" uuid NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
          "remainingSessions" integer NOT NULL,
          "purchasedAt" timestamptz NOT NULL,
          "expiresAt" timestamptz NOT NULL,
          "status" "merchant_membership_purchase_status_enum" NOT NULL DEFAULT 'ACTIVE',
          "createdAt" timestamptz NOT NULL DEFAULT now(),
          "updatedAt" timestamptz NOT NULL DEFAULT now()
        );
      `,
    },
    {
      label: 'merchant_membership_purchases indexes',
      sql: `
        CREATE INDEX IF NOT EXISTS "IDX_mmpu_package" ON "merchant_membership_purchases" ("packageId");
        CREATE INDEX IF NOT EXISTS "IDX_mmpu_business" ON "merchant_membership_purchases" ("businessId");
        CREATE INDEX IF NOT EXISTS "IDX_mmpu_client" ON "merchant_membership_purchases" ("clientId");
      `,
    },
    {
      label: 'merchant_membership_purchases.stripePaymentIntentId column',
      sql: `
        ALTER TABLE "merchant_membership_purchases" ADD COLUMN IF NOT EXISTS "stripePaymentIntentId" varchar(255);
        CREATE INDEX IF NOT EXISTS "IDX_mmpu_spi" ON "merchant_membership_purchases" ("stripePaymentIntentId");
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
