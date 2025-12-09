const mongoose = require('mongoose');

const sendLogSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  serviceType: {
    type: String,
    enum: ['مبيع', 'صيانة يصلح', 'صيانة لا يصلح', 'رسالة اكتمال تقرير الصيانة'],
    required: true
  },
  messageText: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'failed'],
    default: 'pending'
  },
  sentAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('SendLog', sendLogSchema);




