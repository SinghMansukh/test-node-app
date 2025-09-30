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

    tools {
        nodejs "node-18"   // make sure you configured NodeJS in Jenkins global tools
    }

    environment {
        // DockerHub credentials stored in Jenkins
        DOCKER_CREDS = credentials('dockerhub-creds')
    }

    stages {
        stage('Checkout Code') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                bat 'npm install'
            }
        }

        stage('Run Tests') {
            steps {
                script {
                    def hasTest = bat(
                        script: 'powershell -Command "($pkg = Get-Content package.json | ConvertFrom-Json).scripts.test"',
                        returnStdout: true
                    ).trim()
                    if (hasTest) {
                        bat 'npm test'
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
                        bat 'npx eslint .'
                    } else {
                        echo "⚠️ No ESLint config found, skipping..."
                    }
                }
            }
        }

        stage('Docker Login') {
            steps {
                bat """
                    echo %DOCKER_CREDS_PSW% | docker login -u %DOCKER_CREDS_USR% --password-stdin
                """
            }
        }

        stage('Build & Push Docker Image') {
            steps {
                script {
                    def image = "${DOCKER_CREDS_USR}/node-demo:latest"
                    bat """
                        docker build -t ${image} .
                        docker push ${image}
                    """
                }
            }
        }

        stage('Trivy Scan') {
            steps {
                bat '''
                    if not exist C:\\trivy\\trivy.exe (
                        echo Installing Trivy...
                        powershell -Command "Invoke-WebRequest -Uri https://github.com/aquasecurity/trivy/releases/download/v0.66.0/trivy_0.66.0_windows-64bit.zip -OutFile trivy.zip"
                        powershell -Command "Expand-Archive trivy.zip -DestinationPath C:\\trivy"
                    )
                    C:\\trivy\\trivy.exe image %DOCKER_CREDS_USR%/node-demo:latest
                '''
            }
        }

        stage('Deploy to KIND') {
            steps {
                bat '''
                    echo Deploying node-demo to KIND...
                    kubectl apply -f configmap.yml
                    kubectl apply -f secrets.yml
                    kubectl apply -f deployment.yml
                    kubectl rollout restart deployment node-demo
                '''
            }
        }
    }
}






