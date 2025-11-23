# TigressAI Operations Handbook

**Version:** 1.0  
**Last Updated:** November 23, 2025  
**Owner:** Technical Operations Team

## Table of Contents
1. [System Overview](#system-overview)
2. [Vendor & Service Directory](#vendor--service-directory)
3. [Infrastructure Components](#infrastructure-components)
4. [Accessing Logs](#accessing-logs)
5. [Common Issues & Troubleshooting](#common-issues--troubleshooting)
6. [Emergency Contacts](#emergency-contacts)

---

## System Overview

TigressAI operates two main production applications:
- **Compliance Co-Pilot** (`rie.tigressai.com`) - Regulatory intelligence search platform
- **Auth Service** (`auth.tigressai.com`) - Centralized authentication and access management

---

## Vendor & Service Directory

| Vendor/Service | URL | Purpose | Access Level | Credentials Location |
|----------------|-----|---------|--------------|---------------------|
| **Vercel** | https://vercel.com/vinod-tigressaicos-projects | Hosting for Auth Service (`tai-auth` project) | Admin | Vinod's account |
| **Clerk** | https://dashboard.clerk.com | Authentication provider for both apps | Admin | Vinod's account |
| **AWS EC2** | Console: https://console.aws.amazon.com/ec2 | Production server for RIE backend & frontend | Root | SSH key: `~/.ssh/tigressai-copilot-key.pem` |
| **Hostinger** | https://hostinger.com | DNS management for `tigressai.com` | Admin | Vinod's account |
| **GitHub** | https://github.com/TigressAI | Source code repositories | Admin | Organization account |
| **Let's Encrypt** | N/A (automated via Certbot) | SSL certificates for `rie.tigressai.com` | Automated | On EC2 server |

### Service Details

#### Vercel (Auth Service Hosting)
- **Project Name:** `tai-auth`
- **Production URL:** https://auth.tigressai.com
- **Database:** Vercel Postgres (attached to project)
- **Environment Variables:** Configured in Vercel dashboard
- **Auto-deploy:** Enabled on `main` branch pushes

#### Clerk (Authentication)
- **Production Instance:** `tigressai.com`
- **Applications:**
  - Auth Service: Uses production keys
  - Compliance Co-Pilot: Uses production keys
- **Webhook Endpoint:** `https://auth.tigressai.com/api/webhooks/clerk`
- **Events Monitored:** `user.created`, `user.updated`

#### AWS EC2 (RIE Infrastructure)
- **Instance IP:** `54.241.46.41`
- **Region:** us-west-1 (N. California)
- **OS:** Ubuntu
- **Services Running:**
  - Nginx (reverse proxy)
  - Docker Compose (backend services)
  - Neo4j (graph database)
  - PostgreSQL (relational database)
  - Redis (caching)
  - MinIO (object storage)

---

## Infrastructure Components

### Production Domains

| Domain | Purpose | Hosting | SSL |
|--------|---------|---------|-----|
| `rie.tigressai.com` | Compliance Co-Pilot frontend & API | EC2 + Nginx | Let's Encrypt |
| `auth.tigressai.com` | Authentication service | Vercel | Vercel SSL |

### Docker Services on EC2

| Container | Image | Port | Purpose |
|-----------|-------|------|---------|
| `rie-api` | Custom FastAPI | 8000 | Backend API |
| `rie-neo4j` | neo4j:5.15-enterprise | 7474, 7687 | Graph database |
| `rie-postgres` | postgres:15-alpine | 5432 | Relational database |
| `rie-redis` | redis:7-alpine | 6379 | Cache |
| `rie-minio` | minio/minio:latest | 9000, 9001 | Object storage |

### GitHub Repositories

| Repository | Purpose | Production Branch |
|------------|---------|-------------------|
| `TigressAI/rie` | RIE backend (FastAPI) | `main` |
| `TigressAI/rie` (subfolder: TAI-Compliance-Co-Pilot) | RIE frontend (React) | `main` |
| `TigressAI/tai-auth-service` | Auth service (Next.js) | `main` |

---

## Accessing Logs

### 1. Vercel Logs (Auth Service)

**Dashboard Access:**
```
1. Go to https://vercel.com/vinod-tigressaicos-projects/tai-auth
2. Click "Deployments" tab
3. Click on the latest deployment
4. Click "Logs" tab
```

**Real-time Logs:**
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# View logs
vercel logs tai-auth --follow
```

**Log Types:**
- Build logs: Shows compilation errors
- Runtime logs: Shows API errors, webhook failures
- Edge logs: Shows routing issues

### 2. EC2 Server Logs

**SSH Access:**
```bash
ssh -i ~/.ssh/tigressai-copilot-key.pem ubuntu@54.241.46.41
```

**Docker Container Logs:**
```bash
# View all containers
docker ps

# View specific container logs
docker logs rie-api --tail 100 --follow
docker logs rie-neo4j --tail 100 --follow
docker logs rie-postgres --tail 100 --follow

# View logs for all services
docker-compose -f ~/rie/docker-compose.yml logs --tail 100 --follow
```

**Nginx Logs:**
```bash
# Access logs
sudo tail -f /var/log/nginx/access.log

# Error logs
sudo tail -f /var/log/nginx/error.log

# Specific domain logs (if configured)
sudo tail -f /var/log/nginx/rie.tigressai.com.access.log
sudo tail -f /var/log/nginx/rie.tigressai.com.error.log
```

**System Logs:**
```bash
# System journal
sudo journalctl -u nginx -f
sudo journalctl -u docker -f

# Disk usage
df -h

# Memory usage
free -h

# CPU usage
top
```

### 3. Clerk Logs

**Dashboard Access:**
```
1. Go to https://dashboard.clerk.com
2. Select "TigressAI" workspace
3. Click "Logs" in left sidebar
```

**Log Types:**
- Authentication events
- Webhook delivery logs
- User creation/update events
- Failed login attempts

### 4. Database Logs

**Neo4j Logs:**
```bash
# Via Docker
docker exec -it rie-neo4j cat /logs/neo4j.log

# Or access Neo4j Browser
# URL: http://54.241.46.41:7474
# Credentials: In environment variables
```

**PostgreSQL Logs:**
```bash
# Via Docker
docker logs rie-postgres --tail 100

# Connect to database
docker exec -it rie-postgres psql -U postgres
```

---

## Common Issues & Troubleshooting

### Issue 1: Users Can't Sign In

**Symptoms:**
- Sign-in page loads but authentication fails
- Users redirected to error page

**Check:**
1. **Clerk Status:**
   - Go to Clerk dashboard → Check for service alerts
   - Verify webhook is receiving events

2. **Auth Service Logs:**
   ```bash
   # Check Vercel logs
   vercel logs tai-auth --follow
   ```

3. **Database Connection:**
   - Verify Vercel Postgres is running
   - Check environment variables in Vercel dashboard

**Common Fixes:**
- Redeploy auth service: `git push` to trigger Vercel deployment
- Restart webhook: Toggle webhook in Clerk dashboard
- Check Clerk keys match in Vercel environment variables

### Issue 2: Compliance Co-Pilot Not Loading

**Symptoms:**
- Blank page after login
- 404 errors
- API errors

**Check:**
1. **EC2 Server Status:**
   ```bash
   ssh -i ~/.ssh/tigressai-copilot-key.pem ubuntu@54.241.46.41
   docker ps  # All containers should be "Up" and "healthy"
   ```

2. **Nginx Status:**
   ```bash
   sudo systemctl status nginx
   sudo nginx -t  # Test configuration
   ```

3. **API Health:**
   ```bash
   curl https://rie.tigressai.com/api/stats
   ```

**Common Fixes:**
```bash
# Restart Docker services
cd ~/rie
docker-compose restart

# Restart Nginx
sudo systemctl restart nginx

# Check disk space
df -h
# If disk full, clean Docker images:
docker system prune -a
```

### Issue 3: Search Not Working (405 Errors)

**Symptoms:**
- Search returns "405 Method Not Allowed"
- CORS errors in browser console

**Check:**
1. **Browser Cache:**
   - Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
   - Try incognito/private window

2. **Nginx CORS Configuration:**
   ```bash
   ssh -i ~/.ssh/tigressai-copilot-key.pem ubuntu@54.241.46.41
   cat /etc/nginx/sites-enabled/rie.tigressai.com
   # Should include OPTIONS handling
   ```

3. **API Endpoint:**
   ```bash
   curl -X POST https://rie.tigressai.com/api/query \
     -H "Content-Type: application/json" \
     -d '{"query":"test","top_k":10}'
   ```

**Common Fixes:**
- Clear browser cache
- Verify Nginx configuration includes CORS headers
- Redeploy frontend with correct API base URL

### Issue 4: Slow Query Performance

**Symptoms:**
- Queries take >10 seconds
- Timeout errors

**Check:**
1. **Neo4j Status:**
   ```bash
   docker exec -it rie-neo4j cypher-shell -u neo4j -p <password>
   # Run: CALL dbms.listQueries();
   ```

2. **Server Resources:**
   ```bash
   ssh -i ~/.ssh/tigressai-copilot-key.pem ubuntu@54.241.46.41
   top  # Check CPU/memory usage
   df -h  # Check disk space
   ```

3. **API Logs:**
   ```bash
   docker logs rie-api --tail 100 | grep "Process-Time"
   ```

**Common Fixes:**
- Restart Neo4j: `docker restart rie-neo4j`
- Clear Redis cache: `docker exec -it rie-redis redis-cli FLUSHALL`
- Increase EC2 instance size if consistently slow

### Issue 5: SSL Certificate Expired

**Symptoms:**
- Browser shows "Not Secure" warning
- Certificate error on `rie.tigressai.com`

**Check:**
```bash
ssh -i ~/.ssh/tigressai-copilot-key.pem ubuntu@54.241.46.41
sudo certbot certificates
```

**Fix:**
```bash
# Renew certificate
sudo certbot renew

# Reload Nginx
sudo systemctl reload nginx
```

---

## Emergency Contacts

| Role | Name | Contact | Availability |
|------|------|---------|--------------|
| System Owner | Vinod Paniker | vinod@tigressai.com | 24/7 |
| DevOps Lead | TBD | TBD | Business hours |
| Database Admin | TBD | TBD | On-call |

---

## Quick Reference Commands

### Check All Services Status
```bash
# EC2 Services
ssh -i ~/.ssh/tigressai-copilot-key.pem ubuntu@54.241.46.41 "docker ps && sudo systemctl status nginx"

# Test API
curl https://rie.tigressai.com/api/stats

# Test Auth Service
curl https://auth.tigressai.com/admin
```

### Restart All Services
```bash
# On EC2
ssh -i ~/.ssh/tigressai-copilot-key.pem ubuntu@54.241.46.41
cd ~/rie
docker-compose restart
sudo systemctl restart nginx
```

### View All Logs
```bash
# EC2 Logs
ssh -i ~/.ssh/tigressai-copilot-key.pem ubuntu@54.241.46.41
docker-compose logs --tail 100 --follow

# Vercel Logs
vercel logs tai-auth --follow
```

---

## Maintenance Schedule

| Task | Frequency | Command |
|------|-----------|---------|
| SSL Certificate Renewal | Auto (90 days) | `sudo certbot renew` |
| Docker Image Updates | Monthly | `docker-compose pull && docker-compose up -d` |
| Database Backup | Weekly | `docker exec rie-neo4j neo4j-admin dump` |
| Log Rotation | Auto (daily) | Configured via logrotate |
| Security Updates | Weekly | `sudo apt update && sudo apt upgrade` |

---

## Appendix: Environment Variables

### Vercel (Auth Service)
- `DATABASE_URL` - Vercel Postgres connection string
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk public key
- `CLERK_SECRET_KEY` - Clerk secret key
- `CLERK_WEBHOOK_SECRET` - Webhook signing secret

### EC2 (RIE Backend)
Located in: `~/rie/.env`
- `NEO4J_URI`, `NEO4J_USER`, `NEO4J_PASSWORD`
- `POSTGRES_*` variables
- `REDIS_URL`
- `MINIO_*` variables
- `ANTHROPIC_API_KEY`

---

**Document Control:**
- Created: November 23, 2025
- Last Review: November 23, 2025
- Next Review: December 23, 2025
