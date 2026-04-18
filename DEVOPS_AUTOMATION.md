# Containerization and Jenkins Automation

This project now includes:

- Frontend Docker image (`Dockerfile` at repo root, served by Nginx)
- Backend Docker image (`backend/Dockerfile`)
- Full stack orchestration (`docker-compose.yml`) with MongoDB
- Jenkins CI pipeline (`Jenkinsfile`) for build + smoke test

## 1. Local Docker Compose Workflow

From the project root:

```bash
docker compose up --build -d
```

Check containers:

```bash
docker compose ps
```

Open apps:

- Frontend: `http://localhost:3000`
- Backend health: `http://localhost:4000/api/health`

Stop and clean up:

```bash
docker compose down -v --remove-orphans
```

## 2. Environment Variables

The backend reads env vars from `backend/.env`.

For container runs, `docker-compose.yml` overrides:

- `MONGO_URI=mongodb://mongo:27017/contact_manager`
- `PORT=4000`

Recommended setup:

1. Keep local dev values in `backend/.env`.
2. Keep secrets out of git.
3. In Jenkins, inject secret values using Credentials + environment bindings (e.g., JWT/email/Twilio values).

## 3. Jenkins Pipeline (CI)

The `Jenkinsfile` executes:

1. Checkout source
2. Verify Docker and Docker Compose availability
3. Build Docker images
4. Start stack via Docker Compose
5. Run smoke tests against frontend and backend
6. Capture logs and tear down containers

### Jenkins Prerequisites

- Jenkins agent with Docker Engine + Docker Compose v2
- Jenkins user can run Docker commands
- Pipeline job pointed at this repository

### Creating the Pipeline Job

1. In Jenkins, create a new **Pipeline** job.
2. Under **Pipeline Definition**, choose **Pipeline script from SCM**.
3. Select your Git source and branch.
4. Script path: `Jenkinsfile`.
5. Save and run **Build Now**.

## 4. Optional: Push Images to a Registry

If you want CD-ready images, add another Jenkins stage after `Build Images`:

- `docker login` (with Jenkins credentials)
- `docker tag ...`
- `docker push ...`

Then deploy those image tags in your target environment.

## 5. Common Commands

Build only:

```bash
docker compose build
```

See logs:

```bash
docker compose logs -f backend
docker compose logs -f frontend
```

Recreate stack:

```bash
docker compose down -v --remove-orphans
docker compose up --build -d
```

## 6. GitHub Webhook Automation

To trigger Jenkins automatically on every push:

### Jenkins Setup

1. Install/enable plugins:
	- Git plugin
	- GitHub plugin
	- Pipeline plugin
2. Open your Jenkins Pipeline job and ensure the SCM points to your GitHub repository.
3. For classic Pipeline jobs, keep this in `Jenkinsfile`:

```groovy
triggers {
	 githubPush()
}
```

4. In **Manage Jenkins > Configure System > GitHub**, add your GitHub server credentials if your repo is private.

### GitHub Repository Webhook Setup

1. Open your GitHub repo > **Settings > Webhooks > Add webhook**.
2. Set **Payload URL** to:
	- `http://<your-jenkins-host>/github-webhook/`
3. Set **Content type** to `application/json`.
4. Set a **Secret** and use the same secret in Jenkins GitHub webhook configuration.
5. Select **Just the push event** (add pull request events if needed).
6. Save webhook and send a test delivery.

### Validation

1. Push a small commit to the connected branch.
2. Confirm webhook delivery is green in GitHub.
3. Confirm a new Jenkins build starts automatically.

If Jenkins does not trigger:

- Check Jenkins is reachable from GitHub (public URL or tunnel/reverse proxy).
- Verify webhook URL ends with `/github-webhook/`.
- Check Jenkins system logs and webhook delivery response code.
