# Meridian EMS - Backend

AI-enabled Education Management System

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your settings
# Make sure MongoDB is running

# Seed Super Admin
npm run seed:admin

# Seed Demo Data
npm run seed

# Start development server
npm run dev
```

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@meridian-ems.com | Admin@123456 |
| Principal | principal@demo.meridian-ems.com | Principal@123 |
| Teacher | teacher@demo.meridian-ems.com | Teacher@123 |
| Student | student@demo.meridian-ems.com | Student@123 |
| Parent | parent@demo.meridian-ems.com | Parent@123 |

## API Endpoints

- Health Check: `GET /health`
- API Info: `GET /api/v1`

## Tech Stack

- Node.js + Express.js
- MongoDB + Mongoose
- JWT Authentication
- LangChain + Google Gemini AI
