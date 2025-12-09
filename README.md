# Backend - نظام استبيان الواتساب

## التثبيت

1. قم بتثبيت الحزم:
```bash
npm install
```

2. أنشئ ملف `.env` في مجلد `backend`:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/istbyan_system
NODE_ENV=development
```

3. تأكد من أن MongoDB يعمل على جهازك

4. شغّل الخادم:
```bash
npm run dev
```

الخادم سيعمل على `http://localhost:5000`

## API Endpoints

### Customers
- `GET /api/customers` - جلب جميع الزبائن
- `POST /api/customers` - إضافة زبون جديد
- `POST /api/customers/import` - استيراد من Excel
- `DELETE /api/customers/:id` - حذف زبون

### Templates
- `GET /api/templates` - جلب جميع القوالب
- `GET /api/templates/:serviceType` - جلب قالب محدد
- `POST /api/templates` - إنشاء أو تحديث قالب

### Messages
- `POST /api/messages/send` - إرسال رسائل للزبائن
- `POST /api/messages/generate-link` - إنشاء رابط واتساب

### Send Logs
- `GET /api/sendlogs` - جلب سجل الإرسال
- `GET /api/sendlogs/aggregated` - إحصائيات مجمعة

### Reports
- `GET /api/reports/summary` - ملخص التقارير
- `GET /api/reports/daily` - إحصائيات يومية






