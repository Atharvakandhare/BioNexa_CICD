pipeline {
    agent {
        kubernetes {
            yaml """
apiVersion: v1
kind: Pod
spec:
  containers:
  - name: node
    image: mirror.gcr.io/library/node:20
    command: ["cat"]
    tty: true
  - name: sonar-scanner
    image: sonarsource/sonar-scanner-cli
    command: ["cat"]
    tty: true
  - name: kubectl
    image: bitnami/kubectl:latest
    command:
      - /bin/sh
      - -c
      - sleep infinity
    tty: true
    securityContext:
      runAsUser: 0
      readOnlyRootFilesystem: false
    env:
      - name: KUBECONFIG
        value: /kube/config
    volumeMounts:
      - name: kubeconfig-secret
        mountPath: /kube/config
        subPath: kubeconfig
  - name: dind
    image: docker:dind
    args:
      - "--storage-driver=overlay2"
      - "--insecure-registry=nexus.imcc.com:8085"
      - "--insecure-registry=nexus-service-for-docker-hosted-registry.nexus.svc.cluster.local:8085"
    securityContext:
      privileged: true
    env:
      - name: DOCKER_TLS_CERTDIR
        value: ""
  volumes:
  - name: kubeconfig-secret
    secret:
      secretName: kubeconfig-secret
"""
        }
    }

    environment {
        // Kubernetes namespace - must match the namespace in k8s/development.yaml and k8s/service.yaml
        NAMESPACE = "2401088" 
        NEXUS_HOST = "nexus-service-for-docker-hosted-registry.nexus.svc.cluster.local:8085"
        NEXUS_REPO = "bionexa_88"
        FRONTEND_IMAGE = "bionexa-frontend"
        BACKEND_IMAGE  = "bionexa-backend"
        // SonarQube URL - using the service name that resolves (from original error)
        // If this fails, check: kubectl get svc -n sonarqube
        SONAR_HOST_URL = "http://my-sonarqube-sonarqube.sonarqube.svc.cluster.local:9000"
    }

    stages {
        stage('CHECK') {
            steps {
                echo "Lightweight Jenkinsfile started for ${NAMESPACE}"
            }
        }

        stage('Install + Build Frontend') {
            steps {
                container('node') {
                    sh '''
                        echo "===== Configuring npm settings ====="
                        # Configure npm with increased timeouts and retries
                        npm config set fetch-timeout 300000
                        npm config set fetch-retries 5
                        npm config set fetch-retry-mintimeout 10000
                        npm config set fetch-retry-maxtimeout 60000
                        npm config set maxsockets 15
                        
                        # Test npm registry connectivity
                        echo "Testing npm registry connectivity..."
                        npm ping || echo "npm ping failed, but continuing..."
                        
                        echo "===== Installing dependencies with retry logic ====="
                        # Retry logic for npm ci
                        MAX_RETRIES=3
                        RETRY_COUNT=0
                        while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
                            if npm ci --prefer-offline --no-audit; then
                                echo "npm ci succeeded"
                                break
                            else
                                RETRY_COUNT=$((RETRY_COUNT + 1))
                                if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
                                    echo "npm ci failed, retrying in 10 seconds... (Attempt $RETRY_COUNT/$MAX_RETRIES)"
                                    sleep 10
                                else
                                    echo "npm ci failed after $MAX_RETRIES attempts"
                                    exit 1
                                fi
                            fi
                        done
                        
                        echo "===== Building frontend ====="
                        npm run build
                    '''
                }
            }
        }

        stage('Install Backend') {
            steps {
                dir('backend') {
                    container('node') {
                        sh '''
                            echo "===== Configuring npm settings ====="
                            # Configure npm with increased timeouts and retries
                            npm config set fetch-timeout 300000
                            npm config set fetch-retries 5
                            npm config set fetch-retry-mintimeout 10000
                            npm config set fetch-retry-maxtimeout 60000
                            npm config set maxsockets 15
                            
                            # Test npm registry connectivity
                            echo "Testing npm registry connectivity..."
                            npm ping || echo "npm ping failed, but continuing..."
                            
                            echo "===== Installing backend dependencies with retry logic ====="
                            # Retry logic for npm ci
                            MAX_RETRIES=3
                            RETRY_COUNT=0
                            while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
                                if npm ci --prefer-offline --no-audit; then
                                    echo "npm ci succeeded"
                                    break
                                else
                                    RETRY_COUNT=$((RETRY_COUNT + 1))
                                    if [ $RETRY_COUNT -lt $MAX_RETRIES ]; then
                                        echo "npm ci failed, retrying in 10 seconds... (Attempt $RETRY_COUNT/$MAX_RETRIES)"
                                        sleep 10
                                    else
                                        echo "npm ci failed after $MAX_RETRIES attempts"
                                        exit 1
                                    fi
                                fi
                            done
                        '''
                    }
                }
            }
        }

        stage('Build Docker Images') {
            steps {
                container('dind') {
                    sh """
                        docker build -t ${FRONTEND_IMAGE}:latest -f Dockerfile .
                        docker build -t ${BACKEND_IMAGE}:latest -f backend/Dockerfile backend/
                    """
                }
            }
        }

        stage('SonarQube Analysis') {
            when {
                expression { return fileExists('sonar-project.properties') }
            }
            steps {
                container('sonar-scanner') {
                    withCredentials([string(credentialsId: 'sonar-token', variable: 'SONAR_TOKEN')]) {
                        withEnv(["SONAR_TOKEN=${SONAR_TOKEN}"]) {
                            sh '''
                                echo "===== Testing SonarQube Connectivity ====="
                                echo "Target URL: ${SONAR_HOST_URL}"
                                
                                # Try DNS resolution
                                echo "Testing DNS resolution..."
                                nslookup my-sonarqube-sonarqube.sonarqube.svc.cluster.local || echo "DNS lookup failed"
                                
                                # Try different ports in case 9000 is wrong
                                echo "Testing port 9000..."
                                timeout 3 bash -c "echo > /dev/tcp/my-sonarqube-sonarqube.sonarqube.svc.cluster.local/9000" 2>/dev/null && echo "Port 9000 is open" || echo "Port 9000 connection failed"
                                
                                # Try HTTP endpoint
                                echo "Testing HTTP endpoint..."
                                curl -v --connect-timeout 10 --max-time 10 ${SONAR_HOST_URL}/api/system/status 2>&1 | head -20 || echo "HTTP connection failed"
             
                                echo "===== Running SonarQube Analysis ====="
                                sonar-scanner \
                                    -Dsonar.projectKey=bionexa_88 \
                                    -Dsonar.sources=. \
                                    -Dsonar.host.url=${SONAR_HOST_URL} \
                                    -Dsonar.token=${SONAR_TOKEN}
                            '''
                        }
                    }
                }
            }
        }

        stage('Login to Nexus') {
            steps {
                container('dind') {
                    withCredentials([usernamePassword(credentialsId: 'nexus-docker-creds', usernameVariable: 'NEXUS_USER', passwordVariable: 'NEXUS_PASS')]) {
                        sh """
                            docker login http://${NEXUS_HOST} \
                              -u ${NEXUS_USER} \
                              -p ${NEXUS_PASS}
                        """
                    }
                }
            }
        }

        stage('Push Images') {
            steps {
                container('dind') {
                    sh """
                        docker tag ${FRONTEND_IMAGE}:latest ${NEXUS_HOST}/${NEXUS_REPO}/${FRONTEND_IMAGE}:v${BUILD_NUMBER}
                        docker tag ${BACKEND_IMAGE}:latest  ${NEXUS_HOST}/${NEXUS_REPO}/${BACKEND_IMAGE}:v${BUILD_NUMBER}

                        docker push ${NEXUS_HOST}/${NEXUS_REPO}/${FRONTEND_IMAGE}:v${BUILD_NUMBER}
                        docker push ${NEXUS_HOST}/${NEXUS_REPO}/${BACKEND_IMAGE}:v${BUILD_NUMBER}
                    """
                }
            }
        }

        stage('Deploy to Kubernetes') {
            when {
                expression { return fileExists('k8s') }
            }
            steps {
                container('kubectl') {
                    sh """
                        echo "===== Using kubeconfig ====="
                        ls -l /kube || true
                        cat /kube/config || true

                        echo "===== Applying Manifests ====="
                        kubectl apply -n ${NAMESPACE} -f k8s/development.yaml
                        kubectl apply -n ${NAMESPACE} -f k8s/service.yaml

                        echo "===== Updating Image Tags to Build Number ====="
                        kubectl set image deployment/bionexa-frontend frontend=${NEXUS_HOST}/${NEXUS_REPO}/${FRONTEND_IMAGE}:v${BUILD_NUMBER} -n ${NAMESPACE}
                        kubectl set image deployment/bionexa-backend backend=${NEXUS_HOST}/${NEXUS_REPO}/${BACKEND_IMAGE}:v${BUILD_NUMBER} -n ${NAMESPACE}

                        echo "===== Rollout Status ====="
                        kubectl rollout status deployment/bionexa-frontend -n ${NAMESPACE} --timeout=60s || true
                        kubectl rollout status deployment/bionexa-backend -n ${NAMESPACE} --timeout=60s || true

                        echo "===== Pods ====="
                        kubectl get pods -n ${NAMESPACE}
                    """
                }
            }
        }
    }
}
