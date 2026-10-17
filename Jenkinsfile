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
        IMAGE_NAME = 'reliefsync-app'
        CONTAINER_NAME = 'reliefsync-container'
        APP_PORT = '5001'
        HOST_PORT = '3000'
    }

    stages {

        stage('1. Checkout Code') {
            steps {
                echo 'Checking out source code from Git repository...'
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

        stage('3. Build Docker Image') {
            steps {
                echo 'Building Docker image...'

                bat 'docker build -t %IMAGE_NAME%:v%BUILD_NUMBER% .'

                bat 'docker tag %IMAGE_NAME%:v%BUILD_NUMBER% %IMAGE_NAME%:latest'
            }
        }

        stage('4. Package Docker Image') {
            steps {
                echo 'Packaging Docker image as a TAR archive...'

                bat 'docker save -o reliefsync-image.tar %IMAGE_NAME%:v%BUILD_NUMBER%'
            }
        }

        stage('5. Deploy Application') {
            steps {
                echo "Deploying ReliefSync to ${params.DEPLOY_ENV}..."

                script {
                    // Stop the old container if it exists.
                    bat(
                        returnStatus: true,
                        script: 'docker stop %CONTAINER_NAME%'
                    )

                    // Remove the old container if it exists.
                    bat(
                        returnStatus: true,
                        script: 'docker rm %CONTAINER_NAME%'
                    )

                    // Start the new application container.
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

        stage('6. Verify Deployment') {
            steps {
                echo 'Checking whether the application container is running...'

                bat 'docker ps --filter "name=%CONTAINER_NAME%"'

                echo "Application URL: http://localhost:3000"
                echo "Deployment environment: ${params.DEPLOY_ENV}"
            }
        }
    }

    post {
        success {
            echo 'SUCCESS: Jenkins pipeline completed successfully.'
            echo 'ReliefSync URL: http://localhost:3000'
        }

        failure {
            echo 'FAILURE: Pipeline failed. Check the Console Output for details.'
        }

        always {
            echo 'Jenkins pipeline execution completed.'
        }
    }
}
