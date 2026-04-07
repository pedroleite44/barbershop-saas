# BarberSaaS - Sistema de Agendamento para Barbearias

Um sistema SaaS completo de agendamento para barbearias com suporte a múltiplos barbeiros, dashboards personalizados e integração com WhatsApp.

## 🎯 Características

- ✅ **Agendamento Online** - Clientes podem agendar sem login
- ✅ **Autenticação JWT** - Login seguro para barbeiros e admin
- ✅ **Dashboard do Barbeiro** - Visualizar agendamentos do dia
- ✅ **Dashboard Admin** - Controle total do sistema
- ✅ **Integração WhatsApp** - Confirmações automáticas via Twilio
- ✅ **Design Profissional** - Tema Red + Black (Black Zone)
- ✅ **API RESTful** - Endpoints bem estruturados

## 🚀 Quick Start

### 1. Instalar Dependências

```bash
npm install
```

### 2. Configurar Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# Database (Neon PostgreSQL)
DATABASE_URL=postgresql://neondb_owner:npg_7wf2zvycPOLu@ep-fancy-union-ant4i16j-pooler.c-6.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require

# JWT Secret
JWT_SECRET=seu-secret-key-aqui

# Twilio (Opcional - para WhatsApp)
TWILIO_ACCOUNT_SID=seu-account-sid
TWILIO_AUTH_TOKEN=seu-auth-token
TWILIO_WHATSAPP_FROM=whatsapp:+5511999999999
```

### 3. Executar em Desenvolvimento

```bash
npm run dev
```

A aplicação estará disponível em `http://localhost:3000`

### 4. Build para Produção

```bash
npm run build
npm start
```

## 📋 Credenciais de Teste

Após executar o script de seed do banco de dados:

| Tipo | Email | Senha |
|------|-------|-------|
| Admin | admin@blackzone.com | admin123 |
| Barbeiro 1 | carioca@blackzone.com | barber123 |
| Barbeiro 2 | charles@blackzone.com | barber123 |

## 🏗️ Estrutura do Projeto

```
barbershop-saas/
├── app/
│   ├── page.js                          # Landing page
│   ├── login/page.js                    # Página de login
│   ├── agendamento/page.js              # Página de agendamento (público)
│   ├── dashboard/
│   │   ├── barbeiro/page.js             # Dashboard do barbeiro
│   │   └── admin/page.js                # Dashboard admin
│   └── api/
│       ├── auth/login/route.js          # API de login
│       ├── appointments/route.js        # API de agendamentos
│       └── notifications/whatsapp/route.js # API WhatsApp
├── middleware.js                        # Proteção de rotas
├── package.json
├── next.config.js
└── README.md
```

## 🔌 API Endpoints

### Autenticação

**POST** `/api/auth/login`
```json
{
  "email": "admin@blackzone.com",
  "password": "admin123"
}
```

Resposta:
```json
{
  "token": "jwt-token-aqui",
  "user": {
    "id": 1,
    "name": "Admin",
    "email": "admin@blackzone.com",
    "role": "admin"
  }
}
```

### Agendamentos

**GET** `/api/appointments`
- Lista todos os agendamentos
- Query params: `?barber_id=1` (filtrar por barbeiro)

**POST** `/api/appointments`
```json
{
  "barber_id": 1,
  "date": "2026-03-28",
  "time": "10:00",
  "phone": "(11) 99999-9999"
}
```

**DELETE** `/api/appointments?id=1`
- Remover agendamento

### Notificações WhatsApp

**POST** `/api/notifications/whatsapp`
```json
{
  "phone": "(11) 99999-9999",
  "message": "Seu agendamento foi confirmado!"
}
```

## 🔐 Autenticação

O sistema usa JWT (JSON Web Tokens) armazenados em `localStorage`:

```javascript
// Login
const res = await fetch("/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password })
});

const { token } = await res.json();
localStorage.setItem("auth_token", token);

// Usar em requisições
const res = await fetch("/api/appointments", {
  headers: {
    "Authorization": `Bearer ${localStorage.getItem("auth_token")}`
  }
});
```

## 📱 Integração WhatsApp (Twilio)

### Configurar Twilio

1. Criar conta em https://www.twilio.com
2. Obter credenciais:
   - `TWILIO_ACCOUNT_SID`
   - `TWILIO_AUTH_TOKEN`
   - Número WhatsApp: `TWILIO_WHATSAPP_FROM`

3. Adicionar ao `.env`

### Enviar Mensagem

```javascript
const res = await fetch("/api/notifications/whatsapp", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    phone: "(11) 99999-9999",
    message: "Seu agendamento foi confirmado para amanhã às 10:00"
  })
});
```

## 🗄️ Schema do Banco de Dados

### Tabela: users
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  role VARCHAR(20) DEFAULT 'barber', -- admin, barber, client
  tenant_id INTEGER,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Tabela: appointments
```sql
CREATE TABLE appointments (
  id SERIAL PRIMARY KEY,
  barber_id INTEGER NOT NULL,
  date DATE NOT NULL,
  time TIME NOT NULL,
  phone VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 🎨 Tema e Cores

- **Cor Primária:** #E50914 (Vermelho)
- **Cor Secundária:** #000000 (Preto)
- **Background:** #0A0A0A (Preto muito escuro)
- **Texto:** #FFFFFF (Branco)

## 🐛 Troubleshooting

### Erro: "Erro ao conectar ao servidor"
- Verificar se o banco de dados está acessível
- Verificar `DATABASE_URL` no `.env`
- Verificar se as tabelas existem no banco

### Erro: "Usuário não encontrado"
- Executar script de seed: `node seed-users.js`
- Verificar credenciais de teste

### WhatsApp não funciona
- Verificar se credenciais Twilio estão no `.env`
- Verificar se o número está no formato correto
- Consultar logs do Twilio

## 📚 Documentação Adicional

- [Next.js Documentation](https://nextjs.org/docs)
- [Neon PostgreSQL](https://neon.tech)
- [Twilio WhatsApp API](https://www.twilio.com/docs/whatsapp)

## 📝 License

MIT

## 👨‍💻 Suporte

Para dúvidas ou problemas, abra uma issue no repositório.

---

**Desenvolvido com ❤️ para barbearias modernas**
