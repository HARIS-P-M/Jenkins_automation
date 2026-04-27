pipeline {
    agent any

    parameters {
        string(name: 'EC2_HOST', defaultValue: '', description: 'EC2 Instance IP')
        string(name: 'EC2_SSH_KEY', defaultValue: '', description: 'EC2 Private Key (.pem)')
        string(name: 'MONGO_URI', defaultValue: '', description: 'MongoDB connection string')
        string(name: 'JWT_SECRET', defaultValue: '', description: 'JWT Secret')
        string(name: 'FRONTEND_ORIGIN', defaultValue: '', description: 'Frontend Origin')
        string(name: 'EMAIL_USER', defaultValue: '', description: 'Email User')
        string(name: 'EMAIL_PASS', defaultValue: '', description: 'Email Password')
        string(name: 'TWILIO_ACCOUNT_SID', defaultValue: '', description: 'Twilio SID')
        string(name: 'TWILIO_AUTH_TOKEN', defaultValue: '', description: 'Twilio Token')
        string(name: 'TWILIO_PHONE_NUMBER', defaultValue: '', description: 'Twilio Phone')
    }

    environment {
        REGISTRY = "ghcr.io"
        REPO = "haris-p-m/jenkins_automation" 
        TAG = "${env.BUILD_NUMBER}"
        EC2_USER = "ubuntu"
    }

    stages {
        stage('Debug Parameters') {
            steps {
                echo "EC2_HOST: ${params.EC2_HOST}"
                echo "MONGO_URI: ${params.MONGO_URI ? 'SET' : 'EMPTY'}"
            }
        }
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Docker Login') {
            steps {
                withCredentials([usernamePassword(credentialsId: 'github-token', usernameVariable: 'GITHUB_USER', passwordVariable: 'GITHUB_TOKEN')]) {
                    sh 'echo $GITHUB_TOKEN | docker login ghcr.io -u $GITHUB_USER --password-stdin'
                }
            }
        }

        stage('Build & Push Images') {
            steps {
                sh "docker build -t ${REGISTRY}/${REPO}/contact-manager-frontend:latest -t ${REGISTRY}/${REPO}/contact-manager-frontend:${TAG} ."
                sh "docker push ${REGISTRY}/${REPO}/contact-manager-frontend:latest"
                sh "docker push ${REGISTRY}/${REPO}/contact-manager-frontend:${TAG}"

                sh "docker build -t ${REGISTRY}/${REPO}/contact-manager-backend:latest -t ${REGISTRY}/${REPO}/contact-manager-backend:${TAG} ./backend"
                sh "docker push ${REGISTRY}/${REPO}/contact-manager-backend:latest"
                sh "docker push ${REGISTRY}/${REPO}/contact-manager-backend:${TAG}"
            }
        }

        stage('Prepare Manifests') {
            steps {
                sh "sed -i 's|ghcr.io/YOUR_REPO/contact-manager-frontend:latest|${REGISTRY}/${REPO}/contact-manager-frontend:${TAG}|g' k8s/frontend.yaml"
                sh "sed -i 's|ghcr.io/YOUR_REPO/contact-manager-backend:latest|${REGISTRY}/${REPO}/contact-manager-backend:${TAG}|g' k8s/backend.yaml"
            }
        }

        stage('Deploy to EC2 K3s') {
            steps {
                script {
                    // Create a temporary SSH key file from the parameter
                    writeFile file: 'ec2_key.pem', text: params.EC2_SSH_KEY
                    sh 'chmod 600 ec2_key.pem'

                    try {
                        sh "ssh -o StrictHostKeyChecking=no -i ec2_key.pem ${env.EC2_USER}@${params.EC2_HOST} 'mkdir -p ~/contact-manager-k8s'"
                        sh "scp -o StrictHostKeyChecking=no -i ec2_key.pem -r k8s/ ${env.EC2_USER}@${params.EC2_HOST}:~/contact-manager-k8s/"

                        sh """
                        ssh -o StrictHostKeyChecking=no -i ec2_key.pem ${env.EC2_USER}@${params.EC2_HOST} "
                            sudo kubectl create secret docker-registry ghcr-secret --docker-server=ghcr.io --docker-username=haris-p-m --docker-password=\$GITHUB_TOKEN --docker-email=github-actions@github.com -n default --dry-run=client -o yaml | sudo kubectl apply -f -
                            
                            sudo kubectl create secret generic backend-secrets \\
                              --from-literal=MONGO_URI='${params.MONGO_URI}' \\
                              --from-literal=JWT_SECRET='${params.JWT_SECRET}' \\
                              --from-literal=FRONTEND_ORIGIN='${params.FRONTEND_ORIGIN}' \\
                              --from-literal=EMAIL_USER='${params.EMAIL_USER}' \\
                              --from-literal=EMAIL_PASS='${params.EMAIL_PASS}' \\
                              --from-literal=TWILIO_ACCOUNT_SID='${params.TWILIO_ACCOUNT_SID}' \\
                              --from-literal=TWILIO_AUTH_TOKEN='${params.TWILIO_AUTH_TOKEN}' \\
                              --from-literal=TWILIO_PHONE_NUMBER='${params.TWILIO_PHONE_NUMBER}' \\
                              --dry-run=client -o yaml | sudo kubectl apply -f -
                              
                            sudo kubectl apply -f ~/contact-manager-k8s/k8s/
                            sudo kubectl rollout status deployment/frontend --timeout=60s || true
                            sudo kubectl rollout status deployment/backend --timeout=60s || true
                        "
                        """
                    } finally {
                        // ALWAYS delete the key file even if the build fails
                        sh 'rm -f ec2_key.pem'
                    }
                }
            }
        }
    }
}
