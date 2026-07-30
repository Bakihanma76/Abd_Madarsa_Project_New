# Free Hosting Deployment

This project needs three hosted parts:

- Frontend: Vercel free
- Backend API: Render free web service
- MySQL: Aiven free MySQL

Google Drive cannot run this app because it cannot run Node.js or MySQL.

## 1. Create Aiven MySQL

1. Create an Aiven account.
2. Create a free MySQL service. Do not create OpenSearch, PostgreSQL, Redis, or Kafka for this app.
3. Copy these values from Aiven:
   - host
   - port
   - user
   - password
   - database name

## 2. Deploy Backend On Render

1. Push this repo to GitHub.
2. In Render, create a new Web Service from the repo.
3. Use:
   - build command: `npm ci && npm run db:setup`
   - start command: `npm run server`
   - health check path: `/api/health`
4. Add environment variables:
   - `DB_HOST`
   - `DB_PORT`
   - `DB_USER`
   - `DB_PASSWORD`
   - `DB_NAME`
   - `DB_SSL=true`
   - `DB_SSL_REJECT_UNAUTHORIZED=false`
   - `NODE_ENV=production`
   - `FRONTEND_URL=https://your-vercel-app.vercel.app`
5. Deploy.
6. Open `https://your-render-backend.onrender.com/api/health`.

## 3. Setup Cloud Database

If your Render plan has Shell access, you can run:

```bash
npm run db:setup
```

On Render Hobby without Shell access, set the Render build command to `npm ci && npm run db:setup`. This creates tables and seed data in Aiven MySQL during each deploy.

## 4. Deploy Frontend On Vercel

1. Import the same GitHub repo in Vercel.
2. Framework should be Vite.
3. Add environment variable:
   - `VITE_API_BASE=https://your-render-backend.onrender.com/api`
4. Deploy.

## 5. Final Checks

Open the Vercel URL and login:

- Admin: `abdullahboss1900@gmail.com` / `Admin@1900`
- Principal: `principal@madarsa.edu` / `Principal@123`
- Teacher: `teacher@madarsa.edu` / `Teacher@123`
- Student: `student@madarsa.edu` / `Student@123`
- Parent: `parent@madarsa.edu` / `Parent@123`

Run this after backend is deployed:

```bash
API_BASE=https://your-render-backend.onrender.com/api npm run test:e2e
```

## Free Tier Notes

- Render free backend sleeps when idle, so first load can take around one minute.
- Aiven free MySQL has small limits and is suitable for demo/small usage.
- Upgrade backend/database before real production traffic.
