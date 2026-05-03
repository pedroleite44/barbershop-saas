import { neon } from "@neondatabase/serverless";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL não configurada no arquivo .env");
}

const sql = neon(process.env.DATABASE_URL);

let initialized = false;

export async function initDatabase() {
  if (initialized) return;
  initialized = true;

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS tenant_settings (
        id SERIAL PRIMARY KEY,
        tenant_id INT NOT NULL UNIQUE,
        name VARCHAR(255),
        phone VARCHAR(20),
        address VARCHAR(255),
        city VARCHAR(100),
        state VARCHAR(10),
        zip_code VARCHAR(20),
        opening_time VARCHAR(5) DEFAULT '09:00',
        closing_time VARCHAR(5) DEFAULT '19:00',
        appointment_interval INT DEFAULT 30,
        description TEXT,
        primary_color VARCHAR(20) DEFAULT '#E50914',
        secondary_color VARCHAR(20) DEFAULT '#000000',
        accent_color VARCHAR(20) DEFAULT '#FFFFFF',
        logo_url TEXT,
        banner_url TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS appointment_settings (
        id SERIAL PRIMARY KEY,
        tenant_id INT NOT NULL UNIQUE,
        interval_minutes INT DEFAULT 30,
        start_time VARCHAR(5) DEFAULT '09:00',
        end_time VARCHAR(5) DEFAULT '19:00',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS tenant_gallery (
        id SERIAL PRIMARY KEY,
        tenant_id INT NOT NULL,
        image_url TEXT NOT NULL,
        title VARCHAR(255),
        order_index INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS services (
        id SERIAL PRIMARY KEY,
        tenant_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        price NUMERIC(10,2) DEFAULT 0,
        duration INT DEFAULT 30,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS barbers (
        id SERIAL PRIMARY KEY,
        tenant_id INT NOT NULL,
        user_id INT UNIQUE,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        specialty VARCHAR(255),
        commission_percentage NUMERIC(5,2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    await sql`
      CREATE TABLE IF NOT EXISTS appointments (
        id SERIAL PRIMARY KEY,
        tenant_id INT NOT NULL,
        barber_id INT,
        date DATE NOT NULL,
        time TIME NOT NULL,
        phone VARCHAR(20) NOT NULL,
        client_name VARCHAR(255),
        status VARCHAR(50) DEFAULT 'confirmed',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `;

    await sql`ALTER TABLE appointments ADD COLUMN IF NOT EXISTS client_name VARCHAR(255)`;
    await sql`ALTER TABLE appointments ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'confirmed'`;
    await sql`ALTER TABLE appointments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW()`;
    await sql`ALTER TABLE appointments ADD COLUMN IF NOT EXISTS service_ids TEXT`;
    await sql`ALTER TABLE appointments ADD COLUMN IF NOT EXISTS service_names TEXT`;
    await sql`ALTER TABLE appointments ADD COLUMN IF NOT EXISTS total_price NUMERIC(10,2) DEFAULT 0`;

    await sql`CREATE INDEX IF NOT EXISTS idx_appointments_tenant_date ON appointments(tenant_id, date)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_appointments_tenant_date_time ON appointments(tenant_id, date, time)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_barbers_tenant ON barbers(tenant_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_services_tenant ON services(tenant_id)`;

    try {
      await sql`
        INSERT INTO barbers (tenant_id, user_id, name, phone, created_at, updated_at)
        SELECT u.tenant_id, u.id, u.name, u.phone, NOW(), NOW()
        FROM users u
        WHERE u.role = 'barber'
        ON CONFLICT (user_id) DO UPDATE
        SET
          name = EXCLUDED.name,
          phone = EXCLUDED.phone,
          updated_at = NOW()
      `;
    } catch (error) {
      console.log("Sincronização users -> barbers ignorada:", error.message);
    }

    try {
      const tenants = await sql`SELECT id, name, phone, city, state FROM tenants`;

      for (const tenant of tenants) {
        await sql`
          INSERT INTO tenant_settings (
            tenant_id, name, phone, city, state, opening_time, closing_time, appointment_interval,
            primary_color, secondary_color, accent_color, description, created_at, updated_at
          )
          VALUES (
            ${tenant.id},
            ${tenant.name},
            ${tenant.phone || null},
            ${tenant.city || null},
            ${tenant.state || null},
            '09:00',
            '19:00',
            30,
            '#E50914',
            '#000000',
            '#FFFFFF',
            'Barbearia profissional',
            NOW(),
            NOW()
          )
          ON CONFLICT (tenant_id) DO NOTHING
        `;

        await sql`
          INSERT INTO appointment_settings (
            tenant_id, interval_minutes, start_time, end_time, created_at, updated_at
          )
          VALUES (${tenant.id}, 30, '09:00', '19:00', NOW(), NOW())
          ON CONFLICT (tenant_id) DO NOTHING
        `;
      }
    } catch (error) {
      console.log("Seed de tenant_settings ignorado:", error.message);
    }

    console.log("✅ Banco padronizado com sucesso");
  } catch (error) {
    initialized = false;
    console.error("❌ Erro ao inicializar banco:", error);
    throw error;
  }
}

export { sql };