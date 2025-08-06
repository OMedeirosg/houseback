# 💰 API Financeira

API REST em **Express + TypeScript + PostgreSQL** para gerenciamento financeiro pessoal.

## 🚀 Como rodar o projeto

### 1. Pré-requisitos

- [Node.js](https://nodejs.org/) (versão 18+)
- [PostgreSQL](https://www.postgresql.org/)
- Git

### 2. Instalação

```bash
# Clone o repositório
git clone [seu-repo-url]
cd houseback

# Instale as dependências
npm install
```

### 3. Configuração do Banco

**Crie o banco de dados:**

```sql
-- No PostgreSQL
CREATE DATABASE financial_db;
```

**Configure as variáveis de ambiente:**

Crie um arquivo `.env` na raiz do projeto:

```env
DATABASE_URL=postgresql://seu_usuario:sua_senha@localhost:5432/financial_db
DB_HOST=localhost
DB_PORT=5432
DB_USER=seu_usuario
DB_NAME=financial_db
DB_PASSWORD=sua_senha
DB_SSL=false
PORT=8080
```

### 4. Execute as migrações

```bash
npm run migrate
```

### 5. Inicie o servidor

```bash
# Desenvolvimento (com hot reload)
npm run dev

# Produção
npm run build
npm start
```

O servidor estará rodando em: `http://localhost:8080`

## 📋 Comandos úteis

| Comando            | Descrição                          |
| ------------------ | ---------------------------------- |
| `npm run dev`      | Inicia servidor de desenvolvimento |
| `npm run build`    | Compila o TypeScript               |
| `npm start`        | Executa em produção                |
| `npm run migrate`  | Executa migrações do banco         |
| `npm run rollback` | Desfaz última migração             |

## 🛠️ Stack principal

- **Express.js** - Framework web para Node.js
- **TypeScript** - Tipagem estática para JavaScript
- **PostgreSQL** - Banco de dados relacional
- **Knex.js** - Query builder e migrações para PostgreSQL
- **Chalk** - Sistema de logs coloridos

## 📡 Endpoints disponíveis

### Status do servidor

```http
GET /
# Retorna: {"message": "Server is on"}

GET /health
# Retorna: {"message": "Server is healthy"}
```

### Autenticação

```http
POST /signup
Content-Type: application/json

{
  "email": "usuario@email.com",
  "password": "senha123"
}
```

```http
POST /signin
Content-Type: application/json

{
  "email": "usuario@email.com",
  "password": "senha123"
}
```

## 🗂️ Estrutura do projeto

```
src/
├── db/
│   ├── connection.ts         # Conexão com banco
│   └── migrations/           # Migrações do banco
├── utils/
│   └── logger.ts            # Sistema de logs
└── server.ts                # Servidor principal

knexfile.ts                  # Configuração do Knex
package.json                 # Dependências
tsconfig.json               # Configuração TypeScript
```

## ✅ Funcionalidades atuais

- [x] API REST com Express.js + TypeScript
- [x] Banco PostgreSQL com Knex.js
- [x] Sistema de migrações automáticas
- [x] Sistema de logs coloridos (success/warning/error)
- [x] Endpoints de cadastro e login
- [x] Validação básica de email
- [x] CORS configurado para frontend

## 🔄 Próximas funcionalidades

> **Nota**: As funcionalidades abaixo estão em planejamento e serão implementadas conforme a evolução do projeto.

### Autenticação e Segurança

- [ ] Hash de senhas (bcrypt)
- [ ] JWT para autenticação
- [ ] Validação de dados de entrada

### Core Financeiro

- [ ] Gestão de contas (conta corrente, poupança, cartão)
- [ ] Registro de transações
- [ ] Categorização de gastos
- [ ] Saldo e extratos

### Funcionalidades Avançadas

- [ ] Orçamentos e metas
- [ ] Relatórios financeiros
- [ ] Dashboard com gráficos
- [ ] Rate limiting para APIs
- [ ] Notificações e lembretes
- [ ] Importação de extratos
- [ ] Multi-moedas
- [ ] Backup e exportação

## 📝 Licença

Este projeto está sob a licença ISC.

## 👨‍💻 Autor

**Gabriel Medeiros**  
📧 gabrielmed00@hotmail.com

---

⚡ **Dica**: Se encontrar algum problema, verifique se o PostgreSQL está rodando e se as credenciais no `.env` estão corretas!
