# ReliefSync Selenium test plan

## Purpose and execution

ReliefSync is a React single-page application backed by an Express API and MongoDB. Selenium exercises the rendered browser UI, with the backend and database running locally. The Maven/JUnit suite requires Chrome and a running ReliefSync instance; it defaults to `http://localhost:5001`. Override the target with `mvn test -Dreliefsync.baseUrl=http://localhost:5173` or the `RELIEFSYNC_BASE_URL` environment variable.

Run from this directory after starting MongoDB, the backend, and (if using the Vite URL) the frontend:

```powershell
mvn clean test
```

## Critical user journeys and acceptance criteria

| Journey | Browser flow | Assertions / acceptance |
|---|---|---|
| Discover a relevant need | Create a uniquely named open request; visit the overview; open Relief requests; filter by skill and location | Overview and request appear; search returns exactly one matching request with the expected location |
| Register as a volunteer | Complete the volunteer intake form with unique contact data; open the operations dashboard | Registration confirmation says pending approval; the dashboard shows the same volunteer/email with Pending status |
| Manage a relief request | Create a uniquely named request in Admin; verify it in public requests; close it in Admin | Creation confirmation and request details appear; after close, the request is absent from public results |
| Approve and deploy a volunteer | Register a volunteer; create an open request; approve the volunteer; select the request and deploy | Status progresses Pending → Approved → Deployed; the volunteer row retains the assigned request ID |

The current application exposes no authentication or authorization flow: the `/admin` page and its actions are publicly accessible. Authentication failure is therefore not represented as a journey or falsely tested as an existing behavior.

## Test data and cleanup

- Each test creates unique names, locations, emails, and request titles using UUID-derived tokens; it does not depend on a pre-seeded record.
- Volunteers are retained as useful workflow records; unique emails prevent collisions on subsequent runs.
- Each test tracks any relief request it creates and closes it after the test. A failed test still attempts cleanup; an already closed request is an expected cleanup result.
- The Selenium suite does not reset or delete unrelated data from the shared local database.

## Runtime and evidence

- **Browser tier:** Selenium WebDriver with headless Chrome; ChromeDriver is provisioned by WebDriverManager.
- **Backend/data tier:** real local Express API and MongoDB; no mocks or containers. The test setup requires `GET /api/summary` to return HTTP 200.
- **Failure evidence:** a failed test body saves a PNG under `target/screenshots/<test-name>-<timestamp>.png` before browser teardown. Screenshot capture errors are written to stderr without replacing the original test failure.
- **Test report:** Maven Surefire text/XML reports are written under `target/surefire-reports/`.
- **Known limitations:** administrator routes have no access control; these tests validate current behavior and do not imply an authorization guarantee. The tests require the local app/database and Chrome to be available.
