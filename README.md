# EduSquare - Student Attendance & Academic Management System

A comprehensive web-based system for managing student attendance and academic records with role-based access control.

## Features

- Role-based authentication (Owner, Admin, HOD, Faculty, Student)
- Student attendance tracking
- Academic performance monitoring
- Timetable management
- Report generation
- Real-time analytics

## Tech Stack

- Frontend: HTML, CSS, JavaScript
- Backend: Node.js, Express
- Database: MongoDB
- Authentication: JWT

## Prerequisites

- Node.js (v14 or higher)
- MongoDB

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd edusquare
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory with the following content:
```
PORT=5000
MONGODB_URI=mongodb+srv://edu:edu@cluster0.y9d2pdl.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=edusquare-secret-key
```

4. Start the server:
```bash
npm start
```

The application will be available at `http://localhost:5000`

## Initial Setup

1. Create an owner account in MongoDB:
```javascript
{
    "name": "System Owner",
    "email": "owner@edusquare.com",
    "password": "<hashed-password>",
    "role": "owner"
}
```

2. Login as owner and create admin accounts
3. Admins can create HOD accounts
4. HODs can add faculty and students

## API Documentation

### Authentication

- POST /api/auth/login
- GET /api/auth/me

### Owner Routes

- POST /api/owner/add-admin
- GET /api/owner/admin-stats
- GET /api/owner/admins

### Admin Routes

- POST /api/admin/add-hod
- POST /api/admin/add-faculty
- GET /api/admin/staff
- GET /api/admin/stats

### HOD Routes

- GET /api/hod/faculty
- POST /api/hod/add-student
- POST /api/hod/add-subjects
- POST /api/hod/add-timetable
- GET /api/hod/student-attendance

### Faculty Routes

- POST /api/faculty/add-attendance
- POST /api/faculty/add-marks
- GET /api/faculty/timetable
- GET /api/faculty/reports

### Student Routes

- GET /api/student/attendance
- GET /api/student/marks
- GET /api/student/timetable

## Security

- JWT-based authentication
- Password hashing using bcrypt
- Role-based access control
- Input validation and sanitization

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License
