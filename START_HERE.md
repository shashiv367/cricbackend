# Your Production Deployment - START HERE

All your deployment files have been moved into the **backend/** directory for better organization.

## 📋 Current Configuration

- **Database**: Supabase
- **Docker Hub**: `shashiv456/cricapp-backend`
- **Server IP**: `103.233.73.55`
- **Deployment Unit**: `backend/`

---

## Step 1: Push the Project to GitHub

Make sure all files are on GitHub:

```powershell
cd d:\Shashi\cricapp\backend
git add .
git commit -m "Initialize isolated backend repository"
git push origin main
```

---

## Step 2: Setup Server

If you haven't already set up the server directory:

1. **Upload setup script**:
```powershell
scp backend\server-setup.sh grahmindubuntu@103.233.73.55:/tmp/
```

2. **Run on server**:
```bash
ssh grahmindubuntu@103.233.73.55
chmod +x /tmp/server-setup.sh
/tmp/server-setup.sh
```

---

## Step 3: Configure Env on Server

Update `/opt/cricapp/.env.production` with your Supabase credentials.

```bash
ssh grahmindubuntu@103.233.73.55
nano /opt/cricapp/.env.production
```

---

## Step 4: Automate Deployment

Every time you push to GitHub, the **GitHub Actions** will:
1. Build the Docker image from `backend/`
2. Push to Docker Hub
3. Deploy to your server automatically!

Check status: https://github.com/shashiv367/cricbackend/actions

---

## ✅ Summary of File Move

The following files are now inside the **backend/** folder:
- `docker-compose.yml`
- `docker-compose.prod.yml`
- `deploy.sh`
- `server-setup.sh`
- `DEPLOYMENT_CHECKLIST.md`

Your backend is now a self-contained "App" deployment unit! 🚀
