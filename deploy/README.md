# POSify + MSP API — Azure Docker (alongside Ingoboka)

Server: **ingoboka-dev** · public IP **4.168.192.169** · Ubuntu 22.04 · 1 vCPU / 8 GB  
Ingoboka keeps **8085 / 9000 / 9001**. This app uses **80** (UI) and **5000** (API).

GitHub builds images. The VM only pulls and runs Compose. App folder: **`/opt/apps/msp-api`**.

## What already runs (leave it)

`ingoboka-api`, `ingoboka-minio`, `ingoboka-postgres`, `ingoboka-redis`

## What we add (separate Compose project `msp-api`)

`msp-postgres`, `msp-redis`, `msp-api`, `msp-frontend` (profile `web`)

## Local (do this before deploy)

**Backend** — needs local Postgres `tenant_pos_sys` / Redis as in `application-local.properties`:

```powershell
cd "C:\Users\user\OneDrive\Desktop\dev-works\SaaS Tenant POS\msp-api"
.\mvnw spring-boot:run "-Dspring-boot.run.profiles=local"
```

**Frontend:**

```powershell
cd C:\Users\user\OneDrive\Desktop\dev-works\multi-tenant-pos-fe.v2
copy .env.example .env
npm ci
npm run dev
```

Demo logins (after backend starts with `app.demo.seed=true` on local profile):

| Email | Password | UI |
|-------|----------|-----|
| mahingarodin@gmail.com | admin!123 | Super admin |
| manager@posify.demo | Demo!123 | Store |
| branch@posify.demo | Demo!123 | Branch |
| cashier@posify.demo | Demo!123 | POS |
| customer@posify.demo | Demo!123 | Shop |

Walkthrough: login as **super admin** → stores → as **manager** add/edit products → as **cashier** start shift → checkout → as **customer** see catalog.

## GitHub secrets (both repos)

| Secret | Value |
|--------|--------|
| `SERVER_HOST` | `4.168.192.169` |
| `SERVER_USERNAME` | `azureuser` |
| `SERVER_SSH_KEY` | private key |
| `SERVER_SSH_PASSPHRASE` | if the key has one |
| `GHCR_USERNAME` / `GHCR_TOKEN` | optional if packages stay private |

## Commands for you to run

### On the Azure VM (one time)

```bash
sudo usermod -aG docker azureuser
# reconnect SSH after this

sudo mkdir -p /opt/apps/msp-api
sudo chown -R azureuser:azureuser /opt/apps/msp-api

# Azure NSG: allow 80 and 5000 (22 already open)
sudo ufw allow 80/tcp || true
sudo ufw allow 5000/tcp || true
```

### From your PC — upload backend deploy files

```powershell
$KEY = "C:\Users\user\.ssh\<your-azure-key>"
$SERVER = "azureuser@4.168.192.169"
$APP = "/opt/apps/msp-api"
$BE = "C:\Users\user\OneDrive\Desktop\dev-works\SaaS Tenant POS\msp-api"

scp -i $KEY "$BE\deploy\docker\docker-compose.yml" "${SERVER}:${APP}/docker-compose.yml"
scp -i $KEY "$BE\deploy\docker\deploy.sh" "${SERVER}:${APP}/deploy.sh"
scp -i $KEY "$BE\deploy\docker\bootstrap.sh" "${SERVER}:${APP}/bootstrap.sh"
scp -i $KEY "$BE\deploy\docker\env.example" "${SERVER}:${APP}/env.example"
```

### On the VM — secrets + first API start (after GHCR image exists)

```bash
cd /opt/apps/msp-api
sed -i 's/\r$//' *.sh docker-compose.yml
chmod +x bootstrap.sh deploy.sh
bash bootstrap.sh
# edit .env if you want your own passwords

# PAT with read:packages if GHCR images are private:
# echo YOUR_PAT > ghcr.token && chmod 600 ghcr.token

IMAGE=ghcr.io/mahingarodin/msp-api:latest bash deploy.sh
curl -sf http://127.0.0.1:5000/actuator/health
```

### GitHub — push `main` on both repos (or Actions → Run workflow)

1. `msp-api-v2` → builds `ghcr.io/mahingarodin/msp-api:latest` and restarts `api`
2. `multi-tenant-pos-fe.v2` → builds frontend image and `docker compose --profile web up -d frontend`

### Confirm Ingoboka is untouched

```bash
sudo docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'
```

You should still see `ingoboka-*` plus `msp-*`.

## URLs after both images are up

- App: http://4.168.192.169/
- API health: http://4.168.192.169:5000/actuator/health
- Swagger: http://4.168.192.169:5000/swagger-ui.html
