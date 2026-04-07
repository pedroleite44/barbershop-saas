import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

async function addSubdomains() {
  try {
    console.log("Adicionando subdomains...");
    
    await sql`UPDATE tenants SET subdomain = 'blackzone' WHERE id = 1`;
    console.log("✓ Tenant 1: blackzone");
    
    await sql`UPDATE tenants SET subdomain = 'premiumcuts' WHERE id = 2`;
    console.log("✓ Tenant 2: premiumcuts");
    
    await sql`UPDATE tenants SET subdomain = 'barbershop' WHERE id = 3`;
    console.log("✓ Tenant 3: barbershop");
    
    console.log("✅ Subdomains adicionados com sucesso!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Erro:", error.message);
    process.exit(1);
  }
}

addSubdomains();
