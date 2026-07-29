# Quick Vercel Deployment Steps

## 1. Prepare Your Repository

```bashdd
# Make sure all changes are committed
git add .
git commit -m "Confingurennnn for Vercel deployment"
git push origin main
```
bb
## 2. Deploy to Vercel

### Option A: Using Vercel CLI

```bash
# Install Vercel CLI globally
npm i -g vercel

# Login to Vercel
vercel login

# Deploy from your project root
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? (your account)
# - Link to existing project? No
# - Project name: marwanproject (or your preferred name)
# - Directory: ./
```

### Option B: Using Vercel Dashboard

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Vercel will auto-detect the configuration

## 3. Set Environment Variables

In Vercel dashboard:

1. Go to your project
2. Settings → Environment Variables
3. Add these variables:

| Name           | Value                                                               | Environment |
| -------------- | ------------------------------------------------------------------- | ----------- |
| `DATABASE_URL` | `postgresql://username:password@host:5432/database_name?sslmode=require` | Production  |
| `FRONTEND_URL` | `https://your-app-name.vercel.app`                                  | Production  |
| `NODE_ENV`     | `production`                                                        | Production  |

Before testing the app, run `database/postgresql_schema.sql` against the configured PostgreSQL database.

## 4. Redeploy

After setting environment variables:

- Go to Deployments tab
- Click "Redeploy" on the latest deployment

## 5. Test Your Deployment

- Frontend: `https://your-app-name.vercel.app`
- API: `https://your-app-name.vercel.app/api/Product`
- Health check: `https://your-app-name.vercel.app/api/`

## Troubleshooting

- Check Vercel function logs in the dashboard
- Ensure PostgreSQL connection string is correct
- Verify all environment variables are set
- Check that your PostgreSQL provider allows connections from Vercel
