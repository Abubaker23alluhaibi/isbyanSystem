const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Server is running',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/customers', require('./routes/customers'));
app.use('/api/messages', require('./routes/messages'));
app.use('/api/templates', require('./routes/templates'));
app.use('/api/sendlogs', require('./routes/sendlogs'));
app.use('/api/reports', require('./routes/reports'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'حدث خطأ في الخادم',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// MongoDB Connection (Optional - for development without MongoDB)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/istbyan_system';
const USE_MONGODB = process.env.USE_MONGODB !== 'false'; // Default to true, set to 'false' to disable

// Function to create default admin user
const createDefaultAdmin = async () => {
  try {
    const User = require('./models/User');
    const adminExists = await User.findOne({ username: 'admin' });
    
    if (!adminExists) {
      const admin = new User({
        username: 'admin',
        email: 'admin@istbyan.com',
        password: 'admin123',
        name: 'مدير النظام',
        role: 'admin'
      });
      
      await admin.save();
      console.log('✅ تم إنشاء مستخدم admin افتراضي');
      console.log('📝 بيانات تسجيل الدخول:');
      console.log('   اسم المستخدم: admin');
      console.log('   كلمة المرور: admin123');
    } else {
      console.log('ℹ️  مستخدم admin موجود بالفعل');
    }
  } catch (error) {
    console.error('⚠️  خطأ في إنشاء مستخدم admin:', error.message);
  }
};

if (USE_MONGODB) {
  mongoose.connect(MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('✅ MongoDB Connected');
    // Create default admin user after connection
    createDefaultAdmin();
  })
  .catch(err => {
    console.warn('⚠️  MongoDB Connection Error (continuing without database):', err.message);
    console.log('💡 النظام يعمل بدون قاعدة بيانات - البيانات لن تُحفظ');
  });
} else {
  console.log('ℹ️  MongoDB disabled - النظام يعمل بدون قاعدة بيانات');
}

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

