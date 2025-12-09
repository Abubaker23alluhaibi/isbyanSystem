const express = require('express');
const router = express.Router();
const SendLog = require('../models/SendLog');
const Customer = require('../models/Customer');

// Get all send logs with filters
router.get('/', async (req, res) => {
  try {
    const { serviceType, status, startDate, endDate, page = 1, limit = 50 } = req.query;

    const query = {};

    if (serviceType) {
      query.serviceType = serviceType;
    }

    if (status) {
      query.status = status;
    }

    if (startDate || endDate) {
      query.sentAt = {};
      if (startDate) {
        query.sentAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.sentAt.$lte = new Date(endDate);
      }
    }

    const logs = await SendLog.find(query)
      .populate('customerId', 'name phone')
      .sort({ sentAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await SendLog.countDocuments(query);

    res.json({
      logs,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get aggregated send logs (grouped by date/service type)
router.get('/aggregated', async (req, res) => {
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

    const aggregated = await SendLog.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$sentAt' } },
            serviceType: '$serviceType',
            status: '$status'
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.date': -1, '_id.serviceType': 1 } }
    ]);

    res.json(aggregated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;






