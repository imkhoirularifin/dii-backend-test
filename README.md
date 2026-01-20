# Employee Management System with RBAC

A comprehensive NestJS backend API with Role-Based Access Control (RBAC) for employee management system.

## Features

- **JWT Authentication** with refresh tokens
- **Role-Based Access Control (RBAC)** with menu permissions
- **Hierarchical Menu System** with unlimited nesting levels
- **User Management** with role assignments
- **Permission Management** with CRUD-level access control
- **Session Tracking** with IP and user agent logging
- **PostgreSQL Database** with Prisma ORM
- **Swagger API Documentation**
- **Global validation** and error handling
- **Response transformation** for consistent API responses

## Technology Stack

- **Framework**: NestJS 11
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: class-validator & class-transformer
- **Documentation**: Swagger/OpenAPI
- **Password Hashing**: bcrypt


## Installation

```bash
# Install dependencies
npm install

# Generate Prisma Client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Seed the database
npm run prisma:seed
```

## Configuration

Create a `.env` file in the root directory:

```env
# Database Configuration
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/dii_backend_test"

# JWT Configuration
JWT_SECRET="your-secret-key-change-this-in-production"
JWT_EXPIRATION="15m"
JWT_REFRESH_SECRET="your-refresh-secret-change-this-in-production"
JWT_REFRESH_EXPIRATION="7d"

# Application Configuration
PORT=3000
NODE_ENV="development"
```

## Running the Application

```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

The application will be available at:
- **API**: http://localhost:3000/api
- **Swagger Documentation**: http://localhost:3000/api/docs

## Database Migrations

```bash
# Create a new migration
npx prisma migrate dev --name migration_name

# Apply migrations in production
npx prisma migrate deploy

# Reset database (development only)
npx prisma migrate reset

# View migration status
npx prisma migrate status
```

## Database Seeding

Seed the database with default data for testing and development:

```bash
npm run prisma:seed
```

### Default Seed Data

The seed script populates the database with the following default data:

#### **Roles**
| Role Code | Role Name       | Description                          |
|-----------|-----------------|--------------------------------------|
| `ADMIN`   | Administrator   | System administrator with full access |
| `MANAGER` | Manager         | Department manager                   |
| `STAFF`   | Staff           | Regular staff member                 |

#### **Default Admin User**
| Field      | Value                 |
|------------|-----------------------|
| Username   | `admin`               |
| Password   | `admin123`            |
| Email      | `admin@example.com`   |
| Full Name  | System Administrator  |
| Role       | Administrator (ADMIN) |

> ⚠️ **Security Note**: Change the default admin password immediately in production environments!

#### **Menus**
The seed creates the following menu structure:

**Main Menus (Level 1):**
1. **Dashboard** (`DASHBOARD`) - `/dashboard` 🎯
2. **User Management** (`USER_MGMT`) - `/users` 👥
   - **User List** (`USER_LIST`) - `/users/list` 📋 (Level 2 submenu)
3. **Role Management** (`ROLE_MGMT`) - `/roles` 🛡️
4. **Menu Management** (`MENU_MGMT`) - `/menus` 📑

#### **Permissions**

**Admin Role Permissions:**
- Full access (View, Create, Update, Delete) to all menus
- Complete control over the system

**Staff Role Permissions:**
- View-only access to Dashboard
- No access to management modules

**Manager Role:**
- No default permissions (to be configured as needed)

### Resetting and Reseeding

To reset the database and reseed with fresh data:

```bash
# This will drop all data, reapply migrations, and run the seed script
npx prisma migrate reset
```

## Development

```bash
# Format code
npm run format

# Lint code
npm run lint

# Run in watch mode
npm run start:dev
```

## API Documentation

Full API documentation is available via Swagger UI at:
- http://localhost:3000/api/docs

The Swagger UI provides:
- Interactive API testing
- Request/response schemas
- Authentication testing
- Example payloads

## Requirements

- Node.js >= 18
- PostgreSQL >= 14
- npm >= 9
