const express = require('express');
const router = express.Router();
const MessageTemplate = require('../models/MessageTemplate');

// Get all templates
router.get('/', async (req, res) => {
  try {
    const templates = await MessageTemplate.find().sort({ serviceType: 1 });
    res.json(templates);
  } catch (error) {
    // If MongoDB is not connected, return default templates
    if (error.name === 'MongooseServerSelectionError' || error.message.includes('ECONNREFUSED')) {
      return res.json([
        { serviceType: 'مبيع', text: 'مرحباً {customer_name}، نود معرفة رأيك في خدمة {service_type}. شكراً لكم!' },
        { serviceType: 'صيانة يصلح', text: 'مرحباً {customer_name}، نود معرفة رأيك في خدمة {service_type}. شكراً لكم!' },
        { serviceType: 'صيانة لا يصلح', text: 'مرحباً {customer_name}، نود معرفة رأيك في خدمة {service_type}. شكراً لكم!' },
        { serviceType: 'رسالة اكتمال تقرير الصيانة', text: 'مرحباً {customer_name}، تم اكتمال تقرير الصيانة لخدمة {service_type}. شكراً لكم!' }
      ]);
    }
    res.status(500).json({ error: error.message });
  }
});

// Get template by service type
router.get('/:serviceType', async (req, res) => {
  try {
    const template = await MessageTemplate.findOne({ serviceType: req.params.serviceType });
    if (!template) {
      // Return default template if not found
      return res.json({
        serviceType: req.params.serviceType,
        text: `مرحباً {customer_name}، نود معرفة رأيك في خدمة {service_type}. شكراً لكم!`
      });
    }
    res.json(template);
  } catch (error) {
    // If MongoDB is not connected, return default template
    if (error.name === 'MongooseServerSelectionError' || error.message.includes('ECONNREFUSED')) {
      return res.json({
        serviceType: req.params.serviceType,
        text: `مرحباً {customer_name}، نود معرفة رأيك في خدمة {service_type}. شكراً لكم!`
      });
    }
    res.status(500).json({ error: error.message });
  }
});

// Create or update template
router.post('/', async (req, res) => {
  try {
    const { serviceType, text } = req.body;

    if (!serviceType || !text) {
      return res.status(400).json({ error: 'نوع الخدمة والنص مطلوبان' });
    }

    const template = await MessageTemplate.findOneAndUpdate(
      { serviceType },
      { text },
      { new: true, upsert: true }
    );

    res.json(template);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update template
router.put('/:id', async (req, res) => {
  try {
    const { text } = req.body;
    const template = await MessageTemplate.findByIdAndUpdate(
      req.params.id,
      { text },
      { new: true }
    );

    if (!template) {
      return res.status(404).json({ error: 'القالب غير موجود' });
    }

    res.json(template);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;


