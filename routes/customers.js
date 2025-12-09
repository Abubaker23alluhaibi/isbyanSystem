const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const multer = require('multer');
const xlsx = require('xlsx');
const validator = require('validator');

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Get all customers
router.get('/', async (req, res) => {
  try {
    // Check if MongoDB is connected
    const mongoose = require('mongoose');
    if (mongoose.connection.readyState !== 1) {
      console.log('MongoDB not connected, returning empty array');
      return res.json([]);
    }

    const { serviceType } = req.query;
    const query = serviceType ? { serviceType } : {};
    
    // Add timeout to prevent hanging
    const customers = await Promise.race([
      Customer.find(query).sort({ createdAt: -1 }),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout')), 5000)
      )
    ]);
    
    res.json(customers || []);
  } catch (error) {
    console.error('Error fetching customers:', error);
    // Return empty array if MongoDB is not connected or timeout
    if (error.name === 'MongooseServerSelectionError' || 
        error.message.includes('ECONNREFUSED') || 
        error.message.includes('timeout') ||
        error.name === 'MongoNetworkError') {
      return res.json([]);
    }
    res.status(500).json({ 
      error: 'حدث خطأ في جلب قائمة الزبائن',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Add a single customer
router.post('/', async (req, res) => {
  try {
    const { name, phone, notes, serviceType, serviceDate } = req.body;

    if (!phone || !serviceType) {
      return res.status(400).json({ error: 'رقم الهاتف ونوع الخدمة مطلوبان' });
    }

    // Validate phone number - more flexible validation
    let cleanPhone = phone.replace(/\s+/g, '').replace(/[-\s()]/g, '');
    
    // Remove leading + or 00
    if (cleanPhone.startsWith('+')) {
      cleanPhone = cleanPhone.substring(1);
    }
    if (cleanPhone.startsWith('00')) {
      cleanPhone = cleanPhone.substring(2);
    }
    
    // Check if it's a valid phone number (9-15 digits)
    const phoneRegex = /^[0-9]{9,15}$/;
    if (!phoneRegex.test(cleanPhone)) {
      return res.status(400).json({ error: 'رقم الهاتف غير صحيح. يجب أن يحتوي على 9-15 رقم' });
    }

    const customer = new Customer({
      name: name || '',
      phone: cleanPhone,
      notes: notes || '',
      serviceType,
      serviceDate: serviceDate ? new Date(serviceDate) : new Date()
    });

    await customer.save();
    res.status(201).json(customer);
  } catch (error) {
    // If MongoDB is not connected, return mock response
    if (error.name === 'MongooseServerSelectionError' || error.message.includes('ECONNREFUSED')) {
      return res.status(201).json({
        _id: 'mock_' + Date.now(),
        name: req.body.name || '',
        phone: req.body.phone,
        notes: req.body.notes || '',
        serviceType: req.body.serviceType,
        serviceDate: req.body.serviceDate ? new Date(req.body.serviceDate) : new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
    res.status(500).json({ error: error.message });
  }
});

// Import customers from Excel
router.post('/import', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'لم يتم رفع ملف' });
    }

    const { serviceType } = req.body;
    if (!serviceType) {
      return res.status(400).json({ error: 'نوع الخدمة مطلوب' });
    }

    // Read Excel file
    const workbook = xlsx.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    const customers = [];
    const errors = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const phone = row.Phone || row.phone || row['رقم الهاتف'];
      const name = row.Name || row.name || row['الاسم'] || '';
      const notes = row.Notes || row.notes || row['ملاحظات'] || '';

      if (!phone) {
        errors.push(`الصف ${i + 2}: رقم الهاتف مفقود`);
        continue;
      }

      // Clean phone number - more flexible validation
      let cleanPhone = String(phone).replace(/\s+/g, '').replace(/[-\s()]/g, '');
      
      // Remove leading + or 00
      if (cleanPhone.startsWith('+')) {
        cleanPhone = cleanPhone.substring(1);
      }
      if (cleanPhone.startsWith('00')) {
        cleanPhone = cleanPhone.substring(2);
      }
      
      // Check if it's a valid phone number (9-15 digits)
      const phoneRegex = /^[0-9]{9,15}$/;
      if (!phoneRegex.test(cleanPhone)) {
        errors.push(`الصف ${i + 2}: رقم الهاتف غير صحيح (${cleanPhone}) - يجب أن يحتوي على 9-15 رقم`);
        continue;
      }

      try {
        const customer = new Customer({
          name: name || '',
          phone: cleanPhone,
          notes: notes || '',
          serviceType,
          serviceDate: new Date()
        });
        await customer.save();
        customers.push(customer);
      } catch (error) {
        errors.push(`الصف ${i + 2}: ${error.message}`);
      }
    }

    res.json({
      success: true,
      imported: customers.length,
      errors: errors.length > 0 ? errors : undefined,
      customers
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a customer
router.delete('/:id', async (req, res) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);
    if (!customer) {
      return res.status(404).json({ error: 'الزبون غير موجود' });
    }
    res.json({ message: 'تم حذف الزبون بنجاح' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete multiple customers
router.delete('/', async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids || !Array.isArray(ids)) {
      return res.status(400).json({ error: 'قائمة المعرفات مطلوبة' });
    }
    const result = await Customer.deleteMany({ _id: { $in: ids } });
    res.json({ message: `تم حذف ${result.deletedCount} زبون` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

