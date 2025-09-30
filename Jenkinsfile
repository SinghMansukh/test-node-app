// pipeline {
//     agent any
//      tools { nodejs 'node-18' }  // name from tool configuration
//     stages {
//         stage('Checkout') {
//             steps {
//                 git branch: 'master', url: 'https://github.com/SinghMansukh/test-node-app.git'
//             }
//         }
//         stage('Install Dependencies') {
//             steps {
//                 sh 'npm install'
//             }
//         }
//         stage('Run Tests') {
//             steps {
//                 // sh 'npm test'
//                 echo 'Skipping tests for now'
//             }
//          }

//             }
//         }
//         stage('Build') {
//             steps {
//                 sh 'npm run build'
//             }
//         }
//     }
// }

// New //

pipeline {
    agent any

    environment {
        NODE_VERSION = "18"
        DOCKER_HUB_USERNAME = credentials('docker-username')
        DOCKER_HUB_PASSWORD = credentials('docker-password')
    }

    stages {
        stage('Checkout Code') {
            steps {
                checkout scm
            }
        }

        stage('Setup Node.js') {
            steps {
                script {
                    def nodeHome = tool name: "NodeJS-${NODE_VERSION}", type: 'NodeJSInstallation'
                    env.PATH = "${nodeHome}/bin:${env.PATH}"
                }
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm install'
            }
        }

        stage('Run Tests') {
            steps {
                script {
                    def hasTest = sh(
                        script: "node -p \"require('./package.json').scripts.test || ''\"",
                        returnStdout: true
                    ).trim()
                    if (hasTest) {
                        sh 'npm test'
                    } else {
                        echo "⚠️ No tests found, skipping..."
                    }
                }
            }
        }

        stage('Lint') {
            steps {
                script {
                    if (fileExists('.eslintrc.json')) {
                        sh 'npx eslint .'
                    } else {
                        echo "⚠️ No ESLint config found, skipping..."
                    }
                }
            }
        }

        stage('Docker Login') {
            steps {
                sh """
                    echo $DOCKER_HUB_PASSWORD | docker login -u $DOCKER_HUB_USERNAME --password-stdin
                """
            }
        }

        stage('Build & Push Docker Image') {
            steps {
                script {
                    def image = "${DOCKER_HUB_USERNAME}/node-demo:latest"
                    sh """
                        docker build -t ${image} .
                        docker push ${image}
                    """
                }
            }
        }

        stage('Trivy Scan') {
            steps {
                sh '''
                    if ! command -v trivy >/dev/null; then
                        echo "Installing Trivy..."
                        curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh
                        sudo mv ./trivy /usr/local/bin/
                    fi
                    trivy image ${DOCKER_HUB_USERNAME}/node-demo:latest
                '''
            }
        }

        stage('Deploy to KIND') {
            steps {
                sh '''
                    echo "Deploying node-demo to KIND..."
                    kubectl apply -f configmap.yml
                    kubectl apply -f secrets.yml
                    kubectl apply -f deployment.yml
                    kubectl rollout restart deployment node-demo
                '''
            }
        }
    }
}





