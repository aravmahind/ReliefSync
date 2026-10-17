package com.reliefsync;

import org.junit.jupiter.api.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.Select;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class PublicRequestSearchTest extends ReliefSyncTestSupport {

    @Test
    void publicCanFindAnOpenRequestBySkillAndLocation() {
        String token = testToken();
        String title = "Selenium search request " + token;
        String location = "Selenium Harbor " + token;
        createRequest(title, location, "Rescue", "High");

        open("/");
        assertEquals("Response overview", wait.until(
                ExpectedConditions.visibilityOfElementLocated(By.tagName("h1"))).getText());
        assertTrue(findRequestCard(title).isDisplayed(), "The new request should appear in the overview.");

        open("/requests");
        new Select(waitFor(By.id("filter-skill"))).selectByVisibleText("Rescue");
        waitFor(By.id("filter-location")).sendKeys(location);
        waitFor(By.xpath("//button[normalize-space()='Search']")).click();

        assertEquals("1 request", wait.until(ExpectedConditions.visibilityOfElementLocated(
                By.className("results-heading"))).getText());
        assertTrue(findRequestCard(title).isDisplayed(), "The matching request should be visible.");
        assertTrue(findRequestCard(title).getText().contains(location));
    }
}
