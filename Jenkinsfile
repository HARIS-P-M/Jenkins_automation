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
