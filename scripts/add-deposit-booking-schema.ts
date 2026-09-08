// One-off schema script for the deposit-only booking feature. Raw SQL,
// matching add-core-fee-model-schema.ts / add-merchant-subscription-
// schema.ts — a single additive, nullable-safe column, so it sidesteps
// TypeORM's SYNC_ONLY_TABLES relation-metadata cascade and the
// reporting-schema view-dependency risk entirely.
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
      label: 'stripe_payment_intents.isDeposit column',
      sql: `ALTER TABLE "stripe_payment_intents" ADD COLUMN IF NOT EXISTS "isDeposit" boolean NOT NULL DEFAULT false;`,
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
