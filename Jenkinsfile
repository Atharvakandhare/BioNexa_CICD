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
        NAMESPACE = "2401088"
        NEXUS_HOST = "nexus-service-for-docker-hosted-registry.nexus.svc.cluster.local:8085"
        NEXUS_REPO = "bionexa_88"
        FRONTEND_IMAGE = "bionexa-frontend"
        BACKEND_IMAGE  = "bionexa-backend"
        // SonarQube URL - try common service name patterns
        // Format: <service-name>.<namespace>.svc.cluster.local:<port>
        // Common patterns: sonarqube.sonarqube.svc.cluster.local:9000
        SONAR_HOST_URL = "http://sonarqube.sonarqube.svc.cluster.local:9000"
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
                        npm ci
                        npm run build
                    '''
                }
            }
        }

        stage('Install Backend') {
            steps {
                dir('backend') {
                    container('node') {
                        sh 'npm ci'
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
                                
                                # Test connectivity (will show error but continue)
                                curl -s --connect-timeout 5 ${SONAR_HOST_URL}/api/system/status || echo "Note: Connection test failed, but continuing..."
                                
                                echo "===== Running SonarQube Analysis ====="
                                sonar-scanner \
                                    -Dsonar.projectKey=bionexa_2401088 \
                                    -Dsonar.sources=backend,src \
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
