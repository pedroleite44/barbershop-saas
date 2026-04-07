# 🔴 Análise Detalhada de Erros - BarberSaaS

**Data da Análise:** 6 de Abril de 2026  
**Status:** 🚨 **CRÍTICO - MÚLTIPLOS ERROS IDENTIFICADOS**

---

## 📋 Resumo Executivo

O projeto `barbershop-saas` possui **7 erros críticos** que impedem o funcionamento correto da aplicação. Estes erros afetam desde a lógica de agendamento até a autenticação e acesso a dados.

---

## 🔴 ERRO #1: Inconsistência no Schema do Banco de Dados

### Localização
- **Arquivo:** `/app/api/appointments/me/route.js`
- **Linhas:** 19-20

### Problema
O arquivo tenta acessar colunas que **não existem** na tabela `appointments`:

```javascript
// ❌ ERRADO - Colunas não existem
AND user_id = ${userId}
ORDER BY appointment_date DESC
```

### Schema Real (em `lib/db.js`)
```sql
CREATE TABLE appointments (
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
```

### Impacto
- ❌ Dashboard do barbeiro **não funciona**
- ❌ Página inicial não consegue listar agendamentos
- ❌ Erro 500 ao tentar acessar `/api/appointments/me`

### Solução
Corrigir a query para usar as colunas corretas:

```javascript
// ✅ CORRETO
const appointments = await sql`
  SELECT * FROM appointments 
  WHERE tenant_id = ${parseInt(tenantId)} 
  AND barber_id = ${parseInt(userId)}
  ORDER BY date DESC, time DESC
`;
```

---

## 🔴 ERRO #2: Lógica de Disponibilidade Ignora Barbeiro

### Localização
- **Arquivo:** `/app/api/public/available-times/route.js`
- **Linhas:** 65-72

### Problema
O endpoint recebe `barber_id` como parâmetro, mas **não o utiliza** na query:

```javascript
// ❌ ERRADO - Ignora barber_id
const appointments = await sql`
  SELECT LEFT(CAST(time AS text), 5) AS time
  FROM appointments
  WHERE tenant_id = ${tenantId}
    AND date = ${date}
    AND status = 'confirmed'
  ORDER BY time ASC
`;
```

### Impacto
- ❌ Se um barbeiro agenda um horário, **fica bloqueado para todos os outros**
- ❌ Impossível ter múltiplos agendamentos no mesmo horário
- ❌ Reduz drasticamente a capacidade da barbearia

### Cenário de Falha
1. Barbeiro A agenda 10:00
2. Barbeiro B tenta agendar 10:00 → **BLOQUEADO** (deveria estar disponível)

### Solução
Incluir `barber_id` na query:

```javascript
// ✅ CORRETO
const barberId = Number(searchParams.get("barber_id") || null);

const appointments = await sql`
  SELECT LEFT(CAST(time AS text), 5) AS time
  FROM appointments
  WHERE tenant_id = ${tenantId}
    AND date = ${date}
    AND barber_id = ${barberId}
    AND status = 'confirmed'
  ORDER BY time ASC
`;
```

---

## 🔴 ERRO #3: Falta de Inicialização do Banco em `/api/appointments/me`

### Localização
- **Arquivo:** `/app/api/appointments/me/route.js`
- **Linhas:** 1-3

### Problema
O arquivo importa `sql` diretamente sem chamar `initDatabase()`:

```javascript
// ❌ ERRADO - Sem inicialização
import { sql } from '../../../../lib/db';

export async function GET(req) {
  // ... direto para query sem initDatabase()
  const appointments = await sql`...`;
}
```

### Impacto
- ⚠️ Tabelas podem não existir se for primeira execução
- ⚠️ Inconsistência com outras rotas que chamam `initDatabase()`
- ⚠️ Possíveis erros aleatórios

### Solução
Adicionar inicialização:

```javascript
// ✅ CORRETO
import { initDatabase, sql } from '../../../../lib/db.js';

export async function GET(req) {
  try {
    await initDatabase();
    // ... resto do código
  }
}
```

---

## 🔴 ERRO #4: Estrutura de Diretórios Inválida

### Localização
- **Caminho:** `/app/[subdomain` e `/app/[subdomain]/]`

### Problema
O Next.js espera nomes de rotas dinâmicas com colchetes **fechados**:
- ❌ `[subdomain` (incompleto)
- ❌ `/app/[subdomain]/]` (pasta com nome `]`)
- ✅ Deveria ser: `[subdomain]`

### Impacto
- ❌ Rotas dinâmicas não funcionam
- ❌ Next.js não reconhece como rota parametrizada
- ❌ Impossível acessar subdomínios

### Solução
Renomear estrutura corretamente (já realizado):
```
/app/[subdomain]  ✅ Correto
```

---

## 🔴 ERRO #5: Hardcoding de `tenant_id = 1`

### Localização
Múltiplos arquivos:
- `/app/agendamento/agendar/page.js` (linha 22)
- `/app/page.js` (hardcoded)
- `/app/api/public/available-times/route.js` (linha 34)
- `/app/api/public/book-appointment/route.js` (linha 9)

### Problema
```javascript
// ❌ ERRADO - Tenant fixo
const tenantId = 1;
const tenantId = Number(searchParams.get("tenant_id") || 1);
```

### Impacto
- ❌ Sistema não é multi-tenant
- ❌ Todas as barbearias usam os mesmos dados
- ❌ Impossível ter múltiplas instâncias

### Solução
Implementar resolução dinâmica de tenant:

```javascript
// ✅ CORRETO - Detectar do subdomínio
const subdomain = window.location.hostname.split('.')[0];
const tenantId = await resolveTenantFromSubdomain(subdomain);
```

---

## 🔴 ERRO #6: Falta de Validação em `/api/appointments/me`

### Localização
- **Arquivo:** `/app/api/appointments/me/route.js`
- **Linhas:** 3-14

### Problema
Não há validação de autenticação:

```javascript
// ❌ ERRADO - Sem autenticação
export async function GET(req) {
  const userId = searchParams.get('user_id');
  // Qualquer um pode passar user_id e ver agendamentos
}
```

### Impacto
- 🔓 **Vulnerabilidade de segurança**
- ❌ Qualquer pessoa pode ver agendamentos de qualquer usuário
- ❌ Sem proteção de dados

### Solução
Adicionar autenticação JWT:

```javascript
// ✅ CORRETO
import { requireAuth } from '../../../../lib/auth.js';

export async function GET(req) {
  const { auth, error } = requireAuth(req, ["admin", "barber"]);
  if (error) return error;
  
  // Usar auth.id em vez de user_id do query param
  const appointments = await sql`
    SELECT * FROM appointments 
    WHERE tenant_id = ${auth.tenant_id}
    AND barber_id = ${auth.id}
    ORDER BY date DESC
  `;
}
```

---

## 🔴 ERRO #7: Inconsistência de Formato de Resposta da API

### Localização
Múltiplos arquivos:
- `/app/api/public/book-appointment/route.js` → Retorna array
- `/app/api/public/barbers/route.js` → Retorna array
- `/app/api/appointments/route.js` → Retorna array
- `/app/api/appointments/me/route.js` → Retorna `{ success, data }`
- `/app/dashboard/admin/page.js` → Espera `{ data: [...] }`

### Problema
Inconsistência no formato de resposta:

```javascript
// ❌ Alguns retornam array direto
return Response.json(result);

// ❌ Outros retornam { success, data }
return Response.json({ success: true, data: appointments });

// ❌ Frontend espera { data: [...] }
setAppointments(data.data || []);
```

### Impacto
- ❌ Frontend quebra em alguns endpoints
- ❌ Difícil de manter e debugar
- ❌ Inconsistência na API

### Solução
Padronizar em um único formato:

```javascript
// ✅ CORRETO - Padrão consistente
return Response.json({ 
  success: true, 
  data: appointments 
});
```

---

## 📊 Tabela de Severidade

| Erro | Severidade | Impacto | Status |
|------|-----------|--------|--------|
| #1 - Schema DB | 🔴 CRÍTICO | Dashboard não funciona | Não corrigido |
| #2 - Disponibilidade | 🔴 CRÍTICO | Bloqueio de horários | Não corrigido |
| #3 - Inicialização DB | 🟡 ALTO | Erros aleatórios | Não corrigido |
| #4 - Estrutura Dirs | 🟡 ALTO | Rotas dinâmicas quebradas | ✅ Corrigido |
| #5 - Hardcoding Tenant | 🟡 ALTO | Não é multi-tenant | Não corrigido |
| #6 - Falta Auth | 🔴 CRÍTICO | Vulnerabilidade | Não corrigido |
| #7 - Formato API | 🟡 ALTO | Frontend quebra | Não corrigido |

---

## ✅ Próximas Ações

1. **Corrigir `/api/appointments/me/route.js`** - Schema e autenticação
2. **Corrigir `/api/public/available-times/route.js`** - Incluir barber_id
3. **Adicionar `initDatabase()` em todas as rotas**
4. **Padronizar formato de respostas da API**
5. **Implementar resolução dinâmica de tenant**
6. **Adicionar autenticação em endpoints sensíveis**
7. **Testar fluxo completo de agendamento**

---

## 🎯 Conclusão

O projeto tem uma **arquitetura sólida**, mas apresenta **erros de implementação críticos** que impedem o funcionamento. A maioria dos erros são **fáceis de corrigir** e envolvem:

- Alinhamento de schema com queries
- Inclusão de parâmetros faltantes
- Padronização de formatos
- Adição de autenticação

**Tempo estimado de correção:** 2-3 horas

---

*Análise realizada em 06/04/2026*
