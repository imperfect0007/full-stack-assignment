# Multi-Tenant SaaS Notes Application

A multi-tenant SaaS notes application built with Next.js, TypeScript, and SQLite, deployed on Vercel. The application supports multiple tenants with strict data isolation, role-based access control, and subscription-based feature gating.

## Features

- **Multi-Tenancy**: Support for multiple tenants (Acme and Globex) with strict data isolation
- **Authentication**: JWT-based authentication with role-based access control
- **Roles**: Admin (can invite users and upgrade subscriptions) and Member (can manage notes)
- **Subscription Plans**: Free (3 notes limit) and Pro (unlimited notes)
- **Notes Management**: Full CRUD operations for notes with tenant isolation
- **Frontend**: Modern React-based UI with Tailwind CSS

## Multi-Tenancy Approach

This application uses a **shared schema with tenant ID column** approach:

- All tables include a `tenant_id` column to ensure data isolation
- Database queries always filter by `tenant_id` to prevent cross-tenant data access
- Users are associated with tenants through the `tenant_id` foreign key
- This approach provides good performance while maintaining strict isolation

### Database Schema

```sql
-- Tenants table
CREATE TABLE tenants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  plan TEXT NOT NULL DEFAULT 'free',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Users table
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member',
  tenant_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants (id)
);

-- Notes table
CREATE TABLE notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  user_id INTEGER NOT NULL,
  tenant_id INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users (id),
  FOREIGN KEY (tenant_id) REFERENCES tenants (id)
);
```

## Test Accounts

The application comes with predefined test accounts:

### Acme Corp
- **admin@acme.test** (Admin role)
- **user@acme.test** (Member role)

### Globex Corp
- **admin@globex.test** (Admin role)
- **user@globex.test** (Member role)

**Password for all accounts**: `password`

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login

### Notes Management
- `GET /api/notes` - List all notes for current tenant
- `POST /api/notes` - Create a new note
- `GET /api/notes/:id` - Get a specific note
- `PUT /api/notes/:id` - Update a note
- `DELETE /api/notes/:id` - Delete a note

### Tenant Management
- `POST /api/tenants/:slug/upgrade` - Upgrade tenant to Pro plan (Admin only)

### Health Check
- `GET /api/health` - Health check endpoint

## Subscription Plans

### Free Plan
- Maximum of 3 notes per tenant
- Basic note management features

### Pro Plan
- Unlimited notes
- All features unlocked

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access Control**: Admin and Member roles with different permissions
- **Tenant Isolation**: Strict data isolation between tenants
- **Password Hashing**: Bcrypt for secure password storage
- **CORS Enabled**: For API access from external applications

## Technology Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: SQLite (in-memory for demo, can be configured for persistence)
- **Authentication**: JWT with jsonwebtoken
- **Password Hashing**: bcryptjs
- **Deployment**: Vercel

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set environment variables:
   ```bash
   JWT_SECRET=your-secret-key-change-in-production
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

### Deployment on Vercel

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Deploy with default settings
4. The application will be available at your Vercel URL

## Testing

The application includes automated test validation for:

- Health endpoint availability
- Successful login for all predefined accounts
- Enforcement of tenant isolation
- Role-based restrictions
- Free plan note limit enforcement
- Pro plan upgrade functionality
- All CRUD endpoint functionality
- Frontend accessibility

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── auth/login/route.ts
│   │   ├── health/route.ts
│   │   ├── notes/
│   │   │   ├── route.ts
│   │   │   └── [id]/route.ts
│   │   └── tenants/[slug]/upgrade/route.ts
│   ├── dashboard/page.tsx
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── lib/
│   ├── auth.ts
│   ├── database.ts
│   └── middleware.ts
├── package.json
├── tailwind.config.js
├── tsconfig.json
├── vercel.json
└── README.md
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
