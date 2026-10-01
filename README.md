# ReliefSync

ReliefSync is a disaster-relief coordination application for publishing open relief requests and registering volunteers. Volunteers can register with their location and skill; administrators can review volunteer status, assign approved volunteers to requests, and close requests. The application stores volunteer and relief-request data in MongoDB.

## Tech Stack

- **Frontend:** React 19, React Router, Vite 8
- **Backend:** Node.js (ES modules), Express 5, Mongoose 9
- **Database:** MongoDB
- **Testing:** Selenium WebDriver, Java 11, JUnit 5, Maven
- **DevOps:** Docker, Jenkins

Use Node.js 20.19 or newer (or 22.12 or newer) for local development. The current backend dependencies require a newer Node.js runtime than the Node 18 base image currently specified in the Dockerfile; see [DevOps](#devops) before building the image.

## Architecture

```text
Browser
  |
  | React single-page application (Vite in development)
  | /api and /admin requests
  v
Express backend :5001
  |
  | Mongoose
  v
MongoDB :27017
```

During development, Vite serves the frontend and proxies `/api`, `/admin/volunteers`, and `/admin/requests` requests to the backend. The Express application provides the REST API and serves `frontend/dist` when that directory exists. The main data collections are volunteers and relief requests.

## DevOps

The Jenkins pipeline in `Jenkinsfile` checks out the repository, runs the Selenium Maven test suite, builds and tags a Docker image, then replaces the running application container. Images are tagged with the Jenkins build number and also tagged `latest`. The container maps host port `3000` to application port `5001` and receives a MongoDB connection string through `MONGODB_URI`.

The pipeline uses Windows `bat` commands. Run it on a Jenkins agent with Docker, Maven, Java, Chrome/ChromeDriver support, and a MongoDB instance available. The Selenium test opens `http://localhost:5001`, so the application must be running and reachable there when the test stage executes. The test currently checks that the page title is not null.

The current Docker setup has two limitations to account for:

- `Dockerfile` uses `node:18-alpine`, but Mongoose 9 requires a newer Node.js release. Use Node.js 20.19+ or 22.12+ for the runtime image before relying on this image.
- The Docker build copies only the backend. It does not build or copy `frontend/dist`, so the deployed container serves the API fallback at `/` rather than the React application. Add a frontend build and include its output in the image (or deploy the frontend separately) to serve the full application from the container.

### Build and run the current backend image

From the repository root, after updating the Docker base image to a supported Node.js version:

```powershell
docker build -t reliefsync-app:latest .
docker run --rm -p 5001:5001 `
  -e MONGODB_URI=mongodb://host.docker.internal:27017/reliefsync `
  reliefsync-app:latest
```

Use `host.docker.internal` when MongoDB is running on the Docker host. If MongoDB runs in another container or managed service, set `MONGODB_URI` to an address reachable from the application container. The Jenkins pipeline uses the same host address and maps the application to `http://localhost:3000`.

## Clone and Set Up

### Prerequisites

- Git
- Node.js 20.19+ (or 22.12+) and npm
- MongoDB running locally, or a MongoDB connection URI

Clone the repository and enter the project directory:

```bash
git clone <repository-url>
cd <repository-directory>
```

Start the backend in one terminal:

```bash
cd backend
npm install
```

Set `MONGODB_URI` if MongoDB is not available at the default `mongodb://127.0.0.1:27017/reliefsync`, then start the API:

```bash
# PowerShell
$env:MONGODB_URI = "mongodb://127.0.0.1:27017/reliefsync"
npm run dev
```

```bash
# macOS/Linux
MONGODB_URI=mongodb://127.0.0.1:27017/reliefsync npm run dev
```

Start the frontend in a second terminal from the repository root:

```bash
cd frontend
npm install
npm run dev
```

Open the Vite URL printed in the terminal (typically `http://localhost:5173`). The frontend proxies API requests to `http://localhost:5001`.

### Run checks

Build the frontend and run its linter:

```bash
cd frontend
npm run build
npm run lint
```

Run the Selenium suite from the repository root after starting the backend and ensuring Chrome is available:

```bash
cd selenium-tests
mvn clean test
```
