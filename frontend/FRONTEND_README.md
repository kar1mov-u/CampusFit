# CampusFit Frontend

A modern React + TypeScript application for university sport facility booking.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Backend server running on http://localhost:8080

### Installation

```bash
cd frontend
npm install
```

### Development

```bash
npm run dev
```

The app will be available at http://localhost:3000

### Build for Production

```bash
npm run build
npm run preview
```

## 📱 Features

### User Features
- **Authentication**: Login/Register with JWT tokens
- **Facility Browsing**: View all available sport facilities
- **Booking System**: Interactive calendar to book time slots
- **My Bookings**: View and manage your bookings

### Admin Features
- **Facilities Management**: CRUD operations for facilities
- **Users Management**: View and manage all users
- **Bookings Management**: View and manage all bookings

## 🎨 Tech Stack

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **React Router** - Navigation
- **Axios** - API calls
- **date-fns** - Date manipulation

## 📂 Project Structure

```
src/
├── api/              # API service layer
├── components/       # Reusable components
│   ├── admin/       # Admin panel components
│   ├── Layout.tsx   # Main layout wrapper
│   └── ProtectedRoute.tsx
├── context/         # React context providers
├── pages/           # Page components
├── types/           # TypeScript type definitions
└── main.tsx         # App entry point
```

## 🔑 User Roles

### Student
- Can view facilities
- Can book available time slots
- Can view/cancel their own bookings

### Admin
- All student permissions
- Can manage facilities (CRUD)
- Can manage users
- Can manage all bookings

## 🌐 API Integration

The frontend connects to the backend API at `http://localhost:8080/api/v1`

### Endpoints Used:
- `POST /auth/login` - User login
- `POST /users` - User registration
- `GET /users/me` - Get current user
- `GET /facility/all` - List all facilities
- `GET /facility/:id` - Get facility details
- `POST /facility` - Create facility (admin)
- `PATCH /facility/:id` - Update facility (admin)
- `DELETE /facility/:id` - Delete facility (admin)
- `GET /bookings/facility/:id` - Get facility bookings
- `POST /bookings` - Create booking
- `DELETE /bookings/:id` - Cancel booking

## 🎯 Usage Guide

### For Students:

1. **Register/Login**
   - Visit http://localhost:3000
   - Click "Register here" to create an account
   - Or login with existing credentials

2. **Browse Facilities**
   - After login, you'll see all available facilities
   - Click on any facility card to view its schedule

3. **Book a Time Slot**
   - Select a date from the week view
   - Click on an available (green) time slot
   - Confirm your booking in the modal

### For Admins:

1. **Access Admin Panel**
   - Login with admin credentials
   - Click "Admin Panel" button on the facilities page
   - Or navigate to http://localhost:3000/admin

2. **Manage Facilities**
   - Click "Facilities" tab
   - Use "Add Facility" to create new facilities
   - Edit or delete existing facilities

3. **Manage Users**
   - Click "Users" tab
   - View all registered users
   - Delete users if needed

4. **Manage Bookings**
   - Click "Bookings" tab
   - View all bookings across all facilities
   - Cancel bookings if needed

## 🔧 Configuration

### API Base URL
Edit `src/api/axios.ts` to change the backend URL:

```typescript
const api = axios.create({
  baseURL: 'http://localhost:8080/api/v1',
  // ...
});
```

### Vite Proxy
The `vite.config.ts` includes a proxy configuration for the API:

```typescript
server: {
  port: 3000,
  proxy: {
    '/api': {
      target: 'http://localhost:8080',
      changeOrigin: true
    }
  }
}
```

## 🐛 Troubleshooting

### Blank page on load
1. Clear browser cache (Ctrl+Shift+R)
2. Check browser console for errors
3. Ensure backend is running on port 8080

### Login fails
1. Verify backend is accessible
2. Check credentials are correct
3. Look at Network tab in DevTools

### TypeScript errors
```bash
# Clear cache and restart
rm -rf node_modules/.vite
npm run dev
```

## 📝 Notes

- The app requires authentication for all routes except login/register
- JWT tokens are stored in localStorage
- Tokens are automatically added to API requests
- On 401 errors, users are redirected to login

## 🎨 Customization

### Colors
Edit `tailwind.config.js` to customize the color scheme:

```javascript
theme: {
  extend: {
    colors: {
      primary: {
        // Your colors here
      }
    }
  }
}
```

### Facility Types
Add more sport types in `src/types/index.ts`:

```typescript
type: 'football' | 'basketball' | 'tennis' | 'volleyball' | 'swimming';
```

## 📄 License

MIT
