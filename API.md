# TaxFront API Documentation

## Overview
TaxFront provides a RESTful API for tax document processing and form automation.

## Authentication
All API endpoints require authentication using Firebase JWT tokens.

```http
Authorization: Bearer <firebase_token>
```

## Base URL
```
https://us-central1-taxfront-1e142.cloudfunctions.net
```

## Endpoints

### Tax Form Operations

#### Get Supported Forms
```http
GET /api/tax-forms/supported
```

Returns a list of supported tax forms and their years.

**Response**
```json
[
  {
    "type": "FORM_1040",
    "year": 2024
  },
  {
    "type": "W-2",
    "year": 2024
  }
]
```

#### Fill Tax Form
```http
POST /api/tax-forms/fill
```

Fill a tax form with provided data.

**Request Body**
```json
{
  "formType": "FORM_1040",
  "year": 2024,
  "formData": {
    "first_name": "John",
    "last_name": "Doe",
    "ssn": "123-45-6789"
  }
}
```

**Response**
- Content-Type: application/pdf
- The filled PDF form as a file download

### Form Field Definitions

#### Form 1040 Fields
```json
{
  "first_name": {
    "type": "text",
    "required": true
  },
  "last_name": {
    "type": "text",
    "required": true
  },
  "ssn": {
    "type": "text",
    "required": true,
    "pattern": "^\\d{3}-\\d{2}-\\d{4}$"
  }
}
```

#### Form W-2 Fields
```json
{
  "employer_ein": {
    "type": "text",
    "required": true,
    "pattern": "^\\d{2}-\\d{7}$"
  },
  "wages": {
    "type": "number",
    "required": true,
    "min": 0
  }
}
```

### Error Responses

#### 400 Bad Request
```json
{
  "error": "Invalid form type. Supported types: ['FORM_1040', 'W-2']"
}
```

#### 401 Unauthorized
```json
{
  "error": "Invalid or missing authentication token"
}
```

#### 500 Internal Server Error
```json
{
  "error": "Internal server error: <error_message>"
}
```

## Rate Limits
- 100 requests per minute per user
- 1000 requests per day per user

## Webhooks
Webhook notifications are available for long-running form processing tasks.

### Webhook Events
- `form.processing.started`
- `form.processing.completed`
- `form.processing.failed`

### Webhook Payload
```json
{
  "event": "form.processing.completed",
  "formType": "FORM_1040",
  "year": 2024,
  "timestamp": "2024-02-15T15:16:35Z",
  "status": "completed",
  "result": {
    "downloadUrl": "https://..."
  }
}
```

## SDKs and Client Libraries
- [JavaScript/TypeScript SDK](./sdk/js)
- [Python SDK](./sdk/python)
- [Java SDK](./sdk/java)

## Best Practices
1. Always validate form data before submission
2. Handle rate limits appropriately
3. Implement proper error handling
4. Use webhooks for long-running operations
5. Keep authentication tokens secure

## Support
For API support, contact api-support@taxfront.com
