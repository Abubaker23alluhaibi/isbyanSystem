const mongoose = require('mongoose');

const customerSchema = new mongoose.Schema({
  name: {
    type: String,
    default: ''
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  notes: {
    type: String,
    default: ''
  },
  serviceType: {
    type: String,
    enum: ['مبيع', 'صيانة يصلح', 'صيانة لا يصلح', 'رسالة اكتمال تقرير الصيانة'],
    required: true
  },
  serviceDate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Customer', customerSchema);


