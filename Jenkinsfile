
pipeline {
    agent any

    parameters {
        choice(
            name: 'DEPLOY_ENV',
            choices: ['development', 'testing'],
            description: 'Select the deployment environment'
        )
    }

    environment {
        IMAGE_NAME = 'aravsm/reliefsync-app'
        CONTAINER_NAME = 'reliefsync-container'
        APP_PORT = '5001'
        HOST_PORT = '3000'
    }

    stages {

        stage('1. Checkout Code') {
            steps {
                echo 'Checking out source code...'
                checkout scm
            }
        }

        stage('2. Automated Selenium Tests') {
            steps {
                echo "Running Selenium tests for ${params.DEPLOY_ENV}..."

                dir('selenium-tests') {
                    bat 'mvn clean test'
                }
            }
        }

        stage('3. Build Versioned Docker Image') {
            steps {
                echo 'Building versioned Docker image...'

                bat 'docker build -t %IMAGE_NAME%:v%BUILD_NUMBER% .'

                bat 'docker tag %IMAGE_NAME%:v%BUILD_NUMBER% %IMAGE_NAME%:latest'
            }
        }

        stage('4. Push Image to Docker Hub') {
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: 'dockerhub-creds',
                        usernameVariable: 'DOCKERHUB_USERNAME',
                        passwordVariable: 'DOCKERHUB_TOKEN'
                    )
                ]) {
                    bat 'echo %DOCKERHUB_TOKEN% | docker login -u %DOCKERHUB_USERNAME% --password-stdin'

                    bat 'docker push %IMAGE_NAME%:v%BUILD_NUMBER%'

                    bat 'docker push %IMAGE_NAME%:latest'

                    bat 'docker logout'
                }
            }
        }

        stage('5. Package Docker Image') {
            steps {
                echo 'Packaging Docker image as TAR...'

                bat 'docker save -o reliefsync-image.tar %IMAGE_NAME%:v%BUILD_NUMBER%'
            }
        }

        stage('6. Deploy Fresh Container') {
            steps {
                echo "Deploying to ${params.DEPLOY_ENV}..."

                script {
                    // Stop the previous container if it exists.
                    bat(
                        returnStatus: true,
                        script: 'docker stop %CONTAINER_NAME%'
                    )

                    // Remove the previous container if it exists.
                    bat(
                        returnStatus: true,
                        script: 'docker rm %CONTAINER_NAME%'
                    )

                    // Run the newly built version.
                    bat '''
                        docker run -d ^
                        -p %HOST_PORT%:%APP_PORT% ^
                        -e DEPLOY_ENV=%DEPLOY_ENV% ^
                        -e MONGODB_URI=mongodb://host.docker.internal:27017/reliefsync ^
                        --name %CONTAINER_NAME% ^
                        %IMAGE_NAME%:v%BUILD_NUMBER%
                    '''
                }
            }
        }

        stage('7. Verify Deployment') {
    steps {
        echo 'Verifying the deployed container...'
        bat '''
            @echo off
            docker inspect -f "{{.State.Status}}" "%CONTAINER_NAME%" | findstr /x "running"
            if errorlevel 1 (
                echo ERROR: Container is not running!
                docker ps -a
                docker logs "%CONTAINER_NAME%"
                exit /b 1
            )
            echo Container is running successfully.
        '''
    }
}
    }

    post {
        success {
            echo 'SUCCESS: Build, push and deployment completed.'
            echo 'Docker Hub: https://hub.docker.com/r/aravsm/reliefsync-app'
            echo 'Application URL: http://localhost:3000'
        }

        failure {
            echo 'FAILURE: Check Jenkins Console Output for details.'
        }

        always {
            echo 'Jenkins pipeline execution completed.'
        }
    }
}
