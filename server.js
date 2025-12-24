const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Middleware
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

// Database connection
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'nexor_university',
    charset: 'utf8mb4'
  };

let db;

async function initDatabase() {
  try {
    db = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to MySQL database');
    
    // Create database if not exists
    await db.execute(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`);
    await db.execute(`USE ${dbConfig.database}`);
    
    // Create tables
    await createTables();
    await seedData();
    
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  }
}

async function createTables() {
  try {
    // Students table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS students (
        id INT AUTO_INCREMENT PRIMARY KEY,
        roll_number VARCHAR(20) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        first_name VARCHAR(50) NOT NULL,
        last_name VARCHAR(50) NOT NULL,
        department VARCHAR(50) NOT NULL,
        semester INT NOT NULL,
        batch VARCHAR(10) NOT NULL,
        cgpa DECIMAL(3,2) DEFAULT 0.0,
        credit_hours INT DEFAULT 0,
        attendance_rate DECIMAL(5,2) DEFAULT 0.0,
        class_rank INT,
        total_students INT DEFAULT 0,
        profile_image VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Courses table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS courses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        code VARCHAR(20) UNIQUE NOT NULL,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        credits INT NOT NULL,
        type ENUM('CORE', 'ELECTIVE', 'LAB', 'SEMINAR', 'THESIS') DEFAULT 'CORE',
        department VARCHAR(50) NOT NULL,
        semester INT NOT NULL,
        instructor VARCHAR(100) NOT NULL,
        max_students INT DEFAULT 50,
        current_students INT DEFAULT 0,
        prerequisites TEXT,
        syllabus TEXT,
        objectives TEXT,
        outcomes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // Course registrations table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS course_registrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        course_id INT NOT NULL,
        semester VARCHAR(20) NOT NULL,
        academic_year VARCHAR(10) NOT NULL,
        status ENUM('REGISTERED', 'DROPPED', 'COMPLETED', 'FAILED', 'WITHDRAWN') DEFAULT 'REGISTERED',
        registered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        grade VARCHAR(5),
        gpa_points DECIMAL(3,2),
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
        UNIQUE KEY unique_registration (student_id, course_id, semester)
      )
    `);

    // Grades table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS grades (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        course_id INT NOT NULL,
        semester VARCHAR(20) NOT NULL,
        mid_term DECIMAL(5,2),
        final_term DECIMAL(5,2),
        assignment DECIMAL(5,2),
        quiz DECIMAL(5,2),
        project DECIMAL(5,2),
        total DECIMAL(5,2),
        grade VARCHAR(5),
        gpa_points DECIMAL(3,2),
        letter_grade VARCHAR(5),
        remarks TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
        UNIQUE KEY unique_grade (student_id, course_id, semester)
      )
    `);

    // Attendance table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS attendance (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        course_id INT NOT NULL,
        date DATE NOT NULL,
        status ENUM('PRESENT', 'ABSENT', 'LATE', 'EXCUSED') DEFAULT 'PRESENT',
        marked_by VARCHAR(100),
        remarks TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
        UNIQUE KEY unique_attendance (student_id, course_id, date)
      )
    `);

    // Assignments table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS assignments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        course_id INT NOT NULL,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        due_date DATETIME NOT NULL,
        max_marks DECIMAL(5,2) NOT NULL,
        weightage DECIMAL(5,2) DEFAULT 0.0,
        type ENUM('HOMEWORK', 'PROJECT', 'QUIZ', 'EXAM', 'LAB', 'PRESENTATION') DEFAULT 'HOMEWORK',
        status ENUM('ACTIVE', 'CLOSED', 'DRAFT') DEFAULT 'ACTIVE',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
      )
    `);

    // Assignment submissions table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS assignment_submissions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        assignment_id INT NOT NULL,
        student_id INT NOT NULL,
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        file_url VARCHAR(255),
        text_content TEXT,
        marks DECIMAL(5,2),
        feedback TEXT,
        status ENUM('SUBMITTED', 'GRADED', 'RETURNED', 'LATE') DEFAULT 'SUBMITTED',
        graded_at TIMESTAMP NULL,
        graded_by VARCHAR(100),
        FOREIGN KEY (assignment_id) REFERENCES assignments(id) ON DELETE CASCADE,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
        UNIQUE KEY unique_submission (assignment_id, student_id)
      )
    `);

    // Schedule table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS schedules (
        id INT AUTO_INCREMENT PRIMARY KEY,
        course_id INT NOT NULL,
        day_of_week VARCHAR(10) NOT NULL,
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        room VARCHAR(50) NOT NULL,
        building VARCHAR(50),
        semester VARCHAR(20) NOT NULL,
        type ENUM('LECTURE', 'LAB', 'TUTORIAL', 'SEMINAR') DEFAULT 'LECTURE',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
      )
    `);

    // Notifications table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS notifications (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        title VARCHAR(200) NOT NULL,
        message TEXT NOT NULL,
        type ENUM('GENERAL', 'ACADEMIC', 'REGISTRATION', 'ASSIGNMENT', 'EXAM', 'LIBRARY', 'FINANCE', 'EVENT') DEFAULT 'GENERAL',
        is_read BOOLEAN DEFAULT FALSE,
        priority ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT') DEFAULT 'MEDIUM',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
      )
    `);

    // Enrolled courses table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS enrolled_courses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        course_id INT NOT NULL,
        semester VARCHAR(20) NOT NULL,
        status VARCHAR(20) DEFAULT 'ACTIVE',
        progress DECIMAL(5,2) DEFAULT 0.0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
        FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
        UNIQUE KEY unique_enrollment (student_id, course_id, semester)
      )
    `);

    // Academic calendar table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS academic_calendar (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        description TEXT,
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        type ENUM('GENERAL', 'EXAM', 'HOLIDAY', 'REGISTRATION', 'RESULT', 'EVENT') DEFAULT 'GENERAL',
        is_important BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Departments table
    await db.execute(`
      CREATE TABLE IF NOT EXISTS departments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        code VARCHAR(10) UNIQUE NOT NULL,
        description TEXT,
        head_name VARCHAR(100),
        established DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Database tables created successfully');
  } catch (error) {
    console.error('❌ Error creating tables:', error);
  }
}

async function seedData() {
  try {
    // Check if data already exists
    const [studentCount] = await db.execute('SELECT COUNT(*) as count FROM students');
    if (studentCount[0].count > 0) {
      console.log('📊 Database already seeded');
      return;
    }

    // Insert departments
    await db.execute(`
      INSERT INTO departments (name, code, description, head_name) VALUES
      ('Computer Science', 'CS', 'Department of Computer Science and Software Engineering', 'Dr. Sarah Johnson'),
      ('Electrical Engineering', 'EE', 'Department of Electrical Engineering', 'Dr. Michael Chen'),
      ('Business Administration', 'BA', 'School of Business and Management', 'Dr. Emily Rodriguez'),
      ('Mathematics', 'MATH', 'Department of Mathematics and Statistics', 'Dr. Robert Kim'),
      ('Physics', 'PHY', 'Department of Physics', 'Dr. Lisa Anderson')
    `);

    // Insert demo student
    const hashedPassword = await bcrypt.hash('12345678', 12);
    await db.execute(`
      INSERT INTO students (roll_number, email, password, first_name, last_name, department, semester, batch, cgpa, credit_hours, attendance_rate, class_rank, total_students)
      VALUES ('23FA-003-SE', '23fa-003-se@nexor.edu', ?, 'Ali', 'Ahmed', 'Software Engineering', 4, '23FA', 3.42, 18, 92.5, 12, 85)
    `, [hashedPassword]);

    // Insert comprehensive courses
    const courses = [
      // Computer Science Courses
      ['CS101', 'Introduction to Programming', 'Fundamentals of programming using Python', 3, 'CORE', 'Computer Science', 1, 'Dr. Sarah Johnson', 60],
      ['CS102', 'Data Structures', 'Advanced data structures and algorithms', 4, 'CORE', 'Computer Science', 2, 'Dr. Michael Chen', 50],
      ['CS201', 'Object-Oriented Programming', 'OOP concepts with Java/C++', 4, 'CORE', 'Computer Science', 2, 'Dr. Emily Rodriguez', 50],
      ['CS202', 'Database Systems', 'Database design and SQL', 3, 'CORE', 'Computer Science', 3, 'Dr. Robert Kim', 45],
      ['CS203', 'Web Development', 'Frontend and backend web technologies', 3, 'CORE', 'Computer Science', 3, 'Dr. Lisa Anderson', 40],
      ['CS301', 'Software Engineering', 'Software development methodologies', 4, 'CORE', 'Computer Science', 4, 'Dr. Sarah Johnson', 35],
      ['CS302', 'Computer Networks', 'Network protocols and architectures', 3, 'CORE', 'Computer Science', 4, 'Dr. Michael Chen', 40],
      ['CS303', 'Operating Systems', 'OS concepts and implementation', 4, 'CORE', 'Computer Science', 5, 'Dr. Emily Rodriguez', 35],
      ['CS401', 'Artificial Intelligence', 'AI and machine learning fundamentals', 3, 'ELECTIVE', 'Computer Science', 6, 'Dr. Robert Kim', 30],
      ['CS402', 'Cybersecurity', 'Information security and cryptography', 3, 'ELECTIVE', 'Computer Science', 7, 'Dr. Lisa Anderson', 30],
      ['CS403', 'Cloud Computing', 'Cloud architecture and services', 3, 'ELECTIVE', 'Computer Science', 8, 'Dr. Sarah Johnson', 25],
      
      // Mathematics Courses
      ['MATH101', 'Calculus I', 'Differential and integral calculus', 4, 'CORE', 'Mathematics', 1, 'Dr. John Taylor', 60],
      ['MATH102', 'Linear Algebra', 'Matrix theory and linear transformations', 3, 'CORE', 'Mathematics', 2, 'Dr. Maria Garcia', 50],
      ['MATH201', 'Calculus II', 'Advanced calculus techniques', 4, 'CORE', 'Mathematics', 2, 'Dr. John Taylor', 50],
      ['MATH202', 'Discrete Mathematics', 'Discrete structures for computer science', 3, 'CORE', 'Mathematics', 3, 'Dr. Maria Garcia', 45],
      ['MATH301', 'Probability and Statistics', 'Statistical methods and probability theory', 3, 'CORE', 'Mathematics', 4, 'Dr. John Taylor', 40],
      
      // Electrical Engineering Courses
      ['EE101', 'Circuit Theory', 'Basic electrical circuits analysis', 3, 'CORE', 'Electrical Engineering', 1, 'Dr. David Wilson', 50],
      ['EE102', 'Digital Logic Design', 'Digital systems and logic gates', 4, 'CORE', 'Electrical Engineering', 2, 'Dr. Jennifer Lee', 45],
      ['EE201', 'Electronics I', 'Analog electronic circuits', 3, 'CORE', 'Electrical Engineering', 3, 'Dr. David Wilson', 40],
      ['EE202', 'Microprocessors', 'Computer architecture and assembly', 4, 'CORE', 'Electrical Engineering', 4, 'Dr. Jennifer Lee', 35],
      
      // Business Courses
      ['BA101', 'Introduction to Business', 'Fundamentals of business management', 3, 'CORE', 'Business Administration', 1, 'Dr. James Brown', 60],
      ['BA102', 'Business Mathematics', 'Mathematical applications in business', 3, 'CORE', 'Business Administration', 1, 'Dr. Patricia Davis', 55],
      ['BA201', 'Financial Accounting', 'Accounting principles and practices', 4, 'CORE', 'Business Administration', 2, 'Dr. James Brown', 50],
      ['BA202', 'Marketing Management', 'Marketing strategies and consumer behavior', 3, 'CORE', 'Business Administration', 3, 'Dr. Patricia Davis', 45],
      
      // Physics Courses
      ['PHY101', 'General Physics I', 'Mechanics and thermodynamics', 4, 'CORE', 'Physics', 1, 'Dr. Richard Miller', 50],
      ['PHY102', 'General Physics II', 'Electricity and magnetism', 4, 'CORE', 'Physics', 2, 'Dr. Susan White', 45],
      ['PHY201', 'Modern Physics', 'Quantum mechanics and relativity', 3, 'CORE', 'Physics', 3, 'Dr. Richard Miller', 40],
      
      // Lab Courses
      ['CS101L', 'Programming Lab', 'Practical programming exercises', 1, 'LAB', 'Computer Science', 1, 'Lab Staff', 30],
      ['CS102L', 'Data Structures Lab', 'Implementation of data structures', 1, 'LAB', 'Computer Science', 2, 'Lab Staff', 25],
      ['CS201L', 'OOP Lab', 'Object-oriented programming projects', 1, 'LAB', 'Computer Science', 2, 'Lab Staff', 25],
      ['CS202L', 'Database Lab', 'Database implementation projects', 1, 'LAB', 'Computer Science', 3, 'Lab Staff', 20],
      ['EE101L', 'Circuit Lab', 'Electrical circuit experiments', 1, 'LAB', 'Electrical Engineering', 1, 'Lab Staff', 25],
      ['PHY101L', 'Physics Lab I', 'Physics experiments and measurements', 1, 'LAB', 'Physics', 1, 'Lab Staff', 30],
      
      // Seminar Courses
      ['CS499', 'CS Seminar', 'Current topics in computer science', 1, 'SEMINAR', 'Computer Science', 8, 'Various Faculty', 50],
      ['EE499', 'EE Seminar', 'Recent advances in electrical engineering', 1, 'SEMINAR', 'Electrical Engineering', 8, 'Various Faculty', 40],
      
      // Thesis/Project Courses
      ['CS498', 'Senior Project I', 'Capstone project planning', 3, 'THESIS', 'Computer Science', 7, 'Dr. Sarah Johnson', 20],
      ['CS499', 'Senior Project II', 'Capstone project implementation', 3, 'THESIS', 'Computer Science', 8, 'Dr. Sarah Johnson', 20]
    ];

    for (const course of courses) {
      await db.execute(`
        INSERT INTO courses (code, title, description, credits, type, department, semester, instructor, max_students)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, course);
    }

    // Insert sample schedules
    const schedules = [
      [1, 'Monday', '09:00:00', '10:30:00', 'Room 101', 'CS Building', 'Fall 2024', 'LECTURE'],
      [1, 'Wednesday', '09:00:00', '10:30:00', 'Room 101', 'CS Building', 'Fall 2024', 'LECTURE'],
      [1, 'Friday', '09:00:00', '10:30:00', 'Room 101', 'CS Building', 'Fall 2024', 'LECTURE'],
      [2, 'Tuesday', '11:00:00', '12:30:00', 'Room 205', 'CS Building', 'Fall 2024', 'LECTURE'],
      [2, 'Thursday', '11:00:00', '12:30:00', 'Room 205', 'CS Building', 'Fall 2024', 'LECTURE'],
      [3, 'Monday', '14:00:00', '15:30:00', 'Room 302', 'CS Building', 'Fall 2024', 'LECTURE'],
      [3, 'Wednesday', '14:00:00', '15:30:00', 'Room 302', 'CS Building', 'Fall 2024', 'LECTURE'],
      [4, 'Tuesday', '09:00:00', '10:30:00', 'Lab 1', 'CS Building', 'Fall 2024', 'LAB'],
      [4, 'Thursday', '09:00:00', '10:30:00', 'Lab 1', 'CS Building', 'Fall 2024', 'LAB'],
    ];

    for (const schedule of schedules) {
      await db.execute(`
        INSERT INTO schedules (course_id, day_of_week, start_time, end_time, room, building, semester, type)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, schedule);
    }

    // Insert sample assignments
    const assignments = [
      [1, 'Hello World Program', 'Write your first Python program', '2024-12-20 23:59:00', 100, 10, 'HOMEWORK'],
      [2, 'Stack Implementation', 'Implement stack data structure', '2024-12-22 23:59:00', 150, 15, 'PROJECT'],
      [3, 'Bank Account System', 'Create OOP bank management system', '2024-12-25 23:59:00', 200, 20, 'PROJECT'],
      [4, 'Database Design', 'Design database for library system', '2024-12-28 23:59:00', 100, 10, 'HOMEWORK'],
    ];

    for (const assignment of assignments) {
      await db.execute(`
        INSERT INTO assignments (course_id, title, description, due_date, max_marks, weightage, type)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, assignment);
    }

    // Insert sample notifications
    const notifications = [
      [1, 'Exam Schedule Published', 'Final exams schedule for Fall 2024 has been published.', 'ACADEMIC', 'HIGH'],
      [1, 'Course Registration Open', 'Register for Spring 2025 courses before deadline.', 'REGISTRATION', 'HIGH'],
      [1, 'Library Book Due', 'Your borrowed book is due next week.', 'LIBRARY', 'MEDIUM'],
      [1, 'Assignment Reminder', 'Data Structures assignment due in 3 days.', 'ASSIGNMENT', 'MEDIUM'],
    ];

    for (const notification of notifications) {
      await db.execute(`
        INSERT INTO notifications (student_id, title, message, type, priority)
        VALUES (?, ?, ?, ?, ?)
      `, notification);
    }

    // Insert academic calendar events
    const calendarEvents = [
      ['Fall Semester Begins', 'Start of Fall 2024 semester', '2024-09-01', '2024-09-01', 'GENERAL', true],
      ['Mid-term Exams', 'Mid-term examination period', '2024-10-15', '2024-10-25', 'EXAM', true],
      ['Thanksgiving Break', 'University closed for Thanksgiving', '2024-11-28', '2024-11-29', 'HOLIDAY', true],
      ['Final Exams', 'Final examination period', '2024-12-10', '2024-12-20', 'EXAM', true],
      ['Spring Registration', 'Course registration for Spring 2025', '2024-11-01', '2024-11-15', 'REGISTRATION', true],
    ];

    for (const event of calendarEvents) {
      await db.execute(`
        INSERT INTO academic_calendar (title, description, start_date, end_date, type, is_important)
        VALUES (?, ?, ?, ?, ?, ?)
      `, event);
    }

    console.log('🌱 Database seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding data:', error);
  }
}

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// API Routes

// Authentication routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { rollNumber, password } = req.body;

    if (!rollNumber || !password) {
      return res.status(400).json({ message: 'Roll number and password required' });
    }

    const [students] = await db.execute(
      'SELECT * FROM students WHERE roll_number = ?',
      [rollNumber]
    );

    if (students.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const student = students[0];
    const isPasswordValid = await bcrypt.compare(password, student.password);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: student.id, rollNumber: student.roll_number },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    // Remove password from response
    delete student.password;

    res.json({
      message: 'Login successful',
      token,
      student
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.get('/api/student/dashboard', authenticateToken, async (req, res) => {
  try {
    const studentId = req.user.id;

    // Get student information
    const [students] = await db.execute(
      'SELECT * FROM students WHERE id = ?',
      [studentId]
    );

    if (students.length === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const student = students[0];

    // Get enrolled courses for current semester
    const [enrolledCourses] = await db.execute(`
      SELECT ec.*, c.code, c.title, c.credits, c.instructor, c.department
      FROM enrolled_courses ec
      JOIN courses c ON ec.course_id = c.id
      WHERE ec.student_id = ? AND ec.semester = 'Fall 2024'
    `, [studentId]);

    // Get recent grades
    const [grades] = await db.execute(`
      SELECT g.*, c.code, c.title, c.credits
      FROM grades g
      JOIN courses c ON g.course_id = c.id
      WHERE g.student_id = ?
      ORDER BY g.created_at DESC
      LIMIT 5
    `, [studentId]);

    // Get upcoming assignments
    const [assignments] = await db.execute(`
      SELECT a.*, c.code, c.title
      FROM assignments a
      JOIN courses c ON a.course_id = c.id
      JOIN enrolled_courses ec ON a.course_id = ec.course_id AND ec.student_id = ?
      WHERE a.due_date > NOW() AND a.status = 'ACTIVE'
      ORDER BY a.due_date ASC
      LIMIT 5
    `, [studentId]);

    // Get notifications
    const [notifications] = await db.execute(`
      SELECT * FROM notifications
      WHERE student_id = ?
      ORDER BY created_at DESC
      LIMIT 10
    `, [studentId]);

    // Get attendance rate
    const [attendanceStats] = await db.execute(`
      SELECT 
        COUNT(*) as total_classes,
        SUM(CASE WHEN status = 'PRESENT' THEN 1 ELSE 0 END) as attended_classes
      FROM attendance a
      JOIN enrolled_courses ec ON a.course_id = ec.course_id
      WHERE a.student_id = ? AND ec.semester = 'Fall 2024'
    `, [studentId]);

    let attendanceRate = 0;
    if (attendanceStats[0].total_classes > 0) {
      attendanceRate = (attendanceStats[0].attended_classes / attendanceStats[0].total_classes) * 100;
    }

    res.json({
      student,
      enrolledCourses,
      grades,
      assignments,
      notifications,
      attendanceRate: Math.round(attendanceRate * 100) / 100
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all courses for registration
app.get('/api/courses', authenticateToken, async (req, res) => {
  try {
    const { department, semester, type } = req.query;
    
    let query = 'SELECT * FROM courses WHERE 1=1';
    const params = [];

    if (department) {
      query += ' AND department = ?';
      params.push(department);
    }

    if (semester) {
      query += ' AND semester = ?';
      params.push(semester);
    }

    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }

    query += ' ORDER BY code';

    const [courses] = await db.execute(query, params);
    res.json(courses);
  } catch (error) {
    console.error('Courses error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Course registration
app.post('/api/register-course', authenticateToken, async (req, res) => {
  try {
    const { courseId, semester } = req.body;
    const studentId = req.user.id;

    // Check if student is already registered
    const [existing] = await db.execute(`
      SELECT * FROM course_registrations 
      WHERE student_id = ? AND course_id = ? AND semester = ?
    `, [studentId, courseId, semester]);

    if (existing.length > 0) {
      return res.status(400).json({ message: 'Already registered for this course' });
    }

    // Check course capacity
    const [courseInfo] = await db.execute(
      'SELECT max_students, current_students, credits FROM courses WHERE id = ?',
      [courseId]
    );

    if (courseInfo[0].current_students >= courseInfo[0].max_students) {
      return res.status(400).json({ message: 'Course is full' });
    }

    // Check credit limit (21 credits max)
    const [currentCredits] = await db.execute(`
      SELECT SUM(c.credits) as total_credits
      FROM course_registrations cr
      JOIN courses c ON cr.course_id = c.id
      WHERE cr.student_id = ? AND cr.semester = ? AND cr.status = 'REGISTERED'
    `, [studentId, semester]);

    const totalCredits = (currentCredits[0].total_credits || 0) + courseInfo[0].credits;
    if (totalCredits > 21) {
      return res.status(400).json({ message: 'Credit limit exceeded (max 21 credits)' });
    }

    // Register for course
    await db.execute(`
      INSERT INTO course_registrations (student_id, course_id, semester, academic_year, status)
      VALUES (?, ?, ?, '2024-2025', 'REGISTERED')
    `, [studentId, courseId, semester]);

    // Update course current students
    await db.execute(
      'UPDATE courses SET current_students = current_students + 1 WHERE id = ?',
      [courseId]
    );

    // Add to enrolled courses
    await db.execute(`
      INSERT INTO enrolled_courses (student_id, course_id, semester, status)
      VALUES (?, ?, ?, 'ACTIVE')
    `, [studentId, courseId, semester]);

    res.json({ message: 'Course registered successfully' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get student schedule
app.get('/api/schedule', authenticateToken, async (req, res) => {
  try {
    const studentId = req.user.id;
    const { semester } = req.query || 'Fall 2024';

    const [schedule] = await db.execute(`
      SELECT s.*, c.code, c.title, c.instructor, c.type as course_type
      FROM schedules s
      JOIN courses c ON s.course_id = c.id
      JOIN enrolled_courses ec ON s.course_id = ec.course_id
      WHERE ec.student_id = ? AND s.semester = ?
      ORDER BY s.day_of_week, s.start_time
    `, [studentId, semester]);

    res.json(schedule);
  } catch (error) {
    console.error('Schedule error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get student profile
app.get('/api/profile', authenticateToken, async (req, res) => {
  try {
    const studentId = req.user.id;

    const [student] = await db.execute(
      'SELECT * FROM students WHERE id = ?',
      [studentId]
    );

    if (student.length === 0) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Get academic history
    const [academicHistory] = await db.execute(`
      SELECT cr.*, c.code, c.title, c.credits, c.type
      FROM course_registrations cr
      JOIN courses c ON cr.course_id = c.id
      WHERE cr.student_id = ?
      ORDER BY cr.academic_year, cr.semester
    `, [studentId]);

    res.json({
      student: student[0],
      academicHistory
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update profile
app.put('/api/profile', authenticateToken, async (req, res) => {
  try {
    const studentId = req.user.id;
    const { firstName, lastName, email, profileImage } = req.body;

    await db.execute(`
      UPDATE students 
      SET first_name = ?, last_name = ?, email = ?, profile_image = ?
      WHERE id = ?
    `, [firstName, lastName, email, profileImage, studentId]);

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get academic calendar
app.get('/api/calendar', async (req, res) => {
  try {
    const [events] = await db.execute(`
      SELECT * FROM academic_calendar 
      ORDER BY start_date ASC
    `);

    res.json(events);
  } catch (error) {
    console.error('Calendar error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Serve frontend files
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/login.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/dashboard.html'));
});

app.get('/registration', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/registration.html'));
});

app.get('/courses', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/courses.html'));
});

app.get('/timetable', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/timetable.html'));
});

app.get('/profile', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/profile.html'));
});

// Start server
async function startServer() {
  await initDatabase();
  
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📚 Student Portal ready!`);
    console.log(`🔑 Demo credentials: 23FA-003-SE / 12345678`);
  });
}

startServer().catch(console.error);

module.exports = app;