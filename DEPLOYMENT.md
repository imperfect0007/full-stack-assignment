# Deployment Guide

## Deploying to Vercel

### Prerequisites
1. A Vercel account (free tier is sufficient)
2. Your code pushed to a GitHub repository

### Steps

1. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Sign in with your GitHub account
   - Click "New Project"

2. **Import Repository**
   - Select your repository containing this project
   - Click "Import"

3. **Configure Project**
   - Framework Preset: Next.js
   - Root Directory: `./` (default)
   - Build Command: `npm run build` (default)
   - Output Directory: `.next` (default)

4. **Environment Variables**
   - Add environment variable: `JWT_SECRET`
   - Set value to a secure random string (e.g., use `openssl rand -base64 32`)

5. **Deploy**
   - Click "Deploy"
   - Wait for deployment to complete

### Post-Deployment

1. **Test Health Endpoint**
   - Visit `https://your-app.vercel.app/api/health`
   - Should return `{"status":"ok"}`

2. **Test Login**
   - Visit `https://your-app.vercel.app`
   - Try logging in with test accounts:
     - admin@acme.test / password
     - user@acme.test / password
     - admin@globex.test / password
     - user@globex.test / password

3. **Test Features**
   - Create notes (up to 3 for free plan)
   - Test tenant isolation (notes from one tenant shouldn't appear for another)
   - Test admin upgrade functionality
   - Test role-based access control

### CORS Configuration

The application is configured with CORS headers to allow external access:
- `Access-Control-Allow-Origin: *`
- `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type, Authorization`

This allows automated test scripts and dashboards to access the API.

### Database Notes

- The application uses SQLite in-memory database
- Data is reset on each deployment/restart
- For production, consider using a persistent database like PostgreSQL or MySQL
- The current setup is suitable for demo/testing purposes

### Troubleshooting

1. **Build Errors**
   - Check that all dependencies are in `package.json`
   - Ensure TypeScript compilation passes locally

2. **Runtime Errors**
   - Check Vercel function logs
   - Verify environment variables are set
   - Test API endpoints individually

3. **CORS Issues**
   - Verify `vercel.json` configuration
   - Check that OPTIONS handlers are implemented
   - Test with browser developer tools
