// db-setup.mjs — applies db/schema.sql then db/seed.sql to the Neon database,
// then prints the rows so we can see what exists.
import { readFile } from "node:fs/promises";
import { neon } from "@neondatabase/serverless";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error("DATABASE_URL is missing. Is .env.local present?");
  process.exit(1);
}

const sql = neon(connectionString);

async function apply(label, text) {
  // Each file is a list of statements ending in ";\n" — split them and run one by one.
  const statements = text
    .split(/;\s*\n/)
    .map((s) => s.trim())
    .filter(Boolean);
  for (const statement of statements) {
    await sql.query(statement);
  }
  console.log(`${label}: ${statements.length} statement(s) applied`);
}

await apply("schema", await readFile(new URL("../db/schema.sql", import.meta.url), "utf8"));
await apply("seed", await readFile(new URL("../db/seed.sql", import.meta.url), "utf8"));

const restaurants = await sql.query("SELECT * FROM restaurants ORDER BY id");
console.log("\nRestaurants table:");
console.table(restaurants);

const reviews = await sql.query(
  "SELECT id, restaurant_id, rating, comment, created_at FROM reviews ORDER BY created_at"
);
console.log("\nReviews table (oldest first):");
console.table(reviews);

console.log("\nDone. The database now has its facts.");