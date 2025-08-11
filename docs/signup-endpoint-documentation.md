# /signup Endpoint Documentation

## Architecture Overview
The `/signup` endpoint follows a layered architecture pattern with clear separation of concerns:

```
Client Request → Route Handler → Controller → Service → Database
```

## Layer-by-Layer Analysis

### 1. **Route Layer** (`src/server.ts:24` & `src/routes/auth/signup.ts`)

**Entry Point:**
- `POST /signup` mapped to `signupHandler` in `src/server.ts:24`

**Route Handler Logic** (`src/routes/auth/signup.ts:9-32`):
- Basic request validation (checks if `req.body` exists)
- Delegates to `registerController` 
- Error handling with 500 status response
- Logging with success/error messages

### 2. **Controller Layer** (`src/controllers/auth.ts:8-28`)

**Responsibilities:**
- Extracts `{email, name, password}` from request body
- **Input Validation**: Uses Zod schema validation via `registerServiceSchema.safeParse()`
- Returns 400 status if validation fails
- Delegates business logic to `registerService`
- Returns 201 status on success, 500 on failure
- Logs user creation success

### 3. **Validation Schema** (`src/schema/register-service-schema.ts`)

**Validation Rules:**
- `email`: Must be valid email format
- `name`: String, minimum 3 characters
- `password`: String, minimum 8 characters

### 4. **Service Layer** (`src/services/auth.ts:18-56`)

**Business Logic:**
- **Password Security**: Hashes password using `hashPassword` utility (`src/services/utils/hash-password.ts:3-9`)
  - Uses bcrypt with salt rounds of 10
- **UUID Generation**: Creates unique user ID using `uuid v4`
- **Data Preparation**: Constructs user payload with timestamps
- **Database Interaction**: Inserts user data into `users` table
- **Response Formatting**: Returns structured response with user data (excludes password)

### 5. **Database Layer** 

**Connection** (`src/db/connection.ts`):
- Uses Knex.js with PostgreSQL
- Environment-based configuration
- SSL support for production

**Schema** (`src/db/migrations/20250717154919_create_users_table.ts:8-14`):
```sql
users table:
- id (UUID, primary key)
- name (string, not null)
- email (string, not null, unique)
- password (string, not null) 
- created_at, updated_at (timestamps)
```

## Data Flow Diagram

```
1. POST /signup → signupHandler()
2. signupHandler() → registerController(req, res)
3. registerController() → Validate with registerServiceSchema
4. registerController() → registerService(email, name, password)
5. registerService() → hashPassword(password)
6. registerService() → db("users").insert(payload)
7. Return success response with user data (without password)
```

## Security Features

- **Password Hashing**: Bcrypt with salt rounds of 10
- **Input Validation**: Zod schema validation
- **Email Uniqueness**: Database constraint prevents duplicate emails
- **Error Handling**: Graceful error responses without exposing sensitive data

## Request/Response Examples

### Request
```bash
POST /signup
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "mypassword123"
}
```

### Response Format

**Success (201):**
```json
{
  "message": "Usuário criado com sucesso",
  "status": 201,
  "data": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "created_at": "timestamp",
    "updated_at": "timestamp"
  }
}
```

**Validation Error (400):**
```json
{
  "message": "validation error message"
}
```

**Server Error (500):**
```json
{
  "message": "Erro ao cadastrar usuário"
}
```

## File Structure

```
src/
├── server.ts                           # Main server setup and route registration
├── routes/auth/signup.ts               # Route handler for signup
├── controllers/auth.ts                 # Controller with validation logic
├── services/auth.ts                    # Business logic and database operations
├── services/utils/hash-password.ts     # Password hashing utility
├── schema/register-service-schema.ts   # Zod validation schema
├── db/connection.ts                    # Database connection setup
└── db/migrations/                      # Database migrations
    └── 20250717154919_create_users_table.ts
```

## Error Handling

The endpoint implements comprehensive error handling at multiple layers:

1. **Route Level**: Basic request body validation
2. **Controller Level**: Schema validation with detailed error messages
3. **Service Level**: Database operation error handling
4. **Database Level**: Constraint violations (unique email)

## Dependencies

- **Express.js**: Web framework
- **Zod**: Schema validation
- **Bcrypt**: Password hashing
- **UUID**: Unique identifier generation
- **Knex.js**: SQL query builder
- **PostgreSQL**: Database