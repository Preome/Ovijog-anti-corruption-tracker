# 🛡️ Anti-Corruption Digital Service Tracker

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Django](https://img.shields.io/badge/Django-4.2-green.svg)](https://www.djangoproject.com/)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38B2AC.svg)](https://tailwindcss.com/)

A comprehensive digital platform to reduce bribery and increase transparency in public services through real-time complaint tracking, anonymous reporting, and public accountability mechanisms.

## 🌟 Key Features

### 🔐 User Management & Authentication
- **Role-Based Access**: Citizen, Officer of 4 departments including passport office,BRTA office, Tax office and Birth Registration office , and Admin roles with different permissions
- **Email Verification**: OTP-based email verification for secure account creation
- **Admin Approval Workflow**: Officer accounts require admin approval before activation
- **JWT Authentication**: Secure token-based authentication

### 📝 Anonymous Complaint System
- **Anonymous Reporting**: Citizens can report bribery without revealing identity
- **Priority Levels**: Urgent, High, Medium, Low priority classification
- **Evidence Upload**: Support for images and PDF evidence via Cloudinary
- **Real-time Status Tracking**: Track complaint progress from submission to resolution

### 📊 Public Pressure Board (জনতার কণ্ঠ)
- **Public Complaint Visibility**: Overdue complaints become publicly visible
- **Community Support**: Citizens can upvote public complaints for faster resolution
- **Trust Score Display**: Shows reporter's credibility score (for non-anonymous complaints)
- **Autobile Deadline**: 15-day automatic deadline for complaint resolution

### 🎥 Digital Hearing System
- **Video Conferencing**: Integrated Jitsi Meet for online hearings
- **Scheduling System**: Officers can schedule hearings for escalated complaints
- **Status Management**: Track hearings (Scheduled → Ongoing → Completed)
- **Notifications**: Citizens receive hearing notifications

### ⭐ Citizen Trust Score
- **Dynamic Scoring**: Points based on complaint history (Verified: +5, Rejected: -10)
- **Leaderboard**: Top trustworthy citizens display
- **Benefits**: High trust scores get priority processing
- **Transparency**: Public display of reporter credibility

### 🔔 Real-time Notifications
- **In-app Notifications**: Status change alerts
- **Email Notifications**: Automatic email updates
- **Priority-based Alerts**: Visual priority indicators
- **Read/Unread Tracking**: Mark notifications as read

### 👥 Department-wise Officer Access
- **Four Departments**: Passport, Driving License, Birth Certificate, Tax ID
- **Role-based Filtering**: Officers see only their department complaints
- **Admin Management**: Admin can approve/reject officer applications

## 📋 Core Features Implementation

### 1. User Authentication & Roles
- **JWT Authentication**: `djangorestframework-simplejwt`
- **OTP Verification**: 6-digit code sent via email
- **Role-based Access**: Decorators in views and frontend route protection

### 2. Complaint System
- **Anonymous Flag**: `is_anonymous` field for identity protection
- **Evidence Upload**: Cloudinary integration for file storage
- **Status Flow**: `pending → under_investigation → verified → resolved`
- **Public Pressure**: Automatic 15-day deadline with public activation

### 3. Trust Score Algorithm
```python
base_score = 50
verified_bonus = verified_complaints * 5  
rejected_penalty = rejected_complaints * 10
fake_penalty = fake_complaints * 15
final_score = max(0, min(100, base_score + verified_bonus - rejected_penalty - fake_penalty))
```

### 4. Digital Hearings
- **Scheduling**: Officers can schedule video hearings via UI
- **Meeting Links**: Automatic Jitsi Meet URL generation
- **Status Tracking**: `scheduled → ongoing → completed`
- **Notifications**: Citizens receive hearing notifications

### 5. Real-time Notifications
- **Models**: `Notification` with `type`, `priority`, `read_status`
- **API Endpoints**: Fetch, mark read, delete notifications
- **Frontend**: Bell icon with unread count badge
- **Polling**: Auto-refresh every 30 seconds



## 🛠️ Technology Stack

### Backend
| Technology | Version | Purpose |
|------------|---------|---------|
| Django | 4.2 | Web framework |
| Django REST Framework | 3.14 | API development |
| PostgreSQL (NeonDB) | - | Database |
| JWT | - | Authentication |
| Celery | 5.3 | Background tasks |
| django-cors-headers | 4.3 | CORS handling |
| django-filter | 23.5 | Query filtering |

### Frontend
| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.2 | UI framework |
| Vite | 5.0 | Build tool |
| Tailwind CSS | 3.4 | Styling |
| Axios | 1.6 | HTTP client |
| React Router DOM | 6.20 | Routing |
| Lucide React | 0.303 | Icons |
| React Hot Toast | 2.4 | Notifications |
| Chart.js | 4.4 | Data visualization |
| Framer Motion | 10.16 | Animations |

### Cloud Services
| Service | Purpose |
|---------|---------|
| NeonDB | PostgreSQL database hosting |
| Cloudinary | Image/PDF upload and storage |
| Gmail SMTP | Email notifications |

