const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, "data.json");

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));


function ensureDataFile() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ subjects: [], attendance: {} }, null, 2));
  } else {
    try {
      JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
    } catch (error) {
      console.error("Corrupt data.json detected. Resetting file.", error);
      fs.writeFileSync(DATA_FILE, JSON.stringify({ subjects: [], attendance: {} }, null, 2));
    }
  }
}
ensureDataFile();

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "add-subject.html"));
});

app.get("/calendar", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "calendar.html"));
});

// Helper Functions
function readData() {
  try {
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
  } catch (error) {
    console.error("Error reading data.json:", error);
    throw new Error("Failed to read data.json");
  }
}

function writeData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("Error writing to data.json:", error);
    throw new Error("Failed to write data.json");
  }
}

app.get("/subjects", (req, res) => {
  try {
    const data = readData();
    res.json(data.subjects);
  } catch (error) {
    console.error("Error fetching subjects:", error);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
});

app.post("/subjects", (req, res) => {
  try {
    const { subject } = req.body;
    if (!subject) {
      return res.status(400).json({ error: "Subject is required." });
    }

    const data = readData();
    if (data.subjects.includes(subject)) {
      return res.status(400).json({ error: "Subject already exists." });
    }

    data.subjects.push(subject);
    data.attendance[subject] = {};
    writeData(data);
    res.status(201).json({ message: "Subject added successfully." });
  } catch (error) {
    console.error("Error adding subject:", error);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
});

app.get("/attendance/:subject", (req, res) => {
  try {
    const { subject } = req.params;
    const data = readData();

    if (!data.subjects.includes(subject)) {
      return res.status(404).json({ error: "Subject not found." });
    }

    res.json(data.attendance[subject] || {});
  } catch (error) {
    console.error("Error fetching attendance:", error);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
});


app.post("/attendance/:subject", (req, res) => {
  try {
    const { subject } = req.params;
    const { date, status } = req.body;

    if (!date || !status) {
      return res.status(400).json({ error: "Date and status are required." });
    }

    const data = readData();
    if (!data.subjects.includes(subject)) {
      return res.status(404).json({ error: "Subject not found." });
    }

    if (!data.attendance[subject]) {
      data.attendance[subject] = {};
    }

    data.attendance[subject][date] = status;
    writeData(data);
    res.status(200).json({ message: "Attendance updated successfully." });
  } catch (error) {
    console.error("Error updating attendance:", error);
    res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
});


app.use((err, req, res, next) => {
  console.error("Server Error:", err);
  res.status(500).json({ error: "Internal Server Error", details: err.message });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
