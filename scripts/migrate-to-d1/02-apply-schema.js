// Aplica schema.sql a D1 tabla por tabla via la D1 HTTP API directa (evita
// el import masivo de wrangler, que trae errores de offset poco claros en
// archivos grandes). Imprime exactamente que statement falla si falla.
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", "..", ".env.local") });

const ACCOUNT_ID = "01726e42f34f41acd4f08b8438188d58";
const DATABASE_ID = "ac2ddd0b-ebb4-414b-a0bf-00c2d99d2aaa";

async function getToken() {
  const configPath = path.join(
    process.env.APPDATA || "",
    "xdg.config",
    "cloudflare",
    "config",
    "default.json"
  );
  const config = JSON.parse(fs.readFileSync(configPath, "utf8"));
  return config.token || config.access_token || config.oauth_token;
}

async function main() {
  const sql = fs.readFileSync(path.join(__dirname, "out", "schema.sql"), "utf8");
  const statements = sql
    .split(/;\s*\n/)
    .map((s) => s.trim())
    .filter((s) => s && !s.startsWith("--") && s.toLowerCase() !== "pragma foreign_keys = off");

  const token = await getToken();

  for (const [i, stmt] of statements.entries()) {
    const resp = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/d1/database/${DATABASE_ID}/query`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ sql: stmt + ";" }),
      }
    );
    const data = await resp.json();
    if (!data.success) {
      console.error(`FALLO statement #${i}:\n${stmt}\n`);
      console.error(JSON.stringify(data.errors, null, 2));
      process.exit(1);
    }
    process.stdout.write(`.`);
  }
  console.log(`\n${statements.length} statements aplicados OK.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
