# Smart Scan Track - QR-Based Attendance System

A comprehensive, modern attendance management system that uses QR codes and GPS validation for tracking student attendance during internships and industrial visits.

## 🚀 Features

### Core Functionality
- **QR-Based Attendance**: Generate unique QR codes for each session/event
- **GPS Validation**: Students must be within specified radius to mark attendance
- **Session Management**: Support for both internship (daily QR) and industrial visit (single QR)
- **Role-Based Access**: Admin, Faculty, Company, and Student roles with appropriate permissions

### Session Types
- **Internship Sessions**: Daily QR codes generated automatically for extended periods
- **Industrial Visits**: Single QR code for one-time events

### Advanced Features
- **Mandatory Feedback**: Students must provide feedback after attendance
- **AI Sentiment Analysis**: Automatic analysis of written feedback
- **Analytics Dashboard**: Comprehensive attendance and feedback reports
- **PDF Export**: Generate detailed session reports
- **Real-time Tracking**: Live attendance monitoring

## 🛠️ Tech Stack

### Frontend
- **React.js** - Modern UI framework
- **Bootstrap 5** - Responsive CSS framework
- **React Router** - Client-side routing
- **React Toastify** - Notifications

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - ODM for MongoDB
- **JWT** - Authentication
- **bcryptjs** - Password hashing

### Additional Libraries
- **qrcode** - QR code generation
- **PDFKit** - PDF generation
- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4.4 or higher)
- npm or yarn
- Modern web browser

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd smart-scan-track
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create `.env` file:
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/smart-scan-track
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
GOOGLE_MAPS_API_KEY=your-google-maps-api-key-here
OPENAI_API_KEY=your-openai-api-key-here
FRONTEND_URL=http://localhost:3000
```

Start MongoDB and run:
```bash
npm run seed    # Populate with demo data
npm run dev     # Start development server
```

### 3. Frontend Setup
```bash
cd ../
npm install
npm run dev
```

### 4. Access the Application
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 👥 Demo Accounts

The system comes with pre-configured demo accounts:

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@example.com | admin123 |
| **Faculty** | sarah.johnson@techcorp.com | faculty123 |
| **Company** | ceo@techcorp.com | company123 |
| **Student** | alice.smith@student.com | student123 |

All passwords follow the pattern: `role123`

## 🏗️ System Architecture

### Database Models

#### User
- Basic information (name, email, password)
- Role-based access control
- Company association
- Profile management

#### Company
- Company details and contact information
- Address with GPS coordinates
- Admin user reference

#### Session
- Session configuration and details
- Date range management
- Location settings with radius
- QR code generation logic

#### Attendance
- Attendance records with timestamps
- GPS location validation
- Device information tracking
- Status management (present, absent, late, excused)

#### Feedback
- Student feedback collection
- Rating system (1-5 stars)
- Custom question types
- AI sentiment analysis

### API Endpoints

#### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `PUT /api/auth/profile` - Update profile

#### Sessions
- `POST /api/sessions` - Create session
- `GET /api/sessions` - Get all sessions
- `GET /api/sessions/today` - Get today's sessions
- `GET /api/sessions/:id/qr` - Get QR code

#### Attendance
- `POST /api/attendance/mark` - Mark attendance
- `GET /api/attendance/session/:id` - Get session attendance
- `GET /api/attendance/student/:id` - Get student attendance

#### Feedback
- `POST /api/feedback` - Submit feedback
- `GET /api/feedback/session/:id` - Get session feedback
- `GET /api/feedback/analytics/:id` - Get feedback analytics

#### Reports
- `GET /api/reports/dashboard` - Dashboard analytics
- `GET /api/reports/pdf/:id` - Generate PDF report
- `GET /api/reports/export/:id` - Export data

## 🔐 Security Features

- **JWT Authentication** - Secure token-based authentication
- **Password Hashing** - bcrypt password encryption
- **Role-Based Access Control** - Granular permission system
- **Rate Limiting** - API abuse prevention
- **CORS Protection** - Cross-origin request security
- **Input Validation** - Data sanitization and validation
- **Helmet Security** - HTTP header security

## 📱 User Roles & Permissions

### Admin
- Full system access
- User management
- System-wide analytics
- All session management

### Faculty
- Create and manage sessions
- Generate QR codes
- View attendance reports
- Access session analytics
- Manage student registrations

### Company
- View company-specific data
- Access anonymous feedback
- Company analytics
- Session overview

### Student
- View registered sessions
- Mark attendance with QR codes
- Submit mandatory feedback
- View personal attendance history
- Access today's sessions

## 🔄 Workflow

### Internship Session Flow
1. Faculty creates internship session with date range
2. System generates daily QR codes automatically
3. Students register for the session
4. Daily attendance marking with QR codes
5. GPS validation for location verification
6. Mandatory feedback submission
7. Analytics and reporting

### Industrial Visit Flow
1. Faculty creates industrial visit session
2. System generates single QR code
3. Students register for the session
4. One-time attendance marking on visit date
5. GPS validation and feedback collection
6. Session completion and reporting

## 📊 Analytics & Reporting

### Dashboard Metrics
- Total sessions and active sessions
- Student attendance rates
- Feedback ratings and sentiment
- Company performance metrics

### Export Options
- PDF reports with attendance details
- CSV export for data analysis
- Feedback analytics with sentiment scores
- Student performance reports

## 🚀 Deployment

### Backend Deployment
1. Set production environment variables
2. Use PM2 or similar process manager
3. Set up reverse proxy (Nginx)
4. Configure SSL certificates
5. Set up monitoring and logging

### Frontend Deployment
1. Build the application (`npm run build`)
2. Deploy to static hosting (Netlify, Vercel, etc.)
3. Configure environment variables
4. Set up custom domain

## 🧪 Testing

### API Testing
- Use Postman, Insomnia, or Thunder Client
- Test all endpoints with different user roles
- Verify authentication and authorization
- Test error handling and validation

### Frontend Testing
- Test responsive design on different devices
- Verify form validation and submission
- Test navigation and routing
- Check accessibility features

## 🔧 Configuration

### Environment Variables
- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port
- `MONGODB_URI` - Database connection string
- `JWT_SECRET` - JWT signing secret
- `GOOGLE_MAPS_API_KEY` - Google Maps integration
- `OPENAI_API_KEY` - AI sentiment analysis

### Database Configuration
- MongoDB connection settings
- Index optimization
- Data validation rules
- Backup and recovery procedures

## 📈 Performance Optimization

### Backend
- Database indexing
- Query optimization
- Caching strategies
- Rate limiting

### Frontend
- Code splitting
- Lazy loading
- Image optimization
- Bundle optimization

## 🐛 Troubleshooting

### Common Issues
1. **MongoDB Connection Error**
   - Check if MongoDB is running
   - Verify connection string
   - Check network connectivity

2. **JWT Token Issues**
   - Verify JWT_SECRET is set
   - Check token expiration
   - Clear browser storage

3. **QR Code Generation**
   - Verify session dates
   - Check session type configuration
   - Regenerate QR codes if needed

### Debug Mode
Enable debug logging by setting `NODE_ENV=development` and check console output for detailed error information.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

### Development Guidelines
- Follow existing code style
- Add proper error handling
- Include input validation
- Write clear documentation
- Test thoroughly

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review troubleshooting section
- Contact the development team

## 🔮 Future Enhancements

- **Real-time Notifications** - WebSocket integration
- **Mobile App** - React Native application
- **Advanced Analytics** - Machine learning insights
- **Integration APIs** - Third-party system integration
- **Offline Support** - Service worker implementation
- **Multi-language** - Internationalization support

## 📚 Additional Resources

- [React Documentation](https://reactjs.org/)
- [Express.js Guide](https://expressjs.com/)
- [MongoDB Manual](https://docs.mongodb.com/)
- [JWT Introduction](https://jwt.io/introduction/)
- [Bootstrap Documentation](https://getbootstrap.com/)

---

**Smart Scan Track** - Making attendance tracking smart, secure, and efficient! 🎯
