const express = require("express");
const mongoose = require("mongoose");
const path = require("path");
const cors = require('cors');

const app = express();
app.use(express.json()); // Only once

// Configure CORS to allow the specific URL
const corsOptions = {
  origin: 'http://localhost:3000',
};
app.use(cors(corsOptions));

// Connect to MongoDB
mongoose.connect("mongodb://localhost:27017/studentDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Define the Student schema and model
const studentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  rollNo: { type: String, required: true },
  scores: {
    Java: { type: Number, default: 0 },
    CPP: { type: Number, default: 0 },
    Python: { type: Number, default: 0 },
    GenAI: { type: Number, default: 0 },
    FSD: { type: Number, default: 0 },
  },
});

const Student = mongoose.model('Student', studentSchema);

// Serve static files from React app
const reactAppPath = path.join(__dirname, '..', 'client', 'build');
app.use(express.static(reactAppPath));

// Routes
// Insert a new student document
app.post("/", async (req, res) => {
  try {
    const student = new Student(req.body);
    await student.save();
    res.status(201).json({ message: "Student added successfully", student });
  } catch (err) {
    res.status(400).json({ message: "Failed to add student", error: err });
  }
});

// Update student data based on rollNo
app.put("/student/:rollNo", async (req, res) => {
  const rollNo = req.params.rollNo;
  try {
    const updatedStudent = await Student.findOneAndUpdate(
      { rollNo },
      req.body,
      { new: true, runValidators: true }
    );
    if (updatedStudent) {
      res.status(200).json({ message: "Student updated successfully", updatedStudent });
    } else {
      res.status(404).json({ message: "Student not found" });
    }
  } catch (err) {
    res.status(400).json({ message: "Failed to update student", error: err });
  }
});

// Delete a student document based on rollNo
app.delete("/student/:rollNo", async (req, res) => {
  const rollNo = req.params.rollNo;
  try {
    const deletedStudent = await Student.findOneAndDelete({ rollNo });
    if (deletedStudent) {
      res.status(200).json({ message: "Student deleted successfully", deletedStudent });
    } else {
      res.status(404).json({ message: "Student not found" });
    }
  } catch (err) {
    res.status(400).json({ message: "Failed to delete student", error: err });
  }
});

// Retrieve all students' information with GPA
app.get("/studentsGPA", async (req, res) => {
  try {
    const students = await Student.find({}, { name: 1, rollNo: 1, scores: 1 });
    const studentsWithGPA = students.map((student) => {
      const { Java, CPP, Python, GenAI, FSD } = student.scores;
      const gpa = ((Java + CPP + Python + GenAI + FSD) / 5).toFixed(2);
      return {
        name: student.name,
        rollNo: student.rollNo,
        gpa,
      };
    });
    res.status(200).json(studentsWithGPA);
  } catch (err) {
    res.status(400).json({ message: "Failed to fetch students", error: err });
  }
});

// Retrieve student details by rollNo
app.get("/student/:rollNo", async (req, res) => {
  const rollNo = req.params.rollNo;
  try {
    const student = await Student.findOne({ rollNo });
    if (student) {
      res.status(200).json(student);
    } else {
      res.status(404).json({ message: "Student not found" });
    }
  } catch (err) {
    res.status(500).json({ message: "Error fetching student data", error: err });
  }
});

// Retrieve all students
app.get("/allStudents", async (req, res) => {
  try {
    const students = await Student.find({}, { name: 1, rollNo: 1, scores: 1, _id: 0 });
    res.status(200).json(students);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch students", error });
  }
});

// Catch-all route for React app
app.get('*', (req, res) => {
  res.sendFile(path.join(reactAppPath, 'index.html'));
});

// Start the server
const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
