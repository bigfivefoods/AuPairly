import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";

const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!url) throw new Error("No DATABASE_URL");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });

const rows = await prisma.$queryRawUnsafe(`
  SELECT c.relname AS table_name, c.relrowsecurity AS rls_on, c.relforcerowsecurity AS force_rls
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relkind = 'r'
    AND c.relname IN ('User','Message','AuPairProfile','PaymentTransaction','CityWaitlist','Conversation')
  ORDER BY 1
`);
console.log(JSON.stringify(rows, null, 2));

const pol = await prisma.$queryRawUnsafe(
  `SELECT count(*)::int AS public_policies FROM pg_policies WHERE schemaname = 'public'`
);
console.log("public policies", pol);

const n = await prisma.user.count();
console.log("prisma user.count OK:", n);

await prisma.$disconnect();
