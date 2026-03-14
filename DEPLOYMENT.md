# Deployment Guide

## 🚀 Client Deployment to Netlify

### Step 1: Build the Client
```bash
cd client
npm install
npm run build
```

### Step 2: Deploy to Netlify
1. Go to [Netlify](https://netlify.com) and sign in
2. Click "Add new site" → "Deploy manually"
3. Drag and drop the `client/dist` folder
4. Your site will be deployed instantly!

### Step 3: Configure Environment Variables
1. Go to Site settings → Environment variables
2. Add: `VITE_API_BASE_URL` = `https://your-render-app.onrender.com/api`

### Step 4: Update Production URL
After deployment, update `client/.env.production` with your actual Render URL.

---

## 🖥️ Server Deployment to Render

### Step 1: Prepare Repository
1. Create a new GitHub repository
2. Push your `server` folder contents to the repository

### Step 2: Deploy to Render
1. Go to [Render](https://render.com) and sign in
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: your-app-name
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Root Directory**: Leave empty (if server is in root) or `server` (if in subfolder)

### Step 3: Environment Variables
Add these environment variables in Render:
```
PORT=5000
MONGO_URI=mongodb+srv://your-username:your-password@cluster.mongodb.net/your-database
JWT_SECRET=your-super-secret-jwt-key-here
NODE_ENV=production
```

### Step 4: Update CORS
After deployment, update `server/index.js` CORS configuration with your actual Netlify URL:
```javascript
origin: [
  'https://your-actual-netlify-app.netlify.app',
  'https://your-custom-domain.com'
]
```

---

## 🔄 Post-Deployment Updates

### Update Client API URL
1. Update `client/.env.production` with your actual Render URL
2. Rebuild and redeploy client: `npm run build` → drag `dist` folder to Netlify

### Update Server CORS
1. Update CORS origins in `server/index.js` with your actual Netlify URL
2. Commit and push to trigger Render redeploy

---

## 🧪 Testing

### Test API Endpoints
```bash
# Test server health
curl https://your-render-app.onrender.com/

# Test auth endpoint
curl -X POST https://your-render-app.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@student.com","password":"demo1234"}'
```

### Test Client
1. Visit your Netlify URL
2. Try logging in with demo accounts:
   - `demo@student.com` / `demo1234`
   - `ankit@youthfin.com` / `ankit1234`
   - `ria@youthfin.com` / `ria1234`

---

## 📝 Notes

- **Render Free Tier**: Apps sleep after 15 minutes of inactivity
- **Netlify**: Automatic HTTPS and global CDN
- **Database**: Make sure MongoDB Atlas allows connections from anywhere (0.0.0.0/0)
- **Environment Variables**: Never commit `.env` files to Git

## 🔧 Troubleshooting

### Common Issues:
1. **CORS Error**: Update server CORS origins with actual Netlify URL
2. **API Not Found**: Check `VITE_API_BASE_URL` in Netlify environment variables
3. **Database Connection**: Verify MongoDB Atlas network access and credentials
4. **Build Fails**: Check Node.js version compatibility (use Node 18+)