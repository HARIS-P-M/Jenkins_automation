# Containerization and GitHub Actions Automation

This project now uses GitHub Actions and Kubernetes (K3s) for continuous integration and automated deployment.

## 1. Local Docker Compose Workflow

From the project root:

```bash
docker-compose up --build -d
```

Check containers:

```bash
docker-compose ps
```

Open apps:

- Frontend: `http://localhost:-3000` or `80` (depending on local env)
- Backend health: `http://localhost:4000/api/health`

Stop and clean up:

```bash
docker-compose down -v --remove-orphans
```

## 2. Environment Variables

The backend reads env vars from `backend/.env`.

For container runs, `docker-compose.yml` overrides:

- `MONGO_URI=mongodb://mongo:27017/contact_manager`
- `PORT=4000`

Recommended setup for local development is keeping local dev values in `backend/.env` while keeping secrets out of git.

## 3. GitHub Actions Pipeline (CI/CD)

The GitHub Actions workflow `.github/workflows/deploy.yml` executes on every push to the `main` branch.

**Workflow Steps:**
1. Checkout source code.
2. Build the Frontend and Backend Docker images.
3. Push Docker images to GitHub Container Registry (GHCR).
4. Update Kubernetes manifest files (`k8s/frontend.yaml` and `k8s/backend.yaml`) with the new image tags.
5. Securely copy the k8s manifests to the remote K3s EC2 instance.
6. Apply the Kubernetes manifests and wait for the new images to roll out.

### GitHub Prerequisites

You must set up the following secrets in your GitHub repository (**Settings > Secrets and variables > Actions**):

- `VITE_GOOGLE_API_KEY`: API Key needed for the frontend build process.
- `EC2_HOST`: The public IP or DNS of the EC2 instance hosting Kubernetes/K3s.
- `EC2_SSH_KEY`: The PEM Private Key used to SSH into the EC2 instance securely.

Your repository should be configured so that `github.actor` has permission to write packages to `ghcr.io` for your user or organization.

## 4. Production Deployment (K3s)

The `k8s` directory contains standard Kubernetes resources that define the required cluster state:

- `mongo.yaml`: A MongoDB persistent deployment with a `PersistentVolumeClaim`.
- `backend.yaml`: The Node.js application backend mapping port `4000`.
- `frontend.yaml`: The NGINX reverse-proxy web frontend deployed as a `LoadBalancer` mapping port `80`.

Because K3s contains a built-in Traefik load balancer, deploying a service of type `LoadBalancer` automatically exposes it without needing a complex set of NGINX Ingress rules out of the box for standard TCP port mapping. You can add an `Ingress` object if domain-based routing is needed.

### Checking Deployment Health on the Server

You can SSH into your server:

```bash
ssh -i your-key.pem ubuntu@your-ec2-ip
```

Then check the running K3s pods:

```bash
kubectl get pods
```

Check logs for the backend:

```bash
kubectl logs deployment/backend -f
```

## 5. First Deployment Checklist

1. Setup the necessary Action Secrets in the GitHub Repsitory (`EC2_HOST`, `EC2_SSH_KEY`, `VITE_GOOGLE_API_KEY`).
2. Make sure the target server has `k3s` installed and running, and the SSH User has permission to run `kubectl`.
3. If packages are to be kept private in GHCR, you must create a Kubernetes secret `ghcr-secret` with your credentials and uncomment the `imagePullSecrets` lines inside the `backend.yaml` and `frontend.yaml` files.
4. Push code to the `main` branch to trigger an automated deployment to K3s!
