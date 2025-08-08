# Architecture Documentation

## Overview

This is a Node.js/Express REST API built with TypeScript for financial management. The application follows a modular architecture with clear separation of concerns.

## Technology Stack

### Core Technologies
- **Node.js** - JavaScript runtime environment
- **Express.js** - Web framework for HTTP server and routing
- **TypeScript** - Static typing for JavaScript
- **PostgreSQL** - Relational database
- **Knex.js** - SQL query builder and database migrations

### Development Tools
- **tsx** - TypeScript execution and hot reload for development
- **ESLint** - Code linting and style enforcement
- **Chalk** - Terminal output colorization for logging

### Dependencies
- **cors** - Cross-Origin Resource Sharing middleware
- **helmet** - Security middleware (production ready)
- **dotenv** - Environment variable management

## Project Structure

```
houseback/
├── src/                          # Source code directory
│   ├── server.ts                 # Main application entry point
│   ├── db/                       # Database related files
│   │   ├── connection.ts         # Database connection configuration
│   │   ├── migrations/           # Database schema migrations
│   │   │   └── 20250717154919_create_users_table.ts
│   │   └── seeds/                # Database seed files (empty)
│   ├── routes/                   # API route handlers (empty)
│   └── utils/                    # Utility functions
│       └── logger.ts             # Custom logging system
├── dist/                         # Compiled JavaScript output
├── docs/                         # Documentation
├── knexfile.ts                   # Knex.js configuration
├── package.json                  # Project dependencies and scripts
├── tsconfig.json                 # TypeScript configuration
└── README.md                     # Project documentation
```

## Application Architecture

### 1. Entry Point (`src/server.ts`)
The main server file that:
- Initializes Express application
- Configures middleware (CORS, JSON parsing)
- Defines API endpoints
- Tests database connection on startup
- Starts the HTTP server

### 2. Database Layer (`src/db/`)

#### Connection (`src/db/connection.ts`)
- Establishes PostgreSQL connection using Knex.js
- Handles database configuration from environment variables
- Includes connection testing functionality
- Creates users table if it doesn't exist

#### Migrations (`src/db/migrations/`)
- Database schema version control
- Current migration: Users table creation
- Managed through Knex.js migration system

### 3. Utilities (`src/utils/`)

#### Logger (`src/utils/logger.ts`)
- Custom logging system using Chalk for colored output
- Three log levels: `success` (green), `warning` (yellow), `error` (red)
- Includes timestamps in format `[YYYY-MM-DD HH:mm]`

### 4. Configuration

#### Database Configuration (`knexfile.ts`)
- Separate configurations for development and production
- Environment variable based connection settings
- Migration and seed directories configuration

#### Environment Variables
Required environment variables:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/database
DB_HOST=localhost
DB_PORT=5432
DB_USER=username
DB_NAME=database_name
DB_PASSWORD=password
DB_SSL=false
PORT=8080
```

## Current API Endpoints

### Health Check Endpoints
- `GET /` - Server status check
- `GET /health` - Application health check

### Authentication Endpoints
- `POST /signup` - User registration (partially implemented)
- `POST /signin` - User authentication (placeholder)

## Data Models

### Users Table
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

Note: There's a discrepancy between the migration (which doesn't include password) and the server implementation (which expects password).

## Development Workflow

### Available Scripts
- `npm run dev` - Development server with hot reload
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Run production server
- `npm run lint` - Run ESLint code analysis
- `npm run type-check` - TypeScript type checking
- `npm run migrate` - Run database migrations
- `npm run rollback` - Rollback last migration

### Development Process
1. Code changes in `src/` directory
2. Hot reload via tsx for instant feedback
3. Type checking and linting for code quality
4. Database changes through migrations
5. Build and deploy to production

## Security Considerations

### Current Security Features
- CORS enabled (currently allows all origins with `*`)
- Basic input validation (email presence check)
- Environment variable based configuration

### Security Improvements Needed
- Password hashing (currently stored in plain text)
- JWT token authentication
- Input sanitization and validation
- Rate limiting
- Helmet middleware configuration
- CORS restriction to specific origins

## Database Architecture

### Connection Management
- Single database connection through Knex.js
- Connection pooling handled by underlying PostgreSQL driver
- Environment-based configuration for different environments

### Migration Strategy
- Schema version control through Knex migrations
- Forward and rollback migration support
- Separate migration paths for development and production

## Logging Strategy

The application uses a custom logging system with:
- Timestamped log entries
- Color-coded severity levels
- Console-based output (suitable for containerized deployments)

## Future Architecture Considerations

### Planned Improvements
1. **Route Organization** - Move endpoints to dedicated route files
2. **Middleware Layer** - Authentication, validation, error handling
3. **Service Layer** - Business logic separation
4. **Data Access Layer** - Database query abstraction
5. **Configuration Management** - Centralized config handling
6. **Error Handling** - Structured error responses
7. **Testing** - Unit and integration test setup
8. **Monitoring** - Application metrics and health checks

### Scalability Considerations
- Horizontal scaling through stateless design
- Database connection pooling optimization
- Caching layer implementation
- Load balancing preparation
- Microservice architecture readiness