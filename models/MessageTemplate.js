const mongoose = require('mongoose');

const messageTemplateSchema = new mongoose.Schema({
  serviceType: {
    type: String,
    enum: ['مبيع', 'صيانة يصلح', 'صيانة لا يصلح', 'رسالة اكتمال تقرير الصيانة'],
    required: true,
    unique: true
  },
  text: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('MessageTemplate', messageTemplateSchema);




