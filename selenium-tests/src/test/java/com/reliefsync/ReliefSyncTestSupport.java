package com.reliefsync;

import io.github.bonigarcia.wdm.WebDriverManager;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.extension.ExtensionContext;
import org.junit.jupiter.api.extension.RegisterExtension;
import org.junit.jupiter.api.extension.TestExecutionExceptionHandler;
import org.openqa.selenium.By;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.OutputType;
import org.openqa.selenium.TakesScreenshot;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.WebDriverException;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.Select;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

abstract class ReliefSyncTestSupport {

    private static final Duration WAIT_TIMEOUT = Duration.ofSeconds(15);
    private static final String BASE_URL = resolveBaseUrl();

    @RegisterExtension
    final FailureScreenshotExtension failureScreenshotExtension = new FailureScreenshotExtension();

    WebDriver driver;
    WebDriverWait wait;
    private String requestIdToCleanUp;

    @BeforeEach
    void setUp() throws IOException, InterruptedException {
        HttpRequest readinessRequest = HttpRequest.newBuilder(URI.create(BASE_URL + "/api/summary"))
                .timeout(Duration.ofSeconds(5))
                .GET()
                .build();
        HttpResponse<String> readiness = HttpClient.newHttpClient()
                .send(readinessRequest, HttpResponse.BodyHandlers.ofString());
        assertEquals(200, readiness.statusCode(),
                "ReliefSync API must be running and MongoDB-backed before Selenium tests start.");

        WebDriverManager.chromedriver().setup();
        ChromeOptions options = new ChromeOptions();
        options.addArguments("--headless=new", "--no-sandbox", "--disable-dev-shm-usage");
        options.addArguments("--window-size=1440,1200");
        driver = new ChromeDriver(options);
        wait = new WebDriverWait(driver, WAIT_TIMEOUT);
    }

    @AfterEach
    void tearDown() {
        cleanUpOpenRequest();
        if (driver != null) {
            driver.quit();
        }
    }

    void createRequest(String title, String location, String skill, String urgency) {
        open("/admin");
        waitFor(By.id("request-title")).sendKeys(title);
        waitFor(By.id("request-location")).sendKeys(location);
        new Select(waitFor(By.id("request-skill"))).selectByVisibleText(skill);
        new Select(waitFor(By.id("request-urgency"))).selectByVisibleText(urgency);
        waitFor(By.id("request-count")).clear();
        waitFor(By.id("request-count")).sendKeys("2");
        waitFor(By.xpath("//button[normalize-space()='Create request']")).click();
        assertTrue(wait.until(ExpectedConditions.visibilityOfElementLocated(
                By.cssSelector("[role='status']"))).getText().contains("Relief request created."));

        WebElement requestId = wait.until(ExpectedConditions.visibilityOfElementLocated(
                requestIdLocator(title)));
        requestIdToCleanUp = requestId.getText();
    }

    void registerVolunteer(VolunteerData volunteer) {
        open("/register");
        waitFor(By.id("name")).sendKeys(volunteer.name);
        waitFor(By.id("email")).sendKeys(volunteer.email);
        waitFor(By.id("phone")).sendKeys(volunteer.phone);
        waitFor(By.id("location")).sendKeys(volunteer.location);
        new Select(waitFor(By.id("skill"))).selectByVisibleText("Medical");
        waitFor(By.xpath("//button[normalize-space()='Submit registration']")).click();
        assertTrue(wait.until(ExpectedConditions.visibilityOfElementLocated(
                By.cssSelector("[role='status']"))).getText().contains("Pending approval"));
    }

    void closeRequestInAdmin(String title) {
        open("/admin");
        WebElement requestRow = wait.until(ExpectedConditions.visibilityOfElementLocated(
                requestArticleLocator(title)));
        requestRow.findElement(By.xpath(".//button[normalize-space()='Close request']")).click();
        assertTrue(wait.until(ExpectedConditions.visibilityOfElementLocated(
                By.cssSelector("[role='status']"))).getText().contains("closed."));
        wait.until(ExpectedConditions.invisibilityOfElementLocated(requestArticleLocator(title)));
    }

    WebElement findVolunteerRow(String name) {
        return wait.until(ExpectedConditions.visibilityOfElementLocated(
                By.xpath("//tr[.//strong[normalize-space()='" + name + "']]")));
    }

    WebElement findRequestCard(String title) {
        return wait.until(ExpectedConditions.visibilityOfElementLocated(
                By.xpath("//article[contains(@class,'request-row')][.//*[self::h2 or self::h3][normalize-space()='" + title + "']]")));
    }

    boolean requestIsVisible(String title) {
        return !driver.findElements(By.xpath(
                "//article[contains(@class,'request-row')][.//*[self::h2 or self::h3][normalize-space()='" + title + "']]"))
                .isEmpty();
    }

    By requestArticleLocator(String title) {
        return By.xpath("//article[contains(@class,'active-request-row')][.//h3[normalize-space()='" + title + "']]");
    }

    By requestIdLocator(String title) {
        return By.xpath("//article[contains(@class,'active-request-row')][.//h3[normalize-space()='" + title
                + "']]//span[contains(@class,'request-id')]");
    }

    WebElement waitFor(By locator) {
        return wait.until(ExpectedConditions.elementToBeClickable(locator));
    }

    void clickWhenVisible(WebElement element) {
        ((JavascriptExecutor) driver).executeScript(
                "arguments[0].scrollIntoView({block: 'center'});", element);
        wait.until(ExpectedConditions.elementToBeClickable(element)).click();
    }

    void open(String route) {
        driver.get(BASE_URL + route);
    }

    String testToken() {
        return UUID.randomUUID().toString().substring(0, 8);
    }

    VolunteerData newVolunteer() {
        String token = UUID.randomUUID().toString();
        String shortToken = token.substring(0, 8);
        return new VolunteerData(
                "Selenium Volunteer " + shortToken,
                "selenium." + token + "@example.test",
                "555" + token.replace("-", "").substring(0, 7),
                "Selenium Location " + shortToken);
    }

    private void cleanUpOpenRequest() {
        if (requestIdToCleanUp == null) return;

        HttpRequest request = HttpRequest.newBuilder(
                        URI.create(BASE_URL + "/admin/requests/" + requestIdToCleanUp + "/close"))
                .timeout(Duration.ofSeconds(5))
                .POST(HttpRequest.BodyPublishers.noBody())
                .build();
        try {
            HttpResponse<String> response = HttpClient.newHttpClient()
                    .send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200 && response.statusCode() != 409) {
                System.err.println("Unable to clean up request " + requestIdToCleanUp
                        + ": HTTP " + response.statusCode() + " " + response.body());
            }
        } catch (IOException exception) {
            System.err.println("Unable to clean up request " + requestIdToCleanUp
                    + ": " + exception.getMessage());
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            System.err.println("Interrupted while cleaning up request " + requestIdToCleanUp);
        }
    }

    private void captureFailureScreenshot(String testName, Throwable failure) {
        if (driver == null) return;
        Path screenshot = Path.of("target", "screenshots",
                testName + "-" + System.currentTimeMillis() + ".png");
        try {
            Files.createDirectories(screenshot.getParent());
            Files.write(screenshot, ((TakesScreenshot) driver).getScreenshotAs(OutputType.BYTES));
            System.err.println("Failure screenshot saved to " + screenshot.toAbsolutePath()
                    + " after " + failure.getClass().getSimpleName());
        } catch (IOException | WebDriverException screenshotFailure) {
            System.err.println("Unable to capture failure screenshot for " + testName
                    + ": " + screenshotFailure.getMessage());
        }
    }

    private static String resolveBaseUrl() {
        String configured = System.getProperty("reliefsync.baseUrl");
        if (configured == null || configured.isBlank()) {
            configured = System.getenv().getOrDefault("RELIEFSYNC_BASE_URL", "http://localhost:5001");
        }
        return configured.replaceAll("/+$", "");
    }

    static final class VolunteerData {
        final String name;
        final String email;
        final String phone;
        final String location;

        VolunteerData(String name, String email, String phone, String location) {
            this.name = name;
            this.email = email;
            this.phone = phone;
            this.location = location;
        }
    }

    private static final class FailureScreenshotExtension implements TestExecutionExceptionHandler {
        @Override
        public void handleTestExecutionException(ExtensionContext context, Throwable throwable) throws Throwable {
            ReliefSyncTestSupport test = (ReliefSyncTestSupport) context.getRequiredTestInstance();
            test.captureFailureScreenshot(context.getRequiredTestMethod().getName(), throwable);
            throw throwable;
        }
    }
}
