# Runtime Validation Report

**Generated**: 2026-10-17T12:38:45+05:30  
**Target**: `ReliefSync` local application at `http://localhost:5001`

## Summary

| Step | Status | Exit Code | Details |
|------|--------|-----------|---------|
| Startup/readiness | ✓ PASS | n/a | Existing local backend returned HTTP 200 from `/api/summary`; frontend root returned HTTP 200; MongoDB was reachable on port 27017 |
| Selenium E2E | ✓ PASS | 0 | `mvn clean test`; 4 tests, 0 failures, 0 errors, 0 skipped; Selenium 4.18.1 with headless Chrome 155 |

**Overall**: PASS

## Environment and tier evidence

- Docker: **UNAVAILABLE** — `docker info` reported that the daemon was not responding.
- Node.js: **AVAILABLE** — v22.12.0.
- Maven: **AVAILABLE** — 3.9.16; Java 21.0.8.
- Browser: **AVAILABLE** — Chrome 155.0.8059.84; WebDriverManager provisioned the matching ChromeDriver.
- Browser tier: **PRIMARY (Selenium WebDriver)** — exercised the requested browser E2E workflows; no fallback used.
- Data tier: **REAL LOCAL SERVICES** — the existing MongoDB service and Express backend were reachable. Docker was not needed for this local test run.
- Startup: **PASS** — the app was already running; no application process was started by this validation. The readiness endpoint and frontend root responded successfully.

## Test evidence

| Journey | Test class | Result |
|---------|------------|--------|
| Search open requests by skill and location | `PublicRequestSearchTest` | PASS |
| Register volunteer and verify pending record in Admin | `VolunteerRegistrationTest` | PASS |
| Create and close a relief request | `RequestAdministrationTest` | PASS |
| Approve volunteer, assign request, and deploy | `VolunteerDeploymentTest` | PASS |

- Command: `mvn clean test` from `selenium-tests/`
- Exit code: `0`
- Surefire reports: `selenium-tests/target/surefire-reports/`
- Failure screenshots: `selenium-tests/target/screenshots/` (created on test-body failures; no screenshot is expected for this all-passing final run)
- Screenshot capture was exercised during test development when an off-screen roster action initially intercepted a click. The test was corrected to scroll the control into view; the final `clean` run removed that interim screenshot.

## Issues and gaps

- No outstanding test failures.
- The Admin interface currently has no authentication or authorization flow; authorization behavior is not asserted because it does not exist in the application.
- Volunteers created by test runs remain in the local database with unique test emails. Relief requests created by tests are closed during teardown.
- Selenium emitted a non-fatal CDP warning because Selenium 4.18.1 does not include a CDP implementation for Chrome 155; all browser tests passed.
