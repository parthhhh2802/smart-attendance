# Smart Scan Track - Backend

A comprehensive QR-based attendance system backend built with Express.js and MongoDB.

## Features

- **QR-Based Attendance**: Generate unique QR codes for sessions with GPS validation
- **Session Management**: Support for both internship (daily QR) and industrial visit (single QR)
- **Role-Based Access Control**: Admin, Faculty, Company, and Student roles
- **GPS Validation**: Location-based attendance verification
- **Feedback System**: Mandatory student feedback with AI sentiment analysis
- **Analytics & Reports**: Comprehensive attendance and feedback analytics
- **PDF Generation**: Export session reports with attendance and feedback data
- **Real-time Updates**: Live attendance tracking and notifications

## Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT with bcrypt password hashing
- **QR Generation**: qrcode library
- **PDF Generation**: PDFKit
- **Security**: Helmet, CORS, Rate limiting

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd smart-scan-track/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Configuration**
   Create a `.env` file in the backend directory:
   ```env
   NODE_ENV=development
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/smart-scan-track
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   GOOGLE_MAPS_API_KEY=your-google-maps-api-key-here
   OPENAI_API_KEY=your-openai-api-key-here
   FRONTEND_URL=http://localhost:3000
   ```

4. **Start MongoDB**
   Make sure MongoDB is running on your system.

5. **Seed the database (optional)**
   ```bash
   npm run seed
   ```

6. **Start the server**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile
- `PUT /api/auth/change-password` - Change password

### Sessions
- `POST /api/sessions` - Create session
- `GET /api/sessions` - Get all sessions
- `GET /api/sessions/today` - Get today's sessions (students)
- `GET /api/sessions/:id` - Get session by ID
- `PUT /api/sessions/:id` - Update session
- `POST /api/sessions/:id/register` - Register student for session
- `DELETE /api/sessions/:id/register` - Unregister student
- `GET /api/sessions/:id/qr` - Get QR code for session
- `POST /api/sessions/:id/regenerate-qr` - Regenerate QR codes

### Attendance
- `POST /api/attendance/mark` - Mark attendance with QR
- `GET /api/attendance/session/:sessionId` - Get session attendance
- `GET /api/attendance/student/:studentId` - Get student attendance
- `GET /api/attendance/my` - Get current user's attendance
- `PUT /api/attendance/:id` - Update attendance
- `POST /api/attendance/:id/verify` - Verify attendance

### Feedback
- `POST /api/feedback` - Submit feedback
- `GET /api/feedback/session/:sessionId` - Get session feedback
- `GET /api/feedback/my` - Get current user's feedback
- `GET /api/feedback/:id` - Get specific feedback
- `PUT /api/feedback/:id` - Update feedback
- `DELETE /api/feedback/:id` - Delete feedback
- `GET /api/feedback/analytics/session/:sessionId` - Get feedback analytics

### Reports
- `GET /api/reports/dashboard` - Get dashboard analytics
- `GET /api/reports/attendance/:sessionId` - Get attendance report
- `GET /api/reports/student/:studentId` - Get student report
- `GET /api/reports/pdf/session/:sessionId` - Generate PDF report
- `GET /api/reports/export/attendance/:sessionId` - Export attendance data

### Users
- `GET /api/users/profile` - Get current user profile
- `PUT /api/users/profile` - Update current user profile
- `GET /api/users/students` - Get all students
- `GET /api/users/faculty` - Get all faculty
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `GET /api/users/company/:companyId` - Get users by company
- `POST /api/users/bulk-register` - Bulk register students
- `GET /api/users/search` - Search users

## Database Models

### User
- Basic info (name, email, password)
- Role (student, faculty, admin, company)
- Student ID (for students)
- Company association
- Profile information

### Company
- Company details (name, description, industry)
- Address with coordinates
- Contact information
- Admin user reference

### Session
- Session details (title, description, type)
- Date range (start/end dates)
- Location with GPS coordinates and radius
- Faculty and company references
- Student registrations
- QR codes (daily for internship, single for industrial visit)

### Attendance
- Session and student references
- Date and time stamps
- GPS location validation
- Status (present, absent, late, excused)
- Device information

### Feedback
- Session and student references
- Rating (1-5 stars)
- Custom questions with different types
- Overall feedback text
- AI sentiment analysis
- Anonymous flag for company view

## Role-Based Access Control

### Admin
- Full access to all features
- User management
- System-wide analytics

### Faculty
- Create and manage sessions
- View attendance for their sessions
- Generate QR codes
- Access to session analytics

### Company
- View company-specific data
- Access to anonymous feedback
- Company analytics

### Student
- View registered sessions
- Mark attendance with QR codes
- Submit mandatory feedback
- View personal attendance history

## QR Code System

### Internship Sessions
- Daily QR codes generated automatically
- Each day has a unique QR code
- QR codes expire at end of day
- Students must scan daily

### Industrial Visit Sessions
- Single QR code for the entire session
- QR code valid for session duration
- One-time attendance marking

## GPS Validation

- Uses Haversine formula for distance calculation
- Configurable radius for each session
- Location validation required for attendance
- Stores distance and validation status

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control
- Rate limiting
- CORS protection
- Helmet security headers
- Input validation and sanitization

## Error Handling

- Comprehensive error handling middleware
- Structured error responses
- Logging for debugging
- User-friendly error messages

## Development

### Scripts
```bash
npm run dev      # Start development server with nodemon
npm start        # Start production server
npm run seed     # Seed database with demo data
```

### Environment Variables
- `NODE_ENV`: Environment (development/production)
- `PORT`: Server port
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT tokens
- `GOOGLE_MAPS_API_KEY`: Google Maps API key
- `OPENAI_API_KEY`: OpenAI API key for sentiment analysis
- `FRONTEND_URL`: Frontend application URL

## Demo Data

The seed script creates demo accounts for testing:

- **Admin**: admin@example.com / admin123
- **Faculty**: sarah.johnson@techcorp.com / faculty123
- **Company**: ceo@techcorp.com / company123
- **Student**: alice.smith@student.com / student123

All passwords follow the pattern: `role123`

## API Response Format

### Success Response
```json
{
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response
```json
{
  "message": "Error description",
  "error": "Detailed error info (development only)"
}
```

## Testing

Test the API endpoints using tools like:
- Postman
- Insomnia
- cURL
- Thunder Client (VS Code extension)

## Deployment

1. Set production environment variables
2. Build the application
3. Use PM2 or similar process manager
4. Set up reverse proxy (Nginx)
5. Configure SSL certificates
6. Set up monitoring and logging

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please contact the development team or create an issue in the repository.
