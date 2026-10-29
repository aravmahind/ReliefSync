# ReliefSync — Server Configuration Specification

> Configuration Management specification for the Disaster Relief Volunteer Platform.
> Target OS: Ubuntu 22.04 LTS (Jammy Jellyfish)

---

## 1. System Packages

| #  | Package / Software        | Version Constraint   | Purpose                                        |
|----|---------------------------|----------------------|------------------------------------------------|
| 1  | `curl`                    | latest               | HTTP utility for health checks and downloads   |
| 2  | `wget`                    | latest               | File retrieval                                 |
| 3  | `git`                     | latest               | Source-code checkout                            |
| 4  | `build-essential`         | latest               | Native C/C++ addon compilation (node-gyp)      |
| 5  | `ca-certificates`         | latest               | TLS certificate trust store                    |
| 6  | `gnupg`                   | latest               | GPG key management for apt repos               |
| 7  | `lsb-release`             | latest               | Distro identification                          |
| 8  | `software-properties-common` | latest            | PPA management                                 |
| 9  | **Node.js**               | 20.x LTS             | Backend + frontend runtime/build               |
| 10 | **npm**                   | (bundled with Node)  | Dependency management                          |
| 11 | **MongoDB 7.0 Community** | 7.0                  | Primary database (Mongoose ODM)                |
| 12 | **Docker CE**             | latest               | Container build/run (Jenkins pipeline)         |
| 13 | **Docker Compose Plugin** | latest               | Multi-container orchestration                  |
| 14 | **Nginx**                 | latest               | Reverse proxy (frontend → :5173, API → :5001)  |
| 15 | **Java JDK**              | 11                   | Selenium test suite (Maven, JUnit 5)           |
| 16 | **Apache Maven**          | 3.9+                 | Build tool for Selenium tests                  |
| 17 | **Google Chrome**         | latest stable        | Headless browser for Selenium                  |
| 18 | `ufw`                     | (pre-installed)      | Host firewall                                  |

---

## 2. System Users & Groups

| User            | UID  | Group(s)                    | Shell          | Home                  | Purpose                         |
|-----------------|------|-----------------------------|----------------|-----------------------|---------------------------------|
| `reliefsync`    | 1500 | `reliefsync`, `docker`      | `/bin/bash`    | `/opt/reliefsync`     | Application service account     |
| `deploy`        | 1501 | `deploy`, `docker`, `sudo`  | `/bin/bash`    | `/home/deploy`        | Deployment / Ansible target user|

---

## 3. Directory Structure

```text
/opt/reliefsync/                     # Application root (owned by reliefsync:reliefsync)
├── app/                             # Git checkout of the repository
│   ├── backend/                     # Express API source
│   ├── frontend/                    # React/Vite source + dist/
│   └── selenium-tests/             # Maven Selenium test project
├── logs/                            # Application + Nginx logs
│   ├── backend.log
│   └── nginx/
├── backups/                         # MongoDB backup dumps
├── .env                             # Production environment variables
└── ssl/                             # TLS certificates (if applicable)

/var/log/reliefsync/                 # Symlink → /opt/reliefsync/logs
/etc/nginx/sites-available/          # Nginx vhost config
/etc/nginx/sites-enabled/           # Nginx active vhost symlink
```

---

## 4. Configuration Files

| File                                          | Purpose                                      |
|-----------------------------------------------|----------------------------------------------|
| `/opt/reliefsync/.env`                        | Environment vars (PORT, MONGODB_URI)         |
| `/etc/nginx/sites-available/reliefsync.conf`  | Reverse-proxy virtual host                   |
| `/etc/systemd/system/reliefsync-backend.service` | Systemd unit for the Express backend      |
| `/etc/mongod.conf`                            | MongoDB bind address + storage config        |
| `/etc/docker/daemon.json`                     | Docker daemon config (log rotation, etc.)    |

### 4.1 Environment Variables (`/opt/reliefsync/.env`)

```env
PORT=5001
MONGODB_URI=mongodb://127.0.0.1:27017/reliefsync
NODE_ENV=production
DEPLOY_ENV=production
```

---

## 5. Network Ports

| Port   | Protocol | Service             | Firewall Rule             |
|--------|----------|---------------------|---------------------------|
| 22     | TCP      | SSH                 | Allow (admin access)      |
| 80     | TCP      | Nginx HTTP          | Allow (public)            |
| 443    | TCP      | Nginx HTTPS         | Allow (public, future)    |
| 5001   | TCP      | Express backend     | Internal only (via Nginx) |
| 5173   | TCP      | Vite dev server     | Deny in production        |
| 27017  | TCP      | MongoDB             | Internal only (loopback)  |
| 3000   | TCP      | Docker mapped port  | Allow (CI/CD testing)     |

---

## 6. Services (systemd)

| Unit Name                       | Description                           | Enabled | State     |
|---------------------------------|---------------------------------------|---------|-----------|
| `reliefsync-backend.service`    | Express API server (Node.js)          | yes     | running   |
| `mongod.service`                | MongoDB 7.0 Community Server          | yes     | running   |
| `nginx.service`                 | Nginx reverse proxy                   | yes     | running   |
| `docker.service`                | Docker container engine               | yes     | running   |
| `ufw.service`                   | Uncomplicated Firewall                | yes     | active    |

---

## 7. Dependency Graph

```text
reliefsync-backend.service
  ├── requires: mongod.service    (database must be up first)
  ├── requires: network-online    (network connectivity)
  └── before:   nginx.service     (proxy routes to backend)

nginx.service
  └── requires: reliefsync-backend.service

docker.service
  └── standalone (used by Jenkins CI/CD pipeline)
```

---

## 8. Security Hardening

- MongoDB binds to `127.0.0.1` only (no external exposure)
- UFW default policy: deny incoming, allow outgoing
- SSH key-based auth recommended; password auth disabled
- Application runs as unprivileged `reliefsync` user
- Docker socket access limited to `docker` group members
- Node.js process managed by systemd with restart-on-failure
