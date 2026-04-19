def runStep(String unixCmd, String windowsCmd = null) {
    if (isUnix()) {
        sh unixCmd
    } else {
        bat(windowsCmd ?: unixCmd)
    }
}

pipeline {
    agent any

    triggers {
        githubPush()
    }

    options {
        timestamps()
        disableConcurrentBuilds()
    }

    environment {
        COMPOSE_PROJECT = "contact-manager-${env.BUILD_NUMBER}"
        DEPLOY_PATH = '/opt/contact-manager'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Docker Prerequisites') {
            steps {
                script {
                    runStep(
                        'docker --version && docker compose version',
                        'docker --version && docker compose version'
                    )
                }
            }
        }

        stage('Prepare Environment') {
            steps {
                script {
                    runStep(
                        'cp .env.example .env || true && cp backend/.env.example backend/.env || true',
                        'copy .env.example .env && copy backend\\.env.example backend\\.env'
                    )
                }
            }
        }

        stage('Build Images') {
            steps {
                script {
                    runStep(
                        "docker compose -p ${env.COMPOSE_PROJECT} build",
                        'docker compose -p %COMPOSE_PROJECT% build'
                    )
                }
            }
        }

        stage('Start Stack') {
            steps {
                script {
                    runStep(
                        "docker compose -p ${env.COMPOSE_PROJECT} up -d",
                        'docker compose -p %COMPOSE_PROJECT% up -d'
                    )
                }
            }
        }

        stage('Smoke Test') {
            steps {
                script {
                    runStep(
                        'sleep 15',
                        'timeout /t 15 /nobreak > NUL'
                    )

                    runStep(
                        'curl -fsS http://localhost:4000/api/health',
                        'powershell -NoProfile -Command "Invoke-RestMethod -Uri http://localhost:4000/api/health | Out-Null"'
                    )

                    runStep(
                        'curl -fsS http://localhost:3000 > /dev/null',
                        'powershell -NoProfile -Command "Invoke-WebRequest -Uri http://localhost:3000 | Out-Null"'
                    )
                }
            }
        }

        stage('Deploy to VM') {
            when {
                branch 'main'
            }
            steps {
                script {
                    if (!isUnix()) {
                        error('Deploy stage requires a Linux agent with ssh/scp/tar.')
                    }

                    if (!env.DEPLOY_HOST || !env.DEPLOY_USER) {
                        error('Missing DEPLOY_HOST or DEPLOY_USER environment values in Jenkins job configuration.')
                    }

                    sh '''#!/usr/bin/env bash
set -e
tar -czf release.tgz \
  --exclude=.git \
  --exclude=node_modules \
  --exclude=backend/node_modules \
  --exclude=dist \
  .
chmod +x scripts/deploy-remote.sh
'''

                    sshagent(credentials: ['deploy-ssh-key']) {
                        sh './scripts/deploy-remote.sh'
                    }
                }
            }
        }
    }

    post {
        always {
            script {
                try {
                    runStep(
                        "docker compose -p ${env.COMPOSE_PROJECT} logs --no-color > docker-compose.log",
                        'docker compose -p %COMPOSE_PROJECT% logs --no-color > docker-compose.log'
                    )
                } catch (ignored) {
                    echo 'Could not capture docker compose logs.'
                }

                try {
                    runStep(
                        "docker compose -p ${env.COMPOSE_PROJECT} down -v --remove-orphans",
                        'docker compose -p %COMPOSE_PROJECT% down -v --remove-orphans'
                    )
                } catch (ignored) {
                    echo 'Could not tear down docker compose stack.'
                }
            }

            archiveArtifacts artifacts: 'docker-compose.log', allowEmptyArchive: true
        }
    }
}
