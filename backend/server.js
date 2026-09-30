import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = express();
const port = process.env.PORT || 5001;
const currentFile = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFile);
const frontendDirectory = path.resolve(currentDirectory, "../frontend/dist");
const frontendEntry = path.join(frontendDirectory, "index.html");

const skills = ["Medical", "Rescue", "Food Distribution", "First Aid"];

const volunteers = [];
const reliefRequests = [
  {
    id: "REQ-1001",
    title: "Community health support",
    location: "NaviMumbai",
    skillRequired: "Medical",
    urgency: "High",
    volunteersNeeded: 4,
    status: "Open",
  },
  {
    id: "REQ-1002",
    title: "Meal and supply distribution",
    location: "North Market",
    skillRequired: "Food Distribution",
    urgency: "Medium",
    volunteersNeeded: 8,
    status: "Open",
  },
  {
    id: "REQ-1003",
    title: "Search-and-rescue support",
    location: "East Bridge",
    skillRequired: "Rescue",
    urgency: "High",
    volunteersNeeded: 3,
    status: "Open",
  },
];

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(frontendDirectory));

app.get("/api/summary", (_request, response) => {
  response.json({
    metrics: {
      volunteers: volunteers.length,
      pending: volunteers.filter((volunteer) => volunteer.status === "Pending").length,
      openRequests: reliefRequests.filter((reliefRequest) => reliefRequest.status === "Open").length,
      deployed: volunteers.filter((volunteer) => volunteer.status === "Deployed").length,
    },
    recentRequests: reliefRequests.filter((reliefRequest) => reliefRequest.status === "Open").slice(0, 3),
  });
});

app.get("/api/requests", (request, response) => {
  response.json(reliefRequests.filter((reliefRequest) => reliefRequest.status === "Open"));
});

app.get("/api/requests/search", (request, response) => {
  if ((request.query.skill !== undefined && typeof request.query.skill !== "string")
    || (request.query.location !== undefined && typeof request.query.location !== "string")) {
    return response.status(400).json({ error: "Skill and location filters must be single values." });
  }

  const skill = request.query.skill?.trim().toLowerCase();
  const location = request.query.location?.trim().toLowerCase();
  const matches = reliefRequests.filter((reliefRequest) => {
    const matchesSkill = !skill || reliefRequest.skillRequired.toLowerCase().includes(skill);
    const matchesLocation = !location || reliefRequest.location.toLowerCase().includes(location);
    return matchesSkill && matchesLocation;
  });

  response.json(matches);
});

app.get("/api/admin/dashboard", (_request, response) => {
  response.json({
    metrics: {
      totalVolunteers: volunteers.length,
      pendingApprovals: volunteers.filter((volunteer) => volunteer.status === "Pending").length,
      approvedVolunteers: volunteers.filter((volunteer) => volunteer.status === "Approved").length,
      deployedVolunteers: volunteers.filter((volunteer) => volunteer.status === "Deployed").length,
      activeRequests: reliefRequests.filter((reliefRequest) => reliefRequest.status === "Open").length,
    },
    volunteers,
    activeRequests: reliefRequests.filter((reliefRequest) => reliefRequest.status === "Open"),
  });
});

app.post("/admin/volunteers/:id/approve", (request, response) => {
  const volunteer = volunteers.find((entry) => entry.id === request.params.id);
  if (!volunteer) return response.status(404).json({ error: "Volunteer not found." });
  if (volunteer.status !== "Pending") {
    return response.status(409).json({ error: "Only pending volunteers can be approved." });
  }

  volunteer.status = "Approved";
  response.json({ message: `${volunteer.name} approved.`, volunteer });
});

app.post("/admin/volunteers/:id/deploy", (request, response) => {
  const volunteer = volunteers.find((entry) => entry.id === request.params.id);
  if (!volunteer) return response.status(404).json({ error: "Volunteer not found." });
  if (volunteer.status !== "Approved") {
    return response.status(409).json({ error: "Only approved volunteers can be deployed." });
  }

  const { reliefRequestId } = request.body || {};
  if (typeof reliefRequestId !== "string" || !reliefRequestId.trim()) {
    return response.status(400).json({ error: "Choose an active relief request." });
  }

  const reliefRequest = reliefRequests.find((entry) => entry.id === reliefRequestId && entry.status === "Open");
  if (!reliefRequest) return response.status(404).json({ error: "Active relief request not found." });

  volunteer.assignedRequestId = reliefRequest.id;
  volunteer.status = "Deployed";
  response.json({
    message: `${volunteer.name} deployed to ${reliefRequest.title}.`,
    volunteer,
  });
});

app.post("/api/register", (request, response) => {
  const { name, email, phone, location, skill } = request.body || {};

  if (!name?.trim() || !email?.trim() || !phone?.trim() || !location?.trim() || !skills.includes(skill)) {
    return response.status(400).json({
      error: "Please complete every field and choose a listed skill.",
    });
  }

  const volunteer = {
    id: `VOL-${Date.now()}`,
    name: name.trim(),
    email: email.trim(),
    phone: phone.trim(),
    location: location.trim(),
    skill,
    status: "Pending",
    assignedRequestId: null,
  };
  volunteers.push(volunteer);

  response.status(201).json({
    message: "Registration received. Your status is Pending approval.",
    volunteer,
  });
});

app.get("/", (_request, response) => {
  if (existsSync(frontendEntry)) return response.sendFile(frontendEntry);
  response.json({ message: "ReliefSync API is running. Start the React app in the frontend folder." });
});

app.get("/{*splat}", (request, response) => {
  if (existsSync(frontendEntry) && !request.path.startsWith("/api/")) {
    return response.sendFile(frontendEntry);
  }
  response.status(404).json({ error: "Route not found" });
});

app.listen(port, () => {
  console.log(`ReliefSync is running at http://localhost:${port}`);
});