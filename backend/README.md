# Data Preprocessing API with Authentication

A modular Flask application for data preprocessing with user authentication.

## Project Structure

\`\`\`
├── app.py                 # Main application entry point
├── models/
│   ├── user.py           # User model and storage
│   └── dataset.py        # Dataset model and preprocessor
├── services/
│   ├── auth_service.py   # Authentication business logic
│   └── dataset_service.py # Dataset processing business logic
├── routes/
│   ├── auth_routes.py    # Authentication endpoints
│   ├── dataset_routes.py # Dataset processing endpoints
│   └── health_routes.py  # Health check endpoints
├── middleware/
│   ├── auth_middleware.py # Authentication middleware
│   └── error_handlers.py # Global error handlers
├── utils/
│   ├── response_utils.py # Response formatting utilities
│   ├── validators.py     # Input validation utilities
│   └── decorators.py     # Common decorators
└── components/
    └── LoginForm.js      # React authentication component
\`\`\`

## Features

### Authentication
- User registration and login
- Session-based authentication
- Password hashing with bcrypt
- Protected routes with middleware
- Password change functionality

### Data Processing
- CSV/Excel file upload
- Missing value handling
- Data normalization
- Categorical encoding
- Outlier removal
- Data export

### Architecture
- Modular design with separation of concerns
- Service layer for business logic
- Middleware for cross-cutting concerns
- Standardized API responses
- Comprehensive error handling

## Installation

1. Install Python dependencies:
\`\`\`bash
pip install -r requirements.txt
\`\`\`

2. Run the application:
\`\`\`bash
python app.py
\`\`\`

3. The server will start on http://localhost:5000

## API Endpoints

### Authentication
- POST /api/auth/register - User registration
- POST /api/auth/login - User login
- POST /api/auth/logout - User logout
- GET /api/auth/me - Get current user
- POST /api/auth/change-password - Change password

### Dataset Processing
- POST /api/dataset/upload - Upload dataset
- GET /api/dataset/{id}/status - Get processing status
- GET /api/dataset/{id}/summary - Get dataset summary
- GET /api/dataset/{id}/preview - Get dataset preview
- POST /api/dataset/{id}/missing-values - Handle missing values
- POST /api/dataset/{id}/reset - Reset dataset
- GET /api/dataset/{id}/export - Export processed dataset

### Health
- GET /api/health - Health check

## Frontend Integration

The React component includes:
- Form validation
- Error handling
- Loading states
- Session management
- API integration with credentials

## Security Features

- Password hashing with bcrypt
- Session-based authentication
- CORS configuration
- Input validation
- Error handling
- Protected routes

## Production Considerations

1. Replace in-memory storage with a database
2. Add environment variables for configuration
3. Enable HTTPS and secure cookies
4. Add rate limiting
5. Implement email verification
6. Add logging and monitoring
