pipeline {
    agent any

    environment {
        IMAGE_NAME = 'reliefsync-app'
        CONTAINER_NAME = 'reliefsync-container'
    }

    stages {
        stage('1. Checkout Code') {
            steps {
                echo 'Pulling latest code from Git repository...'
            }
        }

        stage('2. Automated Selenium Tests') {
            steps {
                echo 'Executing Selenium WebDriver Test Suite via Maven...'
                dir('selenium-tests') {
                    // Windows environment sathi bat, Linux/Jenkins server sathi sh
                    bat 'mvn clean test'
                }
            }
        }

        stage('3. Build Docker Image') {
            steps {
                echo 'Building fresh Docker Image...'
                bat "docker build -t ${IMAGE_NAME}:v${BUILD_NUMBER} ."
                bat "docker tag ${IMAGE_NAME}:v${BUILD_NUMBER} ${IMAGE_NAME}:latest"
            }
        }

        stage('4. Deploy Application Container') {
            steps {
                echo 'Deploying Docker Container...'
                bat "docker stop ${CONTAINER_NAME} || exit 0"
                bat "docker rm ${CONTAINER_NAME} || exit 0"
                // host.docker.internal mule container Windows host varlya MongoDB la connect hoil
                bat "docker run -d -p 3000:5001 -e MONGODB_URI=mongodb://host.docker.internal:27017/reliefsync --name ${CONTAINER_NAME} ${IMAGE_NAME}:latest"
            }
        }
    }

    post {
        success {
            echo 'SUCCESS: Pipeline executed successfully! ReliefSync is Live on http://localhost:3000'
        }
        failure {
            echo 'FAILURE: Pipeline failed at testing/build stage! Halting deployment.'
        }
    }
}