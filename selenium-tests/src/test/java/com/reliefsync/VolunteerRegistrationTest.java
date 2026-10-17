package com.reliefsync;

import org.junit.jupiter.api.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.Select;

import static org.junit.jupiter.api.Assertions.assertTrue;

class VolunteerRegistrationTest extends ReliefSyncTestSupport {

    @Test
    void volunteerCanRegisterAndSeePendingStatusInOperations() {
        VolunteerData volunteer = newVolunteer();
        open("/register");
        waitFor(By.id("name")).sendKeys(volunteer.name);
        waitFor(By.id("email")).sendKeys(volunteer.email);
        waitFor(By.id("phone")).sendKeys(volunteer.phone);
        waitFor(By.id("location")).sendKeys(volunteer.location);
        new Select(waitFor(By.id("skill"))).selectByVisibleText("Medical");
        waitFor(By.xpath("//button[normalize-space()='Submit registration']")).click();

        assertTrue(wait.until(ExpectedConditions.visibilityOfElementLocated(
                By.cssSelector("[role='status']"))).getText().contains("Pending approval"));

        open("/admin");
        var volunteerRow = findVolunteerRow(volunteer.name);
        assertTrue(volunteerRow.getText().contains(volunteer.email));
        assertTrue(volunteerRow.findElement(By.className("status-badge")).getText().contains("Pending"));
    }
}
