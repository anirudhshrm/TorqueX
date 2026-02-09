# TorqueX

# 🚗 TorqueX – Car Rental Management System

TorqueX is a full-stack **Car Rental Management System** that simplifies vehicle booking and rental operations. It provides separate dashboards for **users and admins**, secure authentication, booking workflows, and an intuitive interface built using server-side rendering.

---

## 📖 Project Overview

TorqueX allows users to browse vehicles, make bookings, manage their profiles, and leave reviews, while admins can manage vehicles, bookings, users, and system configurations from a centralized dashboard.

The project is built with scalability and clean architecture in mind, making it suitable for real-world rental platforms.

---

## ✨ Features

### 👤 User Features
- User registration and authentication
- Browse available vehicles
- Vehicle booking & payment flow
- View booking history
- User dashboard & profile management
- Submit and view vehicle reviews

### 🛠️ Admin Features
- Admin authentication
- Admin dashboard with analytics
- Add, update, and delete vehicles
- Manage bookings and requests
- Broadcast announcements
- Deal and offer management
- Cache and Redis demo integration

---

## 🧑‍💻 Tech Stack

### Backend
- Node.js
- Express.js
- RESTful APIs
- Redis
- WebSockets
- Crypto utilities for security

### Frontend
- EJS (Embedded JavaScript Templates)
- HTML5
- CSS3
- JavaScript

### Database
- MongoDB (or compatible NoSQL database)

---

## 📁 Project Structure

TorqueX/
│── src/
│ ├── routes/
│ ├── utils/
│ ├── views/
│ │ ├── admin/
│ │ ├── auth/
│ │ ├── bookings/
│ │ ├── user/
│ │ └── partials/
│── tests/
│── .gitignore
│── README.md
│── package.json



## ⚙️ Installation & Setup

### Prerequisites
- Node.js (v16+ recommended)
- npm or yarn
- MongoDB
- Redis (optional, for caching features)

### Steps
```bash
# Clone the repository
git clone https://github.com/anirudhshrm/TorqueX.git

# Navigate to project directory
cd TorqueX

# Install dependencies
npm install

# Start the server
npm start


Environment Variables

PORT=3000
DB_URI=your_database_url
REDIS_URL=your_redis_url
SESSION_SECRET=your_secret_key



Testing

The project includes:

Unit tests

Integration tests

End-to-end (E2E) tests

Run tests using:
npm test


Future Enhancements

Payment gateway integration

Role-based access control

Advanced search & filtering

Cloud deployment (AWS / Vercel / Render)

Mobile-friendly UI


License

This project is licensed under the MIT License.


