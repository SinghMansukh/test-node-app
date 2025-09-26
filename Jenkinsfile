pipeline {
    agent any
     tools { nodejs 'node-18' }  // name from tool configuration
    stages {
        stage('Checkout') {
            steps {
                git branch: 'Jenkins', url: 'https://github.com/SinghMansukh/test-node-app.git'
            }
        }
        stage('Install Dependencies') {
            steps {
                sh 'npm install'
            }
        }
        stage('Run Tests') {
            steps {
                // sh 'npm test'
                echo 'Skipping tests for now'
            }
         }
        
        stage('Build') {
            steps {
                sh 'npm run build'
            }
        }
    }
}
