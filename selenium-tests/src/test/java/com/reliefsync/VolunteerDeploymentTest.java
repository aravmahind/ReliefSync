package com.reliefsync;

import org.junit.jupiter.api.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.Select;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class VolunteerDeploymentTest extends ReliefSyncTestSupport {

    @Test
    void administratorCanApproveAndDeployARegisteredVolunteer() {
        VolunteerData volunteer = newVolunteer();
        registerVolunteer(volunteer);
        String requestTitle = "Selenium deployment request " + testToken();
        createRequest(requestTitle, "Selenium Deployment Site", "Medical", "High");
        String requestId = wait.until(ExpectedConditions.visibilityOfElementLocated(
                requestIdLocator(requestTitle))).getText();

        open("/admin");
        WebElement volunteerRow = findVolunteerRow(volunteer.name);
        clickWhenVisible(volunteerRow.findElement(By.xpath(".//button[normalize-space()='Approve']")));
        assertTrue(wait.until(ExpectedConditions.visibilityOfElementLocated(
                By.cssSelector("[role='status']"))).getText().contains("approved."));

        volunteerRow = findVolunteerRow(volunteer.name);
        assertEquals("Approved", volunteerRow.findElement(By.className("status-badge")).getText());
        new Select(volunteerRow.findElement(By.cssSelector("select[aria-label]")))
                .selectByValue(requestId);
        clickWhenVisible(volunteerRow.findElement(By.xpath(".//button[normalize-space()='Deploy']")));

        assertTrue(wait.until(ExpectedConditions.visibilityOfElementLocated(
                By.cssSelector("[role='status']"))).getText().contains("deployed to"));
        volunteerRow = findVolunteerRow(volunteer.name);
        assertEquals("Deployed", volunteerRow.findElement(By.className("status-badge")).getText());
        List<WebElement> columns = volunteerRow.findElements(By.tagName("td"));
        assertTrue(columns.get(5).getText().contains(requestId),
                "The deployed volunteer should retain the assigned request ID.");

        closeRequestInAdmin(requestTitle);
    }
}
