# BeWell Backend Deployment on AWS EC2

Complete guide to deploy the BeWell backend on AWS EC2.

---

## Part 1: EC2 Instance Setup

### Step 1: Launch EC2 Instance

1. **Go to AWS Console**: https://console.aws.amazon.com/ec2
2. **Click "Launch Instance"**
3. **Configure Instance**:

```
Name: bewell-backend

Application and OS Images:
- Ubuntu Server 22.04 LTS (Free tier eligible)
- Architecture: 64-bit (x86)

Instance Type:
- t2.medium (4GB RAM) - RECOMMENDED for your models
- OR t2.small (2GB RAM) - Minimum, might be tight
- OR t3.medium (4GB RAM) - Better performance

Key Pair:
- Create new key pair
- Name: bewell-key
- Type: RSA
- Format: .pem (for SSH)
- Download and save securely!

Network Settings:
✅ Allow SSH traffic from: My IP (your current IP)
✅ Allow HTTPS traffic from the internet
✅ Allow HTTP traffic from the internet

Configure Storage:
- 20 GB gp3 (General Purpose SSD)

Advanced Details:
- Leave default
```

4. **Click "Launch Instance"**
5. **Wait for instance to start** (Status: Running)

### Step 2: Connect to EC2

#### Windows (Using PowerShell):

```powershell
# Navigate to where you saved the key
cd C:\Users\YourName\Downloads

# Set permissions (if needed)
icacls bewell-key.pem /inheritance:r
icacls bewell-key.pem /grant:r "%username%:R"

# Connect to EC2
ssh -i bewell-key.pem ubuntu@YOUR_EC2_PUBLIC_IP
```

#### Alternative: Use EC2 Instance Connect (Browser-based)
```
1. Go to EC2 Console
2. Select your instance
3. Click "Connect"
4. Choose "EC2 Instance Connect"
5. Click "Connect"
```

---

## Part 2: Server Setup

### Step 1: Update System

```bash
# Update package list
sudo apt update

# Upgrade packages
sudo apt upgrade -y
```

### Step 2: Install Python 3.11+

```bash
# Install Python and pip
sudo apt install python3.11 python3.11-venv python3-pip -y

# Verify installation
python3 --version
pip3 --version
```

### Step 3: Install PostgreSQL

```bash
# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql

# In PostgreSQL prompt:
CREATE DATABASE bewell;
CREATE USER bewell_user WITH PASSWORD 'your_secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE bewell TO bewell_user;
\q
```

### Step 4: Install Nginx (Reverse Proxy)

```bash
# Install Nginx
sudo apt install nginx -y

# Start Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Step 5: Install Git

```bash
sudo apt install git -y
```

---

## Part 3: Deploy Application

### Step 1: Clone Repository

```bash
# Navigate to home directory
cd ~

# Clone your repository
git clone https://github.com/DrDarkShadow/bewell.git

# Navigate to backend
cd bewell/backend
```

### Step 2: Create Virtual Environment

```bash
# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Upgrade pip
pip install --upgrade pip
```

### Step 3: Install Dependencies

```bash
# Install Python packages
pip install -r ../requirements.txt

# Install additional system dependencies
sudo apt install ffmpeg -y  # For audio processing
```

### Step 4: Configure Environment Variables

```bash
# Create .env file
nano .env

# Add these variables (press Ctrl+X, then Y to save):
```

```env
# Database
DATABASE_URL=postgresql://bewell_user:your_secure_password_here@localhost:5432/bewell

# AWS Credentials
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=us-east-1

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this

# Application
ENVIRONMENT=production
WORKER_ID=1

# CORS
ALLOWED_ORIGINS=https://your-vercel-app.vercel.app,https://bewell.yourdomain.com
```

### Step 5: Initialize Database

```bash
# Run database migrations
python scripts/create_tables.py

# Verify tables created
sudo -u postgres psql -d bewell -c "\dt"
```

### Step 6: Test Application

```bash
# Test run (Ctrl+C to stop)
uvicorn src.main:app --host 0.0.0.0 --port 8000

# Test in browser or curl
curl http://localhost:8000/docs
```

---

## Part 4: Production Setup with Systemd

### Step 1: Create Systemd Services

#### Main Backend Service

```bash
# Create service file
sudo nano /etc/systemd/system/bewell.service
```

Add this content:

```ini
[Unit]
Description=BeWell Backend API
After=network.target bewell-model-server.service

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/bewell/backend
Environment="PATH=/home/ubuntu/bewell/backend/venv/bin"
Environment="MODEL_SERVER_URL=http://localhost:6000"
EnvironmentFile=/home/ubuntu/bewell/backend/.env
ExecStart=/home/ubuntu/bewell/backend/venv/bin/uvicorn src.main:app --host 0.0.0.0 --port 8000 --workers 1
Restart=always
RestartSec=10
MemoryMax=2G

[Install]
WantedBy=multi-user.target
```

#### Model Server Service (for Whisper + ML Models)

```bash
# Create model server service file
sudo nano /etc/systemd/system/bewell-model-server.service
```

Add this content:

```ini
[Unit]
Description=BeWell Model Server (Whisper + ML Models)
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/bewell/backend
Environment="PATH=/home/ubuntu/bewell/backend/venv/bin"
EnvironmentFile=/home/ubuntu/bewell/backend/.env
ExecStart=/home/ubuntu/bewell/backend/venv/bin/python model_server/server.py
Restart=always
RestartSec=10
MemoryMax=1.5G

[Install]
WantedBy=multi-user.target
```

### Step 2: Start Services

```bash
# Reload systemd
sudo systemctl daemon-reload

# Start model server first (backend depends on it)
sudo systemctl enable bewell-model-server
sudo systemctl start bewell-model-server
sudo systemctl status bewell-model-server

# Then start main backend
sudo systemctl enable bewell
sudo systemctl start bewell
sudo systemctl status bewell

# View logs
sudo journalctl -u bewell-model-server -f  # Model server logs
sudo journalctl -u bewell -f              # Backend logs
```

**Important Notes:**
- Model server must start before backend (backend depends on it for listening agent)
- Model server runs on port 6000 (internal only, not exposed via Nginx)
- Backend runs on port 8000 (exposed via Nginx)
- Total memory usage: ~2.5GB (1.5GB model server + 1GB backend)

---

## Part 5: Configure Nginx Reverse Proxy

### Step 1: Create Nginx Configuration

```bash
# Create config file
sudo nano /etc/nginx/sites-available/bewell
```

Add this content:

```nginx
server {
    listen 80;
    server_name your-domain.com;  # Replace with your domain or EC2 public IP

    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # WebSocket support
        proxy_read_timeout 86400;
    }
}
```

### Step 2: Enable Configuration

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/bewell /etc/nginx/sites-enabled/

# Remove default config
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

---

## Part 6: Setup SSL with Let's Encrypt (Optional but Recommended)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate (replace with your domain)
sudo certbot --nginx -d your-domain.com

# Auto-renewal is set up automatically
# Test renewal
sudo certbot renew --dry-run
```

---

## Part 7: Configure Security Group

### In AWS Console:

1. Go to **EC2 → Security Groups**
2. Select your instance's security group
3. **Edit Inbound Rules**:

```
Type            Protocol    Port Range    Source
SSH             TCP         22            My IP
HTTP            TCP         80            0.0.0.0/0
HTTPS           TCP         443           0.0.0.0/0
Custom TCP      TCP         8000          0.0.0.0/0 (for testing, remove later)
```

---

## Part 8: Update Frontend with Backend URL

### Step 1: Get EC2 Public IP/Domain

```bash
# Get public IP
curl http://checkip.amazonaws.com
```

### Step 2: Update Vercel Environment Variable

1. Go to **Vercel Dashboard**
2. Select your project
3. Go to **Settings → Environment Variables**
4. Update `NEXT_PUBLIC_API_URL`:
   - If using domain: `https://your-domain.com`
   - If using IP: `http://YOUR_EC2_PUBLIC_IP`
5. **Redeploy** frontend

---

## Part 9: Monitoring & Maintenance

### Check Application Status

```bash
# Service status
sudo systemctl status bewell

# View logs
sudo journalctl -u bewell -f

# Check Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Check disk space
df -h

# Check memory usage
free -h

# Check running processes
htop  # Install with: sudo apt install htop
```

### Update Application

```bash
# Navigate to repo
cd ~/bewell

# Pull latest changes
git pull origin main

# Restart service
sudo systemctl restart bewell
```

### Database Backup

```bash
# Create backup
sudo -u postgres pg_dump bewell > backup_$(date +%Y%m%d).sql

# Restore backup
sudo -u postgres psql bewell < backup_20260304.sql
```

---

## Part 10: Cost Optimization

### EC2 Instance Pricing (us-east-1):

```
t2.micro (1GB RAM):   $0.0116/hour = ~$8.50/month   ❌ Too small
t2.small (2GB RAM):   $0.023/hour  = ~$17/month    ⚠️  Minimum
t2.medium (4GB RAM):  $0.046/hour  = ~$34/month    ✅ Recommended
t3.medium (4GB RAM):  $0.042/hour  = ~$31/month    ✅ Better performance
```

### Free Tier:
- **t2.micro**: 750 hours/month free for 12 months
- **Storage**: 30GB EBS free
- **Data Transfer**: 15GB out free

### Cost Saving Tips:
1. Use **Reserved Instances** (save up to 72%)
2. Use **Spot Instances** for non-critical workloads
3. Stop instance when not in use (development)
4. Use **CloudWatch** to monitor usage
5. Set up **billing alerts**

---

## Troubleshooting

### Service won't start:
```bash
# Check logs
sudo journalctl -u bewell -n 50

# Check if port is in use
sudo lsof -i :8000

# Kill process if needed
sudo kill -9 <PID>
```

### Database connection error:
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Check connection
psql -U bewell_user -d bewell -h localhost
```

### Nginx error:
```bash
# Test config
sudo nginx -t

# Check logs
sudo tail -f /var/log/nginx/error.log
```

### Out of memory:
```bash
# Check memory
free -h

# Add swap space
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
```

---

## Quick Commands Reference

```bash
# Start/Stop/Restart service
sudo systemctl start bewell
sudo systemctl stop bewell
sudo systemctl restart bewell

# View logs
sudo journalctl -u bewell -f

# Update code
cd ~/bewell && git pull && sudo systemctl restart bewell

# Check status
sudo systemctl status bewell
sudo systemctl status nginx
sudo systemctl status postgresql

# Database backup
sudo -u postgres pg_dump bewell > backup.sql
```

---

## Security Checklist

- [ ] SSH key-based authentication only (disable password auth)
- [ ] Firewall configured (UFW or Security Groups)
- [ ] SSL certificate installed
- [ ] Database password is strong
- [ ] JWT secret is secure and random
- [ ] AWS credentials have minimal permissions
- [ ] Regular security updates: `sudo apt update && sudo apt upgrade`
- [ ] Fail2ban installed for SSH protection
- [ ] CloudWatch monitoring enabled
- [ ] Automated backups configured

---

## Next Steps

1. ✅ EC2 instance running
2. ✅ Application deployed
3. ✅ Nginx configured
4. ✅ SSL enabled (optional)
5. ✅ Frontend updated with backend URL
6. 🎉 **Your app is live!**

---

## Support

If you encounter issues:
1. Check logs: `sudo journalctl -u bewell -f`
2. Check AWS CloudWatch
3. Review this guide
4. Check AWS documentation

**Your backend will be accessible at:**
- HTTP: `http://YOUR_EC2_PUBLIC_IP`
- HTTPS: `https://your-domain.com` (if SSL configured)
