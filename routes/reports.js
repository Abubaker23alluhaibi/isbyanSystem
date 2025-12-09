const express = require('express');
const router = express.Router();
const SendLog = require('../models/SendLog');
const Customer = require('../models/Customer');

// Get daily statistics
router.get('/daily', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const matchQuery = {};
    if (startDate || endDate) {
      matchQuery.sentAt = {};
      if (startDate) {
        matchQuery.sentAt.$gte = new Date(startDate);
      }
      if (endDate) {
        matchQuery.sentAt.$lte = new Date(endDate);
      }
    }

    const dailyStats = await SendLog.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$sentAt' } },
            serviceType: '$serviceType'
          },
          total: { $sum: 1 },
          sent: {
            $sum: { $cond: [{ $eq: ['$status', 'sent'] }, 1, 0] }
          },
          failed: {
            $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
          }
        }
      },
      { $sort: { '_id.date': -1 } }
    ]);

    res.json(dailyStats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get summary statistics
router.get('/summary', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const matchQuery = {};
    if (startDate || endDate) {
      matchQuery.sentAt = {};
      if (startDate) {
        matchQuery.sentAt.$gte = new Date(startDate);
      }
      if (endDate) {
        matchQuery.sentAt.$lte = new Date(endDate);
      }
    }

    const summary = await SendLog.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalMessages: { $sum: 1 },
          sentMessages: {
            $sum: { $cond: [{ $eq: ['$status', 'sent'] }, 1, 0] }
          },
          failedMessages: {
            $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] }
          },
          byServiceType: {
            $push: {
              serviceType: '$serviceType',
              status: '$status'
            }
          }
        }
      }
    ]);

    // Get unique customers count
    const uniqueCustomers = await SendLog.distinct('customerId', matchQuery);
    const customerCount = uniqueCustomers.length;

    const result = summary[0] || {
      totalMessages: 0,
      sentMessages: 0,
      failedMessages: 0,
      byServiceType: []
    };

    // Group by service type
    const byServiceType = {};
    result.byServiceType.forEach(item => {
      if (!byServiceType[item.serviceType]) {
        byServiceType[item.serviceType] = { total: 0, sent: 0, failed: 0 };
      }
      byServiceType[item.serviceType].total++;
      if (item.status === 'sent') {
        byServiceType[item.serviceType].sent++;
      } else if (item.status === 'failed') {
        byServiceType[item.serviceType].failed++;
      }
    });

    res.json({
      totalMessages: result.totalMessages,
      sentMessages: result.sentMessages,
      failedMessages: result.failedMessages,
      uniqueCustomers: customerCount,
      byServiceType
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;






