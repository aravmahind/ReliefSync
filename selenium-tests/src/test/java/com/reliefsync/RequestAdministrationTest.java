package com.reliefsync;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class RequestAdministrationTest extends ReliefSyncTestSupport {

    @Test
    void administratorCanCreateAndCloseAnOpenRequest() {
        String title = "Selenium close request " + testToken();
        String location = "Selenium Relief Site";
        createRequest(title, location, "Food Distribution", "Medium");

        open("/requests");
        var publicRequest = findRequestCard(title);
        assertTrue(publicRequest.isDisplayed());
        assertTrue(publicRequest.getText().contains(location));

        closeRequestInAdmin(title);

        open("/requests");
        assertFalse(requestIsVisible(title), "Closed requests must disappear from public results.");
    }
}
