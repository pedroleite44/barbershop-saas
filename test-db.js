import { neon } from "@neondatabase/serverless";

const sql = neon("postgresql://neondb_owner:npg_7wf2zvycPOLu@ep-fancy-union-ant4i16j-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require");

try {
  const result = await sql`SELECT NOW()`;
  console.log("â Conectado com sucesso");
  console.log(result);
} catch (error) {
  console.error("â Erro:", error);
}
