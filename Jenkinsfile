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
        EC2_HOST = "107.22.109.219"
    }

    options {
        skipDefaultCheckout()
    }

    stages {
        stage('Clean & Checkout') {
            steps {
                deleteDir()
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
                sh """
                    docker build -t ${REGISTRY}/${REPO}/contact-manager-frontend:latest -t ${REGISTRY}/${REPO}/contact-manager-frontend:${TAG} .
                    for i in 1 2 3; do
                        docker push ${REGISTRY}/${REPO}/contact-manager-frontend:latest && \
                        docker push ${REGISTRY}/${REPO}/contact-manager-frontend:${TAG} && break
                        echo "Push attempt \$i failed, retrying in 10s..."
                        sleep 10
                    done

                    docker build -t ${REGISTRY}/${REPO}/contact-manager-backend:latest -t ${REGISTRY}/${REPO}/contact-manager-backend:${TAG} ./backend
                    for i in 1 2 3; do
                        docker push ${REGISTRY}/${REPO}/contact-manager-backend:latest && \
                        docker push ${REGISTRY}/${REPO}/contact-manager-backend:${TAG} && break
                        echo "Push attempt \$i failed, retrying in 10s..."
                        sleep 10
                    done
                """
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
                    echo "DEBUG: Deploying to: '${env.EC2_HOST}'"
                    def host = env.EC2_HOST
                    def user = env.EC2_USER

                    withCredentials([
                        sshUserPrivateKey(credentialsId: 'ec2-deploy-key', keyFileVariable: 'SSH_KEY'),
                        usernamePassword(credentialsId: 'github-token', usernameVariable: 'GITHUB_USER', passwordVariable: 'GITHUB_TOKEN')
                    ]) {
                        // Convert key to classic PEM format — Jenkins container's older libcrypto
                        // cannot load the newer OpenSSH key format (-----BEGIN OPENSSH PRIVATE KEY-----)
                        sh '''
                            tr -d '\r' < $SSH_KEY > /tmp/ec2_deploy.pem
                            chmod 600 /tmp/ec2_deploy.pem
                        '''
                        sh """
                            ssh -o StrictHostKeyChecking=no -i /tmp/ec2_deploy.pem ${user}@${host} 'mkdir -p ~/contact-manager-k8s'
                            scp -o StrictHostKeyChecking=no -i /tmp/ec2_deploy.pem -r k8s/ ${user}@${host}:~/contact-manager-k8s/
                            ssh -o StrictHostKeyChecking=no -i /tmp/ec2_deploy.pem ${user}@${host} bash << 'REMOTE_EOF'
                                sudo kubectl create secret docker-registry ghcr-secret \\
                                  --docker-server=ghcr.io \\
                                  --docker-username=haris-p-m \\
                                  --docker-password=\$GITHUB_TOKEN \\
                                  --docker-email=github-actions@github.com \\
                                  -n default --dry-run=client -o yaml | sudo kubectl apply -f -

                                sudo kubectl apply -f ~/contact-manager-k8s/k8s/
                                sudo kubectl rollout status deployment/frontend --timeout=60s || true
                                sudo kubectl rollout status deployment/backend --timeout=60s || true
REMOTE_EOF
                            rm -f /tmp/ec2_deploy.pem
                        """
                    }
                }
            }
        }
    }
}
