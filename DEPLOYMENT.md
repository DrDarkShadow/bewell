# BeWell Deployment Guide

This guide will help you deploy the BeWell application with the frontend on Vercel and backend on Railway/Render.

## Prerequisites

- GitHub account
- Vercel account (sign up at https://vercel.com)
- Railway account (https://railway.app) OR Render account (https://render.com)
- PostgreSQL database (can be created on Railway/Render)

---

## Part 1: Frontend Deployment on Vercel

### Step 1: Prepare the Repository

1. Make sure all changes are committed to Git:
```bash
git add .
git commit -m "Prepare for deployment"
git push origin main
```

### Step 2: Deploy to Vercel

1. Go to https://vercel.com and sign in
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`

5. Add Environment Variables:
   - Click "Environment Variables"
   - Add: `NEXT_PUBLIC_API_URL` = `https://your-backend-url.railway.app` (you'll get this after deploying backend)

6. Click "Deploy"

### Step 3: Update Environment Variables After Backend Deployment

Once your backend is deployed (see Part 2), you need to update the frontend:

1. Go to your Vercel project settings
2. Navigate to "Environment Variables"
3. Update `NEXT_PUBLIC_API_URL` with your actual backend URL
4. Redeploy the frontend

---

## Part 2: Backend Deployment on Railway

### Option A: Railway Deployment

#### Step 1: Create Railway Project

1. Go to https://railway.app and sign in
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository
5. Select the `backend` directory as root

#### Step 2: Add PostgreSQL Database

1. In your Railway project, click "New"
2. Select "Database" → "PostgreSQL"
3. Railway will automatically create a database and provide connection details

#### Step 3: Configure Environment Variables

Add these environment variables in Railway:

```env
# Database (Railway provides these automatically)
DATABASE_URL=postgresql://user:password@host:port/database

# AWS Credentials (for Bedrock AI)
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_DEFAULT_REGION=us-east-1

# Application Settings
ENVIRONMENT=production
SECRET_KEY=your-secret-key-here
ALLOWED_ORIGINS=https://your-vercel-app.vercel.app

# Optional: Model Server URL (if using separate model server)
MODEL_SERVER_URL=http://localhost:6000
```

#### Step 4: Configure Build Settings

1. **Build Command**: `pip install -r requirements.txt`
2. **Start Command**: `cd backend && uvicorn src.main:app --host 0.0.0.0 --port $PORT`
3. **Root Directory**: `/`

#### Step 5: Deploy

1. Click "Deploy"
2. Wait for the build to complete
3. Copy your Railway app URL (e.g., `https://your-app.railway.app`)

---

## Option B: Render Deployment

### Step 1: Create Render Web Service

1. Go to https://render.com and sign in
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: bewell-backend
   - **Root Directory**: `backend`
   - **Environment**: Python 3
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn src.main:app --host 0.0.0.0 --port $PORT`

### Step 2: Add PostgreSQL Database

1. Click "New +" → "PostgreSQL"
2. Choose a name and plan
3. Copy the Internal Database URL

### Step 3: Add Environment Variables

Same as Railway (see above)

### Step 4: Deploy

1. Click "Create Web Service"
2. Wait for deployment
3. Copy your Render app URL

---

## Part 3: Database Setup

### Step 1: Run Migrations

After backend is deployed, you need to create database tables:

1. Connect to your Railway/Render shell or use a database client
2. Run the migration script:

```bash
# If using Railway CLI
railway run python backend/scripts/create_tables.py

# Or connect directly to PostgreSQL and run SQL
```

### Step 2: Verify Database

Check that all tables are created:
- users
- professional_profiles
- conversations
- messages
- appointments
- appointment_requests
- request_receivers
- escalations

---

## Part 4: Final Configuration

### Update Frontend with Backend URL

1. Go to Vercel project settings
2. Update `NEXT_PUBLIC_API_URL` environment variable
3. Redeploy frontend

### Update Backend CORS Settings

Make sure your backend allows requests from your Vercel domain:

In `backend/src/main.py`, update CORS origins:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://your-vercel-app.vercel.app",
        "http://localhost:3000"  # for local development
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## Part 5: Testing

1. Visit your Vercel URL
2. Try to sign up/login
3. Test the AI Companion chat
4. Test the escalation flow
5. Check that WebSocket connections work

---

## Troubleshooting

### Frontend Issues

**Problem**: API calls failing
- **Solution**: Check that `NEXT_PUBLIC_API_URL` is set correctly in Vercel
- **Solution**: Verify CORS settings in backend

**Problem**: Build fails
- **Solution**: Check build logs in Vercel
- **Solution**: Make sure all dependencies are in `package.json`

### Backend Issues

**Problem**: Database connection fails
- **Solution**: Verify `DATABASE_URL` environment variable
- **Solution**: Check that database is running

**Problem**: AI not responding
- **Solution**: Verify AWS credentials are set
- **Solution**: Check that Bedrock is enabled in your AWS account

**Problem**: WebSocket not connecting
- **Solution**: Make sure your hosting platform supports WebSockets
- **Solution**: Railway and Render both support WebSockets by default

---

## Environment Variables Summary

### Frontend (Vercel)
```env
NEXT_PUBLIC_API_URL=https://your-backend-url.railway.app
```

### Backend (Railway/Render)
```env
DATABASE_URL=postgresql://...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_DEFAULT_REGION=us-east-1
ENVIRONMENT=production
SECRET_KEY=...
ALLOWED_ORIGINS=https://your-vercel-app.vercel.app
```

---

## Monitoring

### Vercel
- View logs in Vercel dashboard
- Monitor build times and deployments
- Check analytics for traffic

### Railway/Render
- View application logs
- Monitor resource usage
- Set up alerts for errors

---

## Scaling Considerations

1. **Database**: Upgrade PostgreSQL plan as needed
2. **Backend**: Railway/Render auto-scales based on traffic
3. **Frontend**: Vercel handles scaling automatically
4. **Caching**: Consider adding Redis for session management

---

## Security Checklist

- [ ] All environment variables are set
- [ ] CORS is configured correctly
- [ ] Database credentials are secure
- [ ] AWS credentials have minimal required permissions
- [ ] HTTPS is enabled (automatic on Vercel/Railway/Render)
- [ ] Rate limiting is configured
- [ ] Input validation is in place

---

## Cost Estimates

### Free Tier Limits
- **Vercel**: 100GB bandwidth, unlimited deployments
- **Railway**: $5 free credit per month
- **Render**: 750 hours free per month

### Paid Plans
- **Vercel Pro**: $20/month
- **Railway**: Pay as you go (~$5-20/month for small apps)
- **Render**: $7/month for starter plan

---

## Support

If you encounter issues:
1. Check the logs in Vercel/Railway/Render dashboards
2. Review this deployment guide
3. Check the application README.md
4. Contact support for your hosting platform

---

## Next Steps

After successful deployment:
1. Set up custom domain (optional)
2. Configure monitoring and alerts
3. Set up automated backups for database
4. Implement CI/CD pipeline
5. Add error tracking (e.g., Sentry)
