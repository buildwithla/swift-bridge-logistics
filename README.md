# Swift Bridge Logistics

Full-stack logistics tracking web application with admin dashboard and logo integration.

## Features
- Responsive frontend with Home, Track, Admin Login, and Admin Dashboard pages
- Logo integrated in navbar, footer, login page, and dashboard header
- Node.js + Express backend
- MongoDB database storage with Mongoose
- JWT admin authentication
- Admin can create, update, and delete shipments
- Tracking endpoint for shipment status and timeline
- Seeded demo shipment `US33BGH0001`

## Quick Start
1. Install dependencies:
   ```bash
   npm install
   ```
2. Create an `.env` file from the example and update values if needed:
   ```bash
   copy .env.example .env
   ```
3. Start MongoDB locally.
4. Run the app:
   ```bash
   npm start
   ```
5. Open `http://localhost:4000` in your browser.

## Default admin credentials
- Email: `admin@swiftbridge.com`
- Password: `Admin@123`

## Notes
- A demo shipment `US33BGH0001` is seeded automatically if missing.
- Frontend assets and logo are served from `client/`.
