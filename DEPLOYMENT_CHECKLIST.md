# Step-by-Step Deployment Checklist (Supabase Version)

Use this checklist to deploy your Cricket backend to production.

## ✅ Pre-Deployment (Local Machi

### 1. Configure GitHub Secrets
- [ ] Go to GitHub repository → Settings → Secrets → Actions
- [ ] Add `DOCKER_USERNAME` = `shashiv456`
- [ ] Add `DOCKER_PASSWORD` = `Shashi@01S`
- [ ] Add `SERVER_HOST` = `103.233.73.55`
- [ ] Add `SERVER_USERNAME` = `grahmindubuntu`
- [ ] Add `SERVER_SSH_KEY` = SSH private key content
- [ ] Add `SERVER_PORT` = `22` (optional)

### 2. Push Code to GitHub
```bash
cd d:\Shashi\cricapp
git add .
git commit -m "Trigger deployment"
git push origin main
```

---

## ✅ Server Setup

### 1. Run Setup
Follow instructions in [START_HERE.md](START_HERE.md) to set up the server.

### 2. Verify Server Setup
```bash
cd /opt/cricapp
ls -la
# Should see: .env.production, docker-compose.yml, deploy.sh
```

---

## ✅ Verification

Check health: `http://103.233.73.55:3000/health`
Check logs: `docker-compose logs -f backend`
