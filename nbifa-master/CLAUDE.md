# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

BIFA Gestiune is a Romanian financial/accounting management system built with:
- **Frontend**: Quasar Framework v1 (Vue.js 2) for main app, Quasar v2 (Vue.js 3) for bifalop module
- **Backend**: Node.js + Express.js API server on port 3333
- **Database**: MySQL using Knex.js query builder
- **Authentication**: JWT tokens
- **Styling**: Stylus (.styl) and Sass (.sass)

## Development Commands

### Backend Development
```bash
npm start              # Start backend server with nodemon on port 3333
```

### Frontend Development
```bash
quasar dev            # Start Quasar dev server (auto-opens browser)
```

### Database Operations
```bash
cd server
npx knex migrate:latest                    # Run migrations
npx knex migrate:latest --env aky          # Run migrations for aky database
npx knex seed:run                          # Run seeds
```

### Build Commands
```bash
quasar build          # Build frontend for production
```

### Bifalop Module (Quasar v2)
```bash
cd bifalop
npm install           # Install dependencies
quasar dev           # Start development server
quasar build         # Build for production
```

## Architecture Overview

### Directory Structure
- `/src/` - Main frontend application (Quasar v1)
  - `components/` - Reusable Vue components
  - `pages/` - Route-level page components
  - `layouts/` - Layout wrappers (MyLayout for main app, AkyLayout for procurement)
  - `store/` - Vuex state management modules
  - `boot/` - App initialization (axios setup)
  
- `/server/` - Backend API
  - `api/controllers/` - Business logic
  - `api/routes/` - Express route definitions
  - `api/middleware/` - JWT authentication middleware
  - `knexfile.js` - Database configuration
  
- `/bifalop/` - Newer Quasar v2 application module

### Key Modules
The system manages:
- **Core**: Users (Utilizatori), Inventory (Gestiuni), Categories, Accounts (Conturi)
- **Materials**: Materials management, Locations (Locuri)
- **Documents**: Document management and PDF generation via Puppeteer
- **Procurement**: PAAP (Annual Procurement Plans), Purchase Requisitions (Referate)
- **Contracts**: Contract management, Legal commitments (Angajamente)
- **Suppliers**: Supplier management (Furnizori)
- **Reports**: Various financial and operational reports

### Database Configuration
Two database environments configured in `/server/knexfile.js`:
- `development`: Uses 'bifa' database
- `aky`: Uses 'adata' database for procurement module

### API Structure
- Base URL: `http://localhost:3333/`
- Authentication: JWT tokens required for protected routes
- All API routes defined in `/server/api/routes/`

### Frontend Routing
- Main routes use MyLayout for standard operations
- AkyLayout used for procurement/contracting workflows
- Routes defined in `/src/router/routes.js`

## Important Notes

- The project uses Quasar CLI commands, not npm scripts for frontend operations
- No testing framework is currently configured
- PDF generation uses Puppeteer for reports
- The framework is set to 'all' mode in quasar.conf.js (includes everything - development mode)
- Both PWA and Electron support are configured but may not be actively used