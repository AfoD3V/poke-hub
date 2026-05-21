# PokeHub — Kubernetes Deployment Guide
## k3s + Helm + ArgoCD on Hetzner (4 GB / 2 CPU)

> **Learning-first guide.** Every concept is explained before you use it.  
> Server OS: Ubuntu 22.04 · Registry: ghcr.io · CI: GitHub Actions · CD: ArgoCD (GitOps)

---

## Table of Contents

1. [ArgoCD vs Coolify — Full Comparison](#1-argocd-vs-coolify--full-comparison)
2. [The Big Picture — How All Pieces Fit](#2-the-big-picture--how-all-pieces-fit)
3. [Kubernetes Concepts You Need to Know](#3-kubernetes-concepts-you-need-to-know)
4. [Server Setup on Hetzner](#4-server-setup-on-hetzner)
5. [Install k3s](#5-install-k3s)
6. [Core Infrastructure in k3s](#6-core-infrastructure-in-k3s)
7. [Your Helm Chart](#7-your-helm-chart)
8. [Install and Configure ArgoCD](#8-install-and-configure-argocd)
9. [GitHub Actions CI Pipeline](#9-github-actions-ci-pipeline)
10. [The Full GitOps Flow End-to-End](#10-the-full-gitops-flow-end-to-end)
11. [Useful kubectl Commands for Daily Use](#11-useful-kubectl-commands-for-daily-use)
12. [Resource Budget and Tuning](#12-resource-budget-and-tuning)

---

## 1. ArgoCD vs Coolify — Full Comparison

Before picking a tool, understand what problem each one solves.

### What is Coolify?

Coolify is a **self-hosted PaaS** (Platform-as-a-Service) — think of it as a self-hosted version of Heroku or Railway. You point it at your GitHub repo, it builds your Docker image, and it deploys it. It has a beautiful web UI, one-click databases, and auto-SSL.

**What Coolify is NOT:** Coolify has nothing to do with Kubernetes. It manages Docker Compose or Docker Swarm under the hood. If you use Coolify, you are not learning Kubernetes — you are using a tool that hides all infrastructure from you.

| | Coolify |
|---|---|
| RAM usage | ~200–300 MB |
| What it deploys to | Docker (not k8s) |
| Web UI | ✅ Beautiful |
| Learning value for k8s | ❌ None — it hides everything |
| Auto SSL | ✅ Built-in |
| Good for | Devs who want Heroku-like simplicity |

### What is ArgoCD?

ArgoCD is a **GitOps continuous delivery tool for Kubernetes**. It runs _inside_ your k3s cluster and watches a Git repository. Whenever the Git repo changes (e.g. a new image tag in your Helm chart values), ArgoCD detects the drift and syncs the cluster to match — automatically.

This is the **GitOps** pattern: Git is the single source of truth. You never `kubectl apply` manually; you commit to Git and let ArgoCD do the rest.

| | ArgoCD |
|---|---|
| RAM usage | ~600–900 MB (5+ pods) |
| What it deploys to | Kubernetes (your k3s cluster) |
| Web UI | ✅ Good (shows sync status, pod logs, diff) |
| Learning value for k8s | ✅✅ Very high — teaches GitOps, the real-world pattern |
| Auto SSL | ❌ (cert-manager handles that separately) |
| Good for | Anyone learning production k8s patterns |

### What is Flux CD? (Bonus Option)

Flux CD does the same job as ArgoCD (GitOps for k8s) but is lighter and more CLI-focused.

| | ArgoCD | Flux CD |
|---|---|---|
| RAM | ~700 MB | ~150–250 MB |
| Web UI | ✅ | ❌ (CLI only) |
| Ease of learning | Easier (UI helps you understand) | Steeper curve |
| Production usage | Very common | Very common |

### Recommendation for Your Setup

**Use GitHub Actions + ArgoCD.** Here is why:

- Coolify defeats your learning goal entirely. Cross it off.
- ArgoCD's UI makes GitOps tangible — you can _see_ the diff between what's in Git and what's running in the cluster. This is the fastest way to understand the pattern.
- On 4 GB RAM, ArgoCD is tight but feasible (see [Resource Budget](#12-resource-budget-and-tuning) for tuning).
- If RAM becomes a real issue later, migrating from ArgoCD to Flux CD is a one-afternoon job — the Helm charts don't change.

**The mental model to internalize:**
```
GitHub Actions  = CI (build, test, push image, update image tag in Git)
ArgoCD          = CD (watch Git, sync cluster when Git changes)
Helm            = the "package format" that describes your app to k8s
k3s             = the actual Kubernetes runtime
```

---

## 2. The Big Picture — How All Pieces Fit

Here is the full flow from a `git push` to a running pod:

```
Developer
    │
    ├─ opens PR → GitHub Actions runs tests
    │
    └─ merges PR to main
           │
           ▼
    GitHub Actions (CI)
    ├─ 1. Run `bun run test` in both packages
    ├─ 2. Build Docker images  (api, ui)
    ├─ 3. Push images to ghcr.io with tag = git SHA
    └─ 4. Update image.tag in helm/values.yaml → commit → push
           │
           ▼
    Git repo (main branch)  ← ArgoCD is watching this
           │
           ▼
    ArgoCD (running in k3s on Hetzner)
    ├─ Detects values.yaml changed
    ├─ Renders Helm chart with new values
    ├─ Diffs rendered manifests vs cluster state
    └─ Applies the diff (rolling update)
           │
           ▼
    k3s Cluster (Hetzner VPS)
    ├─ Namespace: pokehub
    ├─ Deployment: api   (Hono + Bun)
    ├─ Deployment: ui    (Next.js 14 App Router)
    ├─ StatefulSet: postgres
    ├─ StatefulSet: redis
    ├─ Ingress (Traefik) → routes traffic to api/ui Services
    └─ PersistentVolumeClaims → Hetzner volume (/data)
```

Everything inside the box lives on your single Hetzner VPS. k3s runs a full (but lightweight) Kubernetes control plane and worker node on the same machine.

---

## 3. Kubernetes Concepts You Need to Know

Work through these in order. Each builds on the previous one.

### 3.1 Pod

The **smallest deployable unit** in Kubernetes. A Pod is one or more containers that share a network namespace (they can talk to each other on `localhost`) and a storage namespace.

```
Pod: api
├─ Container: hono-api (your Bun/Hono server)
└─ (optionally a sidecar container, e.g. for logging)
```

You almost never create Pods directly. You create Deployments, which create Pods for you.

### 3.2 Deployment

A **Deployment** tells Kubernetes: "I want 2 replicas of this Pod. If one dies, restart it. When I update the image, do a rolling update."

```yaml
# Conceptual — you'll use Helm templates, not raw YAML
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
spec:
  replicas: 1          # how many Pod copies to run
  selector:
    matchLabels:
      app: api
  template:            # this is the Pod template
    spec:
      containers:
      - name: api
        image: ghcr.io/you/pokehub-api:abc1234
        ports:
        - containerPort: 3000
```

Key behaviour:
- If the Pod crashes, the Deployment controller restarts it immediately.
- When you update the image tag, k8s starts new Pods, waits for them to become Ready, then kills old ones. Zero-downtime by default.

### 3.3 Service

Pods get random internal IP addresses that change when they restart. A **Service** gives a stable DNS name and IP to a set of Pods.

```
Service: api-svc  (ClusterIP)
    │
    └─ routes to any Pod with label app=api
```

Types you'll use:
- **ClusterIP** — internal only, not accessible from outside the cluster. Use this for api ↔ postgres communication.
- **NodePort** — exposes on a port of the node (not pretty, but useful for debugging).
- **LoadBalancer** — requests a cloud load balancer. On a bare VPS with k3s, this is handled by k3s's built-in ServiceLB.

### 3.4 Ingress

An **Ingress** is a set of routing rules: "requests to `/api/*` go to the api Service; requests to `/*` go to the ui Service."

An **Ingress Controller** is the actual reverse proxy that reads those rules and forwards traffic. k3s ships with **Traefik** as its ingress controller — you get it for free.

```
Internet → port 80/443 on VPS
    │
    ▼
Traefik (Ingress Controller)
    ├─ /api/*  → api Service → api Pods
    └─ /*      → ui Service  → ui Pods
```

Without a domain, you'll use the server's public IP. Traefik still works — you just won't have TLS yet.

### 3.5 ConfigMap and Secret

- **ConfigMap** — stores non-sensitive configuration as key-value pairs or files. Example: `DATABASE_HOST=postgres-svc`.
- **Secret** — stores sensitive data (base64-encoded, not encrypted by default). Example: `DATABASE_PASSWORD=...`, `JWT_SECRET=...`.

Both get injected into Pods as environment variables or mounted as files.

```yaml
# Pod references a Secret
env:
- name: JWT_SECRET
  valueFrom:
    secretKeyRef:
      name: pokehub-secrets
      key: jwt-secret
```

⚠️ k8s Secrets are only base64-encoded in etcd by default, not encrypted. For a personal project this is fine. For production, look at Sealed Secrets or External Secrets Operator.

### 3.6 PersistentVolume and PersistentVolumeClaim

Containers are ephemeral — when a Pod restarts, its filesystem is wiped. For databases you need **persistent storage**.

- **PersistentVolume (PV)** — a piece of actual storage (your Hetzner volume, an NFS share, etc.)
- **PersistentVolumeClaim (PVC)** — a Pod's "request" for storage: "I need 5 GB of storage, give it to me." k8s matches the PVC to a PV.
- **StorageClass** — defines how PVs are dynamically provisioned. k3s ships with a `local-path` StorageClass that provisions storage from the node's filesystem.

```
PVC: postgres-data (requests 5Gi)
    │
    └─ bound to PV backed by /data/postgres on the VPS filesystem
```

For your setup: Hetzner volumes appear as block devices (e.g. `/dev/sdb`). You'll mount the volume to `/data` on the OS, then k3s's `local-path` provisioner will create subdirectories under a path you configure.

### 3.7 StatefulSet

A **StatefulSet** is like a Deployment but for **stateful workloads** like databases. Key differences:

| | Deployment | StatefulSet |
|---|---|---|
| Pod names | random (`api-7d9f6-xkbp2`) | stable (`postgres-0`, `postgres-1`) |
| Start/stop order | parallel | ordered (postgres-0 before postgres-1) |
| Storage | shared or none | each Pod gets its own PVC |
| Use for | stateless apps | databases, message queues |

Postgres must be a StatefulSet because:
1. It needs stable Pod names (for replication, though you'll have one replica)
2. It needs its own dedicated PVC that survives Pod restarts

### 3.8 Namespace

A **Namespace** is a virtual cluster inside your cluster. It isolates resources so that names don't clash. You'll use two:

- `pokehub` — your application (api, ui, postgres, redis)
- `argocd` — ArgoCD itself

### 3.9 Helm

**Helm** is the package manager for Kubernetes. Instead of writing 10 raw YAML files, you write a **Helm chart** — a folder of templates with variables. Helm renders the templates with your values into valid k8s YAML and applies it.

```
helm/
├── Chart.yaml          # metadata (name, version)
├── values.yaml         # your variables (image tags, replicas, etc.)
└── templates/
    ├── api-deployment.yaml
    ├── api-service.yaml
    ├── ui-deployment.yaml
    ├── postgres-statefulset.yaml
    ├── postgres-service.yaml
    ├── redis-statefulset.yaml
    ├── redis-service.yaml
    ├── ingress.yaml
    ├── configmap.yaml
    └── secrets.yaml
```

Values flow like this:
```
values.yaml:
  api:
    image:
      tag: "abc1234"   ← GitHub Actions updates this

template:
  image: ghcr.io/you/pokehub-api:{{ .Values.api.image.tag }}

rendered YAML:
  image: ghcr.io/you/pokehub-api:abc1234
```

---

## 4. Server Setup on Hetzner

### 4.1 Provision the Server

In Hetzner Cloud console:
1. Create a **CX22** (2 vCPU, 4 GB RAM) or **CPX21** server
2. OS: **Ubuntu 22.04**
3. Add your SSH public key during creation
4. Create a **Volume** (10–20 GB) and attach it to the server — this is where Postgres and Redis data will live
5. Note the server's public IPv4 address

### 4.2 Initial SSH Hardening

```bash
# SSH into your server
ssh root@YOUR_SERVER_IP

# Create a non-root user
adduser deploy
usermod -aG sudo deploy

# Copy SSH keys to new user
mkdir /home/deploy/.ssh
cp ~/.ssh/authorized_keys /home/deploy/.ssh/
chown -R deploy:deploy /home/deploy/.ssh

# Disable root SSH login
sed -i 's/PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl restart sshd

# Reconnect as deploy user from now on
```

### 4.3 Firewall Setup (UFW)

```bash
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp      # SSH
ufw allow 80/tcp      # HTTP (Traefik)
ufw allow 443/tcp     # HTTPS (Traefik, for when you add a domain)
ufw allow 6443/tcp    # k3s API server (needed for kubectl from your laptop)
ufw enable
```

### 4.4 Mount the Hetzner Volume

```bash
# Find your volume device (usually /dev/sdb or /dev/disk/by-id/...)
lsblk

# Format it (only do this ONCE — it wipes data)
mkfs.ext4 /dev/sdb

# Create mount point
mkdir -p /data

# Mount it
mount /dev/sdb /data

# Make it persist across reboots — add to /etc/fstab
echo '/dev/sdb /data ext4 defaults 0 2' >> /etc/fstab

# Verify
df -h /data
```

### 4.5 System Updates

```bash
apt update && apt upgrade -y
apt install -y curl git htop
```

---

## 5. Install k3s

### What k3s is

k3s is a certified, production-ready Kubernetes distribution that is stripped down to ~70 MB binary. It removes cloud-provider integrations, legacy alpha APIs, and in-tree storage drivers. What's left is a full Kubernetes control plane + worker node that runs comfortably on a single small VM.

k3s bundles:
- **containerd** — the container runtime (replaces Docker for running containers)
- **Traefik** — ingress controller
- **CoreDNS** — in-cluster DNS
- **local-path-provisioner** — automatic PVC provisioning on local storage
- **ServiceLB** — bare-metal load balancer (uses host ports)
- **etcd** (or SQLite for single-node) — the cluster state database

### 5.1 Install k3s

```bash
# Run as the deploy user (or root)
curl -sfL https://get.k3s.io | sh -s - \
  --data-dir /data/k3s \
  --default-local-storage-path /data/k3s-storage

# Explanation of flags:
# --data-dir /data/k3s            → store k3s state on your Hetzner volume
# --default-local-storage-path    → PVCs (database files) go here on the volume
```

After install:
```bash
# Check the service
systemctl status k3s

# The cluster should be up immediately. Test it:
sudo k3s kubectl get nodes

# You should see:
# NAME        STATUS   ROLES                  AGE   VERSION
# yourhost    Ready    control-plane,master   30s   v1.x.y+k3s1
```

### 5.2 Configure kubectl on Your Laptop

kubectl is the CLI tool for interacting with Kubernetes clusters. You can use it on your local machine to control your Hetzner cluster.

```bash
# On the server: get the kubeconfig
sudo cat /etc/rancher/k3s/k3s.yaml

# Copy its contents. On your local machine:
mkdir -p ~/.kube
# Paste the content into ~/.kube/config
# Then replace the server URL: change 127.0.0.1 to YOUR_SERVER_IP

# Test from your laptop
kubectl get nodes
```

### 5.3 Verify Traefik is Running

k3s starts Traefik automatically in the `kube-system` namespace:

```bash
kubectl get pods -n kube-system

# You should see pods like:
# traefik-...              1/1   Running
# coredns-...              1/1   Running
# local-path-provisioner-  1/1   Running
# svclb-traefik-...        1/1   Running
```

---

## 6. Core Infrastructure in k3s

### 6.1 Create Your Namespace

```bash
kubectl create namespace pokehub
kubectl create namespace argocd

# Verify
kubectl get namespaces
```

A namespace is like a folder. Everything you create for PokeHub goes in `pokehub`. ArgoCD goes in `argocd`.

### 6.2 Create the Image Pull Secret

k3s needs credentials to pull your private images from ghcr.io.

```bash
kubectl create secret docker-registry ghcr-secret \
  --namespace pokehub \
  --docker-server=ghcr.io \
  --docker-username=YOUR_GITHUB_USERNAME \
  --docker-password=YOUR_GITHUB_PAT \
  --docker-email=YOUR_EMAIL

# YOUR_GITHUB_PAT: a Personal Access Token with read:packages scope
# Create one at: GitHub → Settings → Developer Settings → Personal access tokens
```

### 6.3 Create Application Secrets

Never commit secrets to Git. Create them directly in the cluster:

```bash
kubectl create secret generic pokehub-secrets \
  --namespace pokehub \
  --from-literal=jwt-secret="your-super-secret-jwt-key-here" \
  --from-literal=postgres-password="your-postgres-password" \
  --from-literal=postgres-url="postgresql://pokehub:your-postgres-password@postgres-svc:5432/pokehub"

# These are referenced by name in your Helm chart templates
```

---

## 7. Your Helm Chart

Create this directory structure in your repo:

```
helm/
├── Chart.yaml
├── values.yaml
└── templates/
    ├── _helpers.tpl
    ├── namespace.yaml         (optional, or create manually)
    ├── configmap.yaml
    ├── api-deployment.yaml
    ├── api-service.yaml
    ├── ui-deployment.yaml
    ├── ui-service.yaml
    ├── postgres-statefulset.yaml
    ├── postgres-service.yaml
    ├── redis-statefulset.yaml
    ├── redis-service.yaml
    └── ingress.yaml
```

Create all files in one command:

```bash
mkdir -p helm/templates && touch helm/{Chart.yaml,values.yaml} helm/templates/{_helpers.tpl,api-deployment.yaml,api-service.yaml,ui-deployment.yaml,ui-service.yaml,postgres-statefulset.yaml,postgres-service.yaml,redis-statefulset.yaml,redis-service.yaml,ingress.yaml}
```

### 7.1 Chart.yaml

```yaml
# helm/Chart.yaml
apiVersion: v2
name: pokehub
description: PokeHub Pokemon TCG Collection Manager
type: application
version: 0.1.0        # chart version — bump when you change the chart
appVersion: "1.0.0"   # your app version — informational only
```

### 7.2 values.yaml

This file contains all your variables. GitHub Actions will update `api.image.tag` and `ui.image.tag` on every deploy.

```yaml
# helm/values.yaml

# ── Images ──────────────────────────────────────────
api:
  image:
    repository: ghcr.io/YOUR_GITHUB_USERNAME/pokehub-api
    tag: "latest"       # GitHub Actions replaces this with the git SHA
    pullPolicy: Always
  replicas: 1
  resources:
    requests:
      memory: "128Mi"
      cpu: "100m"
    limits:
      memory: "256Mi"
      cpu: "500m"
  port: 3000

ui:
  image:
    repository: ghcr.io/YOUR_GITHUB_USERNAME/pokehub-ui
    tag: "latest"
    pullPolicy: Always
  replicas: 1
  resources:
    requests:
      memory: "64Mi"
      cpu: "50m"
    limits:
      memory: "128Mi"
      cpu: "250m"
  port: 4000

# ── Postgres ─────────────────────────────────────────
postgres:
  image: postgres:16-alpine
  database: pokehub
  user: pokehub
  storage: 5Gi          # PVC size
  resources:
    requests:
      memory: "128Mi"
      cpu: "100m"
    limits:
      memory: "256Mi"
      cpu: "500m"

# ── Redis ────────────────────────────────────────────
redis:
  image: redis:7-alpine
  storage: 1Gi
  resources:
    requests:
      memory: "32Mi"
      cpu: "50m"
    limits:
      memory: "64Mi"
      cpu: "100m"

# ── Ingress ──────────────────────────────────────────
ingress:
  enabled: true
  # No domain yet — Traefik will serve on the VPS IP
  # When you get a domain, set this:
  # host: pokehub.yourdomain.com

# ── Image Pull Secret ────────────────────────────────
imagePullSecrets:
  - name: ghcr-secret
```

### 7.3 templates/_helpers.tpl

Helper template that generates consistent labels:

```yaml
{{- define "pokehub.labels" -}}
app.kubernetes.io/name: {{ .Chart.Name }}
app.kubernetes.io/version: {{ .Chart.AppVersion }}
{{- end }}
```

### 7.4 templates/api-deployment.yaml

```yaml
# helm/templates/api-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: api
  namespace: pokehub
  labels:
    {{- include "pokehub.labels" . | nindent 4 }}
    app: api
spec:
  replicas: {{ .Values.api.replicas }}
  selector:
    matchLabels:
      app: api
  template:
    metadata:
      labels:
        app: api
    spec:
      imagePullSecrets:
        {{- toYaml .Values.imagePullSecrets | nindent 8 }}
      containers:
      - name: api
        image: "{{ .Values.api.image.repository }}:{{ .Values.api.image.tag }}"
        imagePullPolicy: {{ .Values.api.image.pullPolicy }}
        ports:
        - containerPort: {{ .Values.api.port }}
        env:
        - name: NODE_ENV
          value: "production"
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: pokehub-secrets
              key: jwt-secret
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: pokehub-secrets
              key: postgres-url
        - name: REDIS_URL
          value: "redis://redis-svc:6379"
        - name: PORT
          value: "{{ .Values.api.port }}"
        resources:
          {{- toYaml .Values.api.resources | nindent 10 }}
        livenessProbe:
          httpGet:
            path: /health
            port: {{ .Values.api.port }}
          initialDelaySeconds: 10
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: {{ .Values.api.port }}
          initialDelaySeconds: 5
          periodSeconds: 5
```

### 7.5 templates/api-service.yaml

```yaml
# helm/templates/api-service.yaml
apiVersion: v1
kind: Service
metadata:
  name: api-svc
  namespace: pokehub
spec:
  selector:
    app: api             # routes to Pods with label app=api
  ports:
  - port: 3000
    targetPort: 3000
  type: ClusterIP        # internal only
```

### 7.6 templates/ui-deployment.yaml

```yaml
# helm/templates/ui-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ui
  namespace: pokehub
  labels:
    {{- include "pokehub.labels" . | nindent 4 }}
    app: ui
spec:
  replicas: {{ .Values.ui.replicas }}
  selector:
    matchLabels:
      app: ui
  template:
    metadata:
      labels:
        app: ui
    spec:
      imagePullSecrets:
        {{- toYaml .Values.imagePullSecrets | nindent 8 }}
      containers:
      - name: ui
        image: "{{ .Values.ui.image.repository }}:{{ .Values.ui.image.tag }}"
        imagePullPolicy: {{ .Values.ui.image.pullPolicy }}
        ports:
        - containerPort: {{ .Values.ui.port }}
        env:
        - name: API_BASE_URL
          value: "http://api-svc:3000"   # Next.js SSR talks to api Service
        - name: PORT
          value: "{{ .Values.ui.port }}"
        resources:
          {{- toYaml .Values.ui.resources | nindent 10 }}
```

### 7.7 templates/ui-service.yaml

```yaml
# helm/templates/ui-service.yaml
apiVersion: v1
kind: Service
metadata:
  name: ui-svc
  namespace: pokehub
spec:
  selector:
    app: ui
  ports:
  - port: 4000
    targetPort: 4000
  type: ClusterIP
```

### 7.8 templates/postgres-statefulset.yaml

```yaml
# helm/templates/postgres-statefulset.yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
  namespace: pokehub
spec:
  serviceName: "postgres-svc"   # must match the headless Service below
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: {{ .Values.postgres.image }}
        ports:
        - containerPort: 5432
        env:
        - name: POSTGRES_DB
          value: {{ .Values.postgres.database }}
        - name: POSTGRES_USER
          value: {{ .Values.postgres.user }}
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: pokehub-secrets
              key: postgres-password
        - name: PGDATA
          value: /var/lib/postgresql/data/pgdata   # avoid permission issues
        resources:
          {{- toYaml .Values.postgres.resources | nindent 10 }}
        volumeMounts:
        - name: postgres-data
          mountPath: /var/lib/postgresql/data
  # volumeClaimTemplates creates a PVC PER Pod (not shared)
  volumeClaimTemplates:
  - metadata:
      name: postgres-data
    spec:
      accessModes: ["ReadWriteOnce"]
      storageClassName: local-path    # k3s built-in provisioner
      resources:
        requests:
          storage: {{ .Values.postgres.storage }}
```

### 7.9 templates/postgres-service.yaml

```yaml
# helm/templates/postgres-service.yaml
# Headless Service (clusterIP: None) — StatefulSets need this
# for stable DNS: postgres-0.postgres-svc.pokehub.svc.cluster.local
apiVersion: v1
kind: Service
metadata:
  name: postgres-svc
  namespace: pokehub
spec:
  clusterIP: None      # headless
  selector:
    app: postgres
  ports:
  - port: 5432
    targetPort: 5432
```

### 7.10 templates/redis-statefulset.yaml

```yaml
# helm/templates/redis-statefulset.yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: redis
  namespace: pokehub
spec:
  serviceName: "redis-svc"
  replicas: 1
  selector:
    matchLabels:
      app: redis
  template:
    metadata:
      labels:
        app: redis
    spec:
      containers:
      - name: redis
        image: {{ .Values.redis.image }}
        ports:
        - containerPort: 6379
        resources:
          {{- toYaml .Values.redis.resources | nindent 10 }}
        volumeMounts:
        - name: redis-data
          mountPath: /data
  volumeClaimTemplates:
  - metadata:
      name: redis-data
    spec:
      accessModes: ["ReadWriteOnce"]
      storageClassName: local-path
      resources:
        requests:
          storage: {{ .Values.redis.storage }}
```

### 7.11 templates/redis-service.yaml

```yaml
# helm/templates/redis-service.yaml
apiVersion: v1
kind: Service
metadata:
  name: redis-svc
  namespace: pokehub
spec:
  clusterIP: None
  selector:
    app: redis
  ports:
  - port: 6379
    targetPort: 6379
```

### 7.12 templates/ingress.yaml

Traefik reads this to know how to route external traffic:

```yaml
# helm/templates/ingress.yaml
{{- if .Values.ingress.enabled }}
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: pokehub-ingress
  namespace: pokehub
  annotations:
    # Tell Traefik to use its default entrypoint
    traefik.ingress.kubernetes.io/router.entrypoints: web
spec:
  rules:
  - http:
      paths:
      # API routes
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: api-svc
            port:
              number: 3000
      - path: /auth
        pathType: Prefix
        backend:
          service:
            name: api-svc
            port:
              number: 3000
      - path: /health
        pathType: Prefix
        backend:
          service:
            name: api-svc
            port:
              number: 3000
      # Everything else goes to the UI
      - path: /
        pathType: Prefix
        backend:
          service:
            name: ui-svc
            port:
              number: 4000
{{- end }}
```

### 7.13 How to Test Your Helm Chart Locally

```bash
# Lint for syntax errors
helm lint helm/

# Render templates to see the generated YAML (dry-run)
helm template pokehub helm/ --namespace pokehub

# Install to cluster (manual first deploy)
helm install pokehub helm/ --namespace pokehub

# Upgrade after changes
helm upgrade pokehub helm/ --namespace pokehub

# ArgoCD will run the upgrade automatically after the first manual install
```

---

## 8. Install and Configure ArgoCD

### 8.1 What GitOps Means in Practice

Without GitOps:
```
Developer → kubectl apply -f ... → cluster changes
(no audit trail, easy to drift from what's in Git)
```

With GitOps (ArgoCD):
```
Developer → git push → ArgoCD detects → ArgoCD applies
(Git IS the audit trail; cluster always matches Git)
```

### 8.2 Install ArgoCD

```bash
# Install ArgoCD into the argocd namespace
kubectl apply -n argocd -f \
  https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Watch pods come up (takes 1-2 minutes)
kubectl get pods -n argocd -w

# You should see these all reach Running:
# argocd-server
# argocd-repo-server
# argocd-application-controller
# argocd-redis
# argocd-dex-server
# argocd-notifications-controller
# argocd-applicationset-controller
```

### 8.3 Access the ArgoCD UI

ArgoCD's server is not exposed publicly by default. Use port-forwarding from your laptop:

```bash
# Forward ArgoCD's port to your laptop
kubectl port-forward svc/argocd-server -n argocd 8080:443

# Open https://localhost:8080 in your browser
# Accept the self-signed cert warning
```

Get the initial admin password:
```bash
kubectl -n argocd get secret argocd-initial-admin-secret \
  -o jsonpath="{.data.password}" | base64 -d && echo

# Username: admin
# Password: (the output above)
```

Change the password immediately after first login via the UI.

### 8.4 Install the ArgoCD CLI (optional but useful)

```bash
# macOS
brew install argocd

# Linux
curl -sSL -o argocd https://github.com/argoproj/argo-cd/releases/latest/download/argocd-linux-amd64
chmod +x argocd && sudo mv argocd /usr/local/bin/

# Login
argocd login localhost:8080 --username admin --password YOUR_PASSWORD
```

### 8.5 Connect ArgoCD to Your GitHub Repo

If your repo is public:
- ArgoCD can access it without credentials. Skip to 8.6.

If your repo is private:
```bash
# Via CLI
argocd repo add https://github.com/YOUR_USERNAME/poke-hub \
  --username YOUR_GITHUB_USERNAME \
  --password YOUR_GITHUB_PAT

# Or via UI: Settings → Repositories → + Connect Repo
```

### 8.6 Create the ArgoCD Application

This is the core object that tells ArgoCD what to watch and where to deploy:

```yaml
# argocd/application.yaml
# Commit this to your repo so ArgoCD itself is managed as code
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: pokehub
  namespace: argocd
spec:
  project: default

  # Where is the source of truth?
  source:
    repoURL: https://github.com/YOUR_USERNAME/poke-hub
    targetRevision: main          # watch the main branch
    path: helm                    # the Helm chart is in the helm/ directory

  # Where should it deploy to?
  destination:
    server: https://kubernetes.default.svc   # the local cluster
    namespace: pokehub

  syncPolicy:
    automated:
      prune: true       # delete resources removed from Git
      selfHeal: true    # revert manual kubectl changes (Git wins)
    syncOptions:
    - CreateNamespace=true
```

Apply it:
```bash
kubectl apply -f argocd/application.yaml

# OR via CLI:
argocd app create pokehub \
  --repo https://github.com/YOUR_USERNAME/poke-hub \
  --path helm \
  --dest-server https://kubernetes.default.svc \
  --dest-namespace pokehub \
  --sync-policy automated \
  --auto-prune \
  --self-heal
```

After applying, open the ArgoCD UI. You'll see the `pokehub` app appear, showing a tree of all your k8s resources and their sync status.

---

## 9. GitHub Actions CI Pipeline

### 9.1 How it Works

The pipeline has two jobs:

**Job 1: `test`** — runs on every PR and every push to main
- Installs Bun
- Runs `bun run test` in `server/` and `ui/`
- Runs `bun run lint`

**Job 2: `deploy`** — runs only when a PR is merged to main AND tests pass
- Builds Docker images for `api` and `ui`
- Pushes them to ghcr.io with the git SHA as the tag
- Updates `helm/values.yaml` with the new image tags
- Commits and pushes the values change back to main
- ArgoCD detects the values change and syncs automatically

### 9.2 Dockerfiles

You need Dockerfiles for the api and ui. Add them if they don't exist:

```dockerfile
# server/Dockerfile
FROM oven/bun:1-alpine AS base
WORKDIR /app

# Install dependencies
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile --production

# Copy source
COPY src/ ./src/

EXPOSE 3000
CMD ["bun", "run", "src/index.ts"]
```

```dockerfile
# ui/Dockerfile
FROM oven/bun:1-alpine AS build
WORKDIR /app

COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

COPY . .
RUN bun run build        # outputs to build/

FROM node:20-alpine AS runtime
WORKDIR /app
COPY --from=build /app/build ./build
COPY --from=build /app/package.json .

ENV NODE_ENV=production
EXPOSE 4000
CMD ["node", "build"]
```

### 9.3 GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: CI / Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  REGISTRY: ghcr.io
  API_IMAGE: ghcr.io/${{ github.repository_owner }}/pokehub-api
  UI_IMAGE:  ghcr.io/${{ github.repository_owner }}/pokehub-ui

jobs:
  # ── Job 1: Tests ──────────────────────────────────────────────────
  test:
    name: Test
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v4

    - uses: oven-sh/setup-bun@v2
      with:
        bun-version: latest

    - name: Install server deps
      run: bun install --frozen-lockfile
      working-directory: server

    - name: Install ui deps
      run: bun install --frozen-lockfile
      working-directory: ui

    - name: Lint
      run: bun run lint
      # runs from repo root — see CLAUDE.md

    - name: Test server
      run: bun run test
      working-directory: server

    - name: Test ui
      run: bun run test
      working-directory: ui

  # ── Job 2: Build & Deploy ─────────────────────────────────────────
  deploy:
    name: Build & Deploy
    runs-on: ubuntu-latest
    needs: test                          # only runs if test passes
    if: github.ref == 'refs/heads/main'  # only on main branch
    permissions:
      contents: write    # to push values.yaml back to the repo
      packages: write    # to push images to ghcr.io

    steps:
    - uses: actions/checkout@v4
      with:
        token: ${{ secrets.GITHUB_TOKEN }}
        # fetch-depth: 0 not needed since we push to same branch

    - name: Log in to GitHub Container Registry
      uses: docker/login-action@v3
      with:
        registry: ghcr.io
        username: ${{ github.actor }}
        password: ${{ secrets.GITHUB_TOKEN }}

    - name: Set image tag (git SHA)
      id: tag
      run: echo "TAG=${GITHUB_SHA::8}" >> $GITHUB_OUTPUT
      # Uses first 8 chars of commit SHA, e.g. "a1b2c3d4"

    - name: Build and push API image
      uses: docker/build-push-action@v5
      with:
        context: ./server
        push: true
        tags: |
          ${{ env.API_IMAGE }}:${{ steps.tag.outputs.TAG }}
          ${{ env.API_IMAGE }}:latest

    - name: Build and push UI image
      uses: docker/build-push-action@v5
      with:
        context: ./ui
        push: true
        tags: |
          ${{ env.UI_IMAGE }}:${{ steps.tag.outputs.TAG }}
          ${{ env.UI_IMAGE }}:latest

    - name: Update image tags in Helm values
      run: |
        # Install yq (YAML processor)
        sudo wget -qO /usr/local/bin/yq \
          https://github.com/mikefarah/yq/releases/latest/download/yq_linux_amd64
        sudo chmod +x /usr/local/bin/yq

        TAG=${{ steps.tag.outputs.TAG }}

        yq e ".api.image.tag = \"$TAG\""  -i helm/values.yaml
        yq e ".ui.image.tag  = \"$TAG\""  -i helm/values.yaml

    - name: Commit and push updated values
      run: |
        git config user.name  "github-actions[bot]"
        git config user.email "github-actions[bot]@users.noreply.github.com"
        git add helm/values.yaml
        git commit -m "chore: deploy ${{ steps.tag.outputs.TAG }} [skip ci]"
        git push
        # [skip ci] prevents this commit from triggering another workflow run
```

### 9.4 Required GitHub Secrets

Go to your repo → Settings → Secrets and variables → Actions:

| Secret | Value |
|--------|-------|
| `GITHUB_TOKEN` | Auto-provided by GitHub Actions (no setup needed) |

That's it. `GITHUB_TOKEN` has `packages:write` permission (for pushing images) and `contents:write` (for committing values.yaml) when you set the `permissions:` block in the workflow.

---

## 10. The Full GitOps Flow End-to-End

Here is exactly what happens when you merge a PR:

```
1. You merge PR #42 to main
   └─ GitHub triggers .github/workflows/deploy.yml

2. GitHub Actions: test job
   ├─ bun install (server + ui)
   ├─ bun run lint  → must pass
   ├─ bun run test (server) → must pass
   └─ bun run test (ui)    → must pass

3. GitHub Actions: deploy job (only if step 2 passed)
   ├─ docker build ./server → pokehub-api:a1b2c3d4
   ├─ docker push ghcr.io/.../pokehub-api:a1b2c3d4
   ├─ docker build ./ui    → pokehub-ui:a1b2c3d4
   ├─ docker push ghcr.io/.../pokehub-ui:a1b2c3d4
   ├─ yq: set api.image.tag = "a1b2c3d4" in helm/values.yaml
   ├─ yq: set ui.image.tag  = "a1b2c3d4" in helm/values.yaml
   └─ git commit + push "chore: deploy a1b2c3d4 [skip ci]"

4. ArgoCD (polling main branch every 3 minutes by default)
   ├─ Detects helm/values.yaml changed
   ├─ Renders Helm chart with new values
   ├─ Diffs rendered YAML vs live cluster state
   └─ Applies the diff:
       ├─ Updates api Deployment → image: pokehub-api:a1b2c3d4
       └─ Updates ui Deployment → image: pokehub-ui:a1b2c3d4

5. Kubernetes (rolling update)
   ├─ Starts new api Pod with new image (waits for readinessProbe)
   ├─ Old api Pod continues serving traffic
   ├─ New Pod becomes Ready → old Pod terminated
   └─ Same for ui Pod
   
Total time from merge to live: ~4-6 minutes
(2 min build + 3 min ArgoCD poll interval + 30s rolling update)
```

To reduce the ArgoCD poll interval to 1 minute (more responsive):
```bash
# In the ArgoCD configmap
kubectl -n argocd patch configmap argocd-cm \
  --type merge \
  -p '{"data":{"timeout.reconciliation":"60s"}}'
```

---

## 11. Useful kubectl Commands for Daily Use

```bash
# ── Cluster overview ──────────────────────────────────
kubectl get nodes
kubectl get all -n pokehub                # everything in your namespace
kubectl top nodes                          # CPU/RAM usage (needs metrics-server)
kubectl top pods -n pokehub

# ── Pod inspection ───────────────────────────────────
kubectl get pods -n pokehub
kubectl describe pod <pod-name> -n pokehub  # events, resource limits, volumes
kubectl logs <pod-name> -n pokehub          # stdout logs
kubectl logs <pod-name> -n pokehub -f       # follow (tail -f equivalent)
kubectl logs <pod-name> -n pokehub --previous  # logs from crashed container

# ── Exec into a container ────────────────────────────
kubectl exec -it <pod-name> -n pokehub -- /bin/sh

# ── Deployments ──────────────────────────────────────
kubectl rollout status deployment/api -n pokehub
kubectl rollout history deployment/api -n pokehub
kubectl rollout undo deployment/api -n pokehub   # roll back one version

# ── Services and Ingress ─────────────────────────────
kubectl get svc -n pokehub
kubectl get ingress -n pokehub
kubectl describe ingress pokehub-ingress -n pokehub

# ── Secrets and ConfigMaps ───────────────────────────
kubectl get secrets -n pokehub
kubectl get secret pokehub-secrets -n pokehub -o yaml  # shows base64 values
kubectl get configmaps -n pokehub

# ── Storage ──────────────────────────────────────────
kubectl get pvc -n pokehub    # PersistentVolumeClaims
kubectl get pv                 # PersistentVolumes (cluster-wide)

# ── Helm ─────────────────────────────────────────────
helm list -n pokehub            # installed releases
helm history pokehub -n pokehub # revision history
helm rollback pokehub 1 -n pokehub  # rollback to revision 1

# ── ArgoCD ───────────────────────────────────────────
argocd app list
argocd app get pokehub
argocd app sync pokehub          # force sync now (don't wait for poll)
argocd app history pokehub
```

---

## 12. Resource Budget and Tuning

Your server has 4 GB RAM. Here's the expected usage:

| Component | RAM (idle) |
|---|---|
| Ubuntu OS | ~300 MB |
| k3s + containerd | ~400 MB |
| Traefik | ~50 MB |
| CoreDNS + other system pods | ~100 MB |
| ArgoCD (all 7 pods) | ~650 MB |
| Postgres StatefulSet | ~150 MB |
| Redis StatefulSet | ~30 MB |
| API Deployment | ~100 MB |
| UI Deployment | ~80 MB |
| **Total** | **~1,860 MB** |
| **Headroom** | **~2,140 MB** |

You have comfortable headroom. The `resources.requests` and `resources.limits` in `values.yaml` are conservative for a personal project — adjust up if needed.

### Reducing ArgoCD Memory Footprint (Optional)

If you want to reclaim ~200 MB, disable the unused ArgoCD components:

```bash
# Disable dex (SSO/OAuth — not needed for personal use)
kubectl scale deployment argocd-dex-server -n argocd --replicas=0

# Disable applicationset controller (for multi-cluster — not needed)
kubectl scale deployment argocd-applicationset-controller -n argocd --replicas=0

# Disable notifications (optional)
kubectl scale deployment argocd-notifications-controller -n argocd --replicas=0
```

### Install metrics-server (for `kubectl top`)

k3s doesn't include metrics-server by default:
```bash
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

# After ~60 seconds:
kubectl top nodes
kubectl top pods -n pokehub
```

---

## Next Steps (When You're Ready)

1. **Add a domain + TLS:** Point your domain at the VPS IP → install cert-manager → add a `Certificate` resource → update the Ingress with `tls:` block.
2. **Sealed Secrets:** Encrypt your k8s Secrets so they're safe to commit to Git.
3. **Multi-replica:** Increase `replicas: 2` for the api Deployment for zero-downtime deploys. (Postgres stays at 1 unless you configure replication.)
4. **Hetzner CSI Driver:** For dynamic volume provisioning using Hetzner's API (allows resizing volumes without stopping pods).
5. **Prometheus + Grafana:** Add monitoring via the `kube-prometheus-stack` Helm chart.

---

*Guide written for PokeHub · k3s v1.x · Helm v3 · ArgoCD v2.x · Ubuntu 22.04*
