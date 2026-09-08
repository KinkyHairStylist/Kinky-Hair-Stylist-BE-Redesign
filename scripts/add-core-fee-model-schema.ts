// One-off schema script for the core-fee-model + merchant-subscription work.
// Hand-written raw SQL (not TypeORM synchronize) because `businesses` and
// `transactions` have dependent views in a separate `reporting` schema —
// synchronize() diffs and can attempt to ALTER unrelated existing columns,
// which Postgres refuses when a view depends on them. Raw ADD COLUMN/CREATE
// TABLE only ever touches exactly what's listed below.
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
      label: 'businesses.planTier enum type',
      sql: `DO $$ BEGIN
        CREATE TYPE "businesses_plantier_enum" AS ENUM ('Starter', 'Growth', 'Pro');
      EXCEPTION WHEN duplicate_object THEN NULL; END $$;`,
    },
    {
      label: 'businesses.planTier column',
      sql: `ALTER TABLE "businesses" ADD COLUMN IF NOT EXISTS "planTier" "businesses_plantier_enum" NOT NULL DEFAULT 'Starter';`,
    },
    {
      label: 'transactions.feeSubtype column',
      sql: `ALTER TABLE "transactions" ADD COLUMN IF NOT EXISTS "feeSubtype" varchar(30);`,
    },
    {
      label: 'stripe_payment_intents new fee columns',
      sql: `ALTER TABLE "stripe_payment_intents"
        ADD COLUMN IF NOT EXISTS "acquisitionFeeAmount" numeric(12,2) NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "commissionFeeAmount" numeric(12,2) NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS "stripePassthroughFeeAmount" numeric(12,2) NOT NULL DEFAULT 0;`,
    },
    {
      label: 'business_client_acquisitions table',
      sql: `CREATE TABLE IF NOT EXISTS "business_client_acquisitions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "businessId" uuid NOT NULL,
        "clientId" uuid,
        "orderId" varchar,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_business_client_acquisitions" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_business_client_acquisitions_business_client" UNIQUE ("businessId", "clientId"),
        CONSTRAINT "FK_bca_business" FOREIGN KEY ("businessId") REFERENCES "businesses"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_bca_client" FOREIGN KEY ("clientId") REFERENCES "user"("id") ON DELETE SET NULL
      );`,
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
