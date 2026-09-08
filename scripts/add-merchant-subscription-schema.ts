// One-off schema script for the merchant-subscription (14-day trial)
// feature. Raw SQL, matching add-core-fee-model-schema.ts's approach —
// this is a brand-new table so it carries none of that script's view-
// dependency risk, but kept as raw SQL for consistency and to sidestep
// the SYNC_ONLY_TABLES relation-metadata cascade entirely.
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
      label: 'merchant_subscriptions status enum type',
      sql: `DO $$ BEGIN
        CREATE TYPE "merchant_subscriptions_status_enum" AS ENUM ('trialing', 'active', 'past_due', 'canceled');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
    },
    {
      label: 'merchant_subscriptions table',
      sql: `CREATE TABLE IF NOT EXISTS "merchant_subscriptions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "businessId" uuid NOT NULL,
        "status" "merchant_subscriptions_status_enum" NOT NULL DEFAULT 'trialing',
        "trialEndsAt" TIMESTAMPTZ,
        "currentPeriodEnd" TIMESTAMPTZ,
        "pastDueSince" TIMESTAMPTZ,
        "stripeCustomerId" varchar,
        "stripeSubscriptionId" varchar,
        "cancelReason" varchar,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_merchant_subscriptions" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_merchant_subscriptions_businessId" UNIQUE ("businessId"),
        CONSTRAINT "UQ_merchant_subscriptions_stripeSubscriptionId" UNIQUE ("stripeSubscriptionId"),
        CONSTRAINT "FK_merchant_subscriptions_business" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE
      );`,
    },
    {
      label: 'merchant_subscriptions businessId index',
      sql: `CREATE INDEX IF NOT EXISTS "IDX_merchant_subscriptions_businessId" ON "merchant_subscriptions" ("businessId");`,
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
