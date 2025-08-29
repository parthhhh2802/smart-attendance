const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const User = require('./models/User');
const Company = require('./models/Company');
const Session = require('./models/Session');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/smart-scan-track', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB for seeding'))
.catch(err => console.error('MongoDB connection error:', err));

// Demo data
const demoData = {
  companies: [
    {
      name: 'TechCorp Solutions',
      description: 'Leading technology solutions provider',
      industry: 'Technology',
      address: {
        street: '123 Tech Street',
        city: 'Silicon Valley',
        state: 'CA',
        country: 'USA',
        zipCode: '94025',
        coordinates: { lat: 37.4419, lng: -122.1430 }
      },
      contact: {
        email: 'info@techcorp.com',
        phone: '+1-555-0123',
        website: 'https://techcorp.com'
      }
    },
    {
      name: 'Innovate Industries',
      description: 'Innovative industrial solutions',
      industry: 'Manufacturing',
      address: {
        street: '456 Innovation Drive',
        city: 'Austin',
        state: 'TX',
        country: 'USA',
        zipCode: '73301',
        coordinates: { lat: 30.2672, lng: -97.7431 }
      },
      contact: {
        email: 'contact@innovate.com',
        phone: '+1-555-0456',
        website: 'https://innovate.com'
      }
    }
  ],
  users: [
    // Admin user
    {
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'admin123',
      role: 'admin',
      phone: '+1-555-0000',
      department: 'Administration'
    },
    // Faculty users
    {
      name: 'Dr. Sarah Johnson',
      email: 'sarah.johnson@techcorp.com',
      password: 'faculty123',
      role: 'faculty',
      phone: '+1-555-0001',
      department: 'Computer Science',
      companyName: 'TechCorp Solutions'
    },
    {
      name: 'Prof. Michael Chen',
      email: 'michael.chen@innovate.com',
      password: 'faculty123',
      role: 'faculty',
      phone: '+1-555-0002',
      department: 'Engineering',
      companyName: 'Innovate Industries'
    },
    // Company admin users
    {
      name: 'CEO TechCorp',
      email: 'ceo@techcorp.com',
      password: 'company123',
      role: 'company',
      phone: '+1-555-0003',
      companyName: 'TechCorp Solutions'
    },
    {
      name: 'CEO Innovate',
      email: 'ceo@innovate.com',
      password: 'company123',
      role: 'company',
      phone: '+1-555-0004',
      companyName: 'Innovate Industries'
    },
    // Student users
    {
      name: 'Alice Smith',
      email: 'alice.smith@student.com',
      password: 'student123',
      role: 'student',
      studentId: 'STU001',
      phone: '+1-555-0005',
      department: 'Computer Science',
      companyName: 'TechCorp Solutions'
    },
    {
      name: 'Bob Wilson',
      email: 'bob.wilson@student.com',
      password: 'student123',
      role: 'student',
      studentId: 'STU002',
      phone: '+1-555-0006',
      department: 'Computer Science',
      companyName: 'TechCorp Solutions'
    },
    {
      name: 'Carol Davis',
      email: 'carol.davis@student.com',
      password: 'student123',
      role: 'student',
      studentId: 'STU003',
      phone: '+1-555-0007',
      department: 'Engineering',
      companyName: 'Innovate Industries'
    },
    {
      name: 'David Brown',
      email: 'david.brown@student.com',
      password: 'student123',
      role: 'student',
      studentId: 'STU004',
      phone: '+1-555-0008',
      department: 'Engineering',
      companyName: 'Innovate Industries'
    }
  ],
  sessions: [
    {
      title: 'Summer Internship 2024',
      description: 'Comprehensive summer internship program for computer science students',
      type: 'internship',
      startDate: new Date('2024-06-01'),
      endDate: new Date('2024-08-31'),
      location: {
        address: '123 Tech Street, Silicon Valley, CA 94025',
        coordinates: { lat: 37.4419, lng: -122.1430 },
        radius: 100
      },
      companyName: 'TechCorp Solutions',
      maxStudents: 10
    },
    {
      title: 'Industrial Visit - Manufacturing Plant',
      description: 'One-day visit to manufacturing facility',
      type: 'industrial_visit',
      startDate: new Date('2024-07-15'),
      endDate: new Date('2024-07-15'),
      location: {
        address: '456 Innovation Drive, Austin, TX 73301',
        coordinates: { lat: 30.2672, lng: -97.7431 },
        radius: 150
      },
      companyName: 'Innovate Industries',
      maxStudents: 20
    }
  ]
};

async function seedDatabase() {
  try {
    console.log('Starting database seeding...');

    // Clear existing data
    await User.deleteMany({});
    await Company.deleteMany({});
    await Session.deleteMany({});

    console.log('Cleared existing data');

    // Create companies
    const companies = [];
    for (const companyData of demoData.companies) {
      const company = new Company(companyData);
      await company.save();
      companies.push(company);
      console.log(`Created company: ${company.name}`);
    }

    // Create users
    const users = [];
    for (const userData of demoData.users) {
      const { companyName, ...userFields } = userData;
      
      // Find company if specified
      let companyId = null;
      if (companyName) {
        const company = companies.find(c => c.name === companyName);
        if (company) {
          companyId = company._id;
        }
      }

      const user = new User({
        ...userFields,
        company: companyId
      });

      await user.save();
      users.push(user);
      console.log(`Created user: ${user.name} (${user.role})`);

      // Update company admin if this is a company admin user
      if (user.role === 'company' && companyId) {
        await Company.findByIdAndUpdate(companyId, { admin: user._id });
      }
    }

    // Create sessions
    for (const sessionData of demoData.sessions) {
      const { companyName, ...sessionFields } = sessionData;
      
      // Find company and faculty
      const company = companies.find(c => c.name === companyName);
      const faculty = users.find(u => u.role === 'faculty' && u.company?.toString() === company?._id.toString());

      if (company && faculty) {
        const session = new Session({
          ...sessionFields,
          faculty: faculty._id,
          company: company._id
        });

        // Generate QR codes based on session type
        if (session.type === 'internship') {
          session.generateDailyQRCodes();
        } else {
          session.generateIndustrialVisitQR();
        }

        await session.save();
        console.log(`Created session: ${session.title}`);

        // Register students for sessions
        const students = users.filter(u => u.role === 'student' && u.company?.toString() === company._id.toString());
        for (const student of students) {
          session.students.push({
            student: student._id,
            registeredAt: new Date()
          });
        }
        await session.save();
        console.log(`Registered ${students.length} students for session: ${session.title}`);
      }
    }

    console.log('\nDatabase seeding completed successfully!');
    console.log('\nDemo Account Details:');
    console.log('=====================');
    console.log('Admin: admin@example.com / admin123');
    console.log('Faculty: sarah.johnson@techcorp.com / faculty123');
    console.log('Company: ceo@techcorp.com / company123');
    console.log('Student: alice.smith@student.com / student123');
    console.log('\nAll passwords are: role123 (e.g., admin123, faculty123, etc.)');

  } catch (error) {
    console.error('Seeding error:', error);
  } finally {
    mongoose.connection.close();
    console.log('Database connection closed');
  }
}

// Run seeding
seedDatabase();
