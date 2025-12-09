const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');
const MessageTemplate = require('../models/MessageTemplate');
const SendLog = require('../models/SendLog');

// Send messages to customers
router.post('/send', async (req, res) => {
  try {
    const { customerIds, serviceType } = req.body;

    if (!customerIds || !Array.isArray(customerIds) || customerIds.length === 0) {
      return res.status(400).json({ error: 'قائمة الزبائن مطلوبة' });
    }

    if (!serviceType) {
      return res.status(400).json({ error: 'نوع الخدمة مطلوب' });
    }

    // Get template for service type
    const template = await MessageTemplate.findOne({ serviceType });
    if (!template) {
      return res.status(404).json({ error: 'قالب الرسالة غير موجود لهذا النوع من الخدمة' });
    }

    // Get customers
    const customers = await Customer.find({ _id: { $in: customerIds } });
    if (customers.length === 0) {
      return res.status(404).json({ error: 'لم يتم العثور على زبائن' });
    }

    const sendLogs = [];
    let successCount = 0;
    let failCount = 0;

    for (const customer of customers) {
      try {
        // Replace placeholders in template
        let messageText = template.text;
        messageText = messageText.replace(/{customer_name}/g, customer.name || 'الزبون العزيز');
        messageText = messageText.replace(/{service_type}/g, serviceType);

        // Create send log
        const sendLog = new SendLog({
          customerId: customer._id,
          serviceType,
          messageText,
          status: 'sent' // In production, this would be determined by actual WhatsApp API response
        });

        await sendLog.save();
        sendLogs.push(sendLog);
        successCount++;

        // In production, here you would call WhatsApp API
        // For now, we simulate success
      } catch (error) {
        failCount++;
        // Create failed log
        const sendLog = new SendLog({
          customerId: customer._id,
          serviceType,
          messageText: template.text,
          status: 'failed'
        });
        await sendLog.save();
        sendLogs.push(sendLog);
      }
    }

    res.json({
      success: true,
      total: customers.length,
      sent: successCount,
      failed: failCount,
      logs: sendLogs
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate WhatsApp link (for mock implementation)
router.post('/generate-link', async (req, res) => {
  try {
    const { phone, message } = req.body;

    if (!phone || !message) {
      return res.status(400).json({ error: 'رقم الهاتف والرسالة مطلوبان' });
    }

    // Clean phone number
    const cleanPhone = phone.replace(/\s+/g, '').replace(/^\+/, '');
    const encodedMessage = encodeURIComponent(message);
    const whatsappLink = `https://wa.me/${cleanPhone}?text=${encodedMessage}`;

    res.json({ link: whatsappLink });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;






