// Aplica un archivo de migración SQL contra DATABASE_URL (.env.local)
const fs = require("fs");
const path = require("path");
const { Client } = require("pg");

require("dotenv").config({ path: path.join(__dirname, "..", ".env.local") });

const file = process.argv[2];
if (!file) {
  console.error("Uso: node scripts/run-migration.js <ruta-al-sql>");
  process.exit(1);
}
if (!process.env.DATABASE_URL) {
  console.error("Falta DATABASE_URL en .env.local");
  process.exit(1);
}

const sql = fs.readFileSync(file, "utf8");
const c = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

c.connect()
  .then(() => c.query(sql))
  .then(() => {
    console.log(`Migración aplicada: ${file}`);
    return c.end();
  })
  .catch((e) => {
    console.error("ERR", e.message);
    process.exit(1);
  });
