-- Adicionar coluna subdomain na tabela tenants
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS subdomain VARCHAR(255) UNIQUE;

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_tenants_subdomain ON tenants(subdomain);

-- Adicionar coluna name na tabela tenants (se não existir)
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS name VARCHAR(255);

-- Exemplo de dados (DESCOMENTE PARA TESTAR):
-- INSERT INTO tenants (name, subdomain) VALUES ('Black Zone', 'blackzone');
-- INSERT INTO tenants (name, subdomain) VALUES ('Premium Cuts', 'premiumcuts');
-- INSERT INTO tenants (name, subdomain) VALUES ('Barber Shop', 'barbershop');
