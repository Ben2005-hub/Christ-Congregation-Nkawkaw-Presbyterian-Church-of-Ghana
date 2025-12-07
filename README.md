# Christ Congregation Nkawkaw - Church Management System

A full-stack web application for managing church members, payments (tithes & funeral dues), and sending SMS notifications.

## Features

- **Member Management**: Add, edit, search, and delete church members
- **Payment Tracking**: Record and track member payments (tithes, funeral dues, etc.)
- **Public Payment Lookup**: Members can view their payment history via phone number
- **SMS Integration**: Send SMS messages via Arkesel (primary) or MTN (fallback)
- **Admin Dashboard**: View members, payments, and manage communications
- **Session Management**: Secure admin login and session handling
- **Responsive Design**: Mobile-friendly interface that adapts to all screen sizes

## SMS Provider Setup

### Arkesel (Recommended)

1. Sign up at https://arkesel.com
2. Get your API key from the dashboard
3. Set environment variables:
   ```
   SMS_PROVIDER=akasel
   AKASEL_API_URL=https://sms.arkesel.com/sms/api
   AKASEL_API_KEY=your_api_key_here
   SMS_SENDER=CHURCH
   ```
4. Access SMS tools at `/admin/sms` to check balance and send SMS

### Simulation Mode (For Testing)

To test without sending real SMS:
```
SMS_PROVIDER=simulate
```

## Installation

1. Clone the repository:
```bash
git clone https://github.com/Ben2005-hub/Christ-Congregation-Nkawkaw-Presbyterian-Church-of-Ghana.git
cd churchapp
```

2. Install dependencies:
```bash
npm install
```

3. Copy `.env.example` to `.env` and fill in your values:
```bash
cp .env.example .env
# Edit .env with your API keys and configuration
```

4. Start the server:
```bash
node app.js
```

The app will be available at `http://localhost:3000`

## Default Admin Credentials

- Username: `nkawkaw`
- Password: `Nkawkaw@123`

**⚠️ Change these immediately after first login!**

## Routes

### Public Routes
- `/` - Home page
- `/members/add` - Sign up form for new members
- `/messages/history` - View sent messages
- `/my-payments` - Look up payment history by phone number
- `/login` - Admin login page

### Admin Routes (Protected)
- `/members` - View and search all members
- `/members/:id` - View/edit member and add payments
- `/messages/compose` - Compose and send messages to members
- `/admin/signup` - Create new admin accounts
- `/admin/sms` - SMS tools (check balance, send SMS, schedule SMS)
- `/logout` - Logout

## Database

The app uses SQLite with the following main tables:
- `members` - Church member information
- `payments` - Payment records (tithe, funeral, etc.)
- `messages` - Sent messages
- `message_log` - SMS delivery log
- `admins` - Admin accounts

On Vercel, the database is stored at `/tmp/church.db` (ephemeral). For production persistence, consider migrating to PostgreSQL or MySQL.

## Payment Types

- **Tithe**: Regular contributions
- **Funeral**: Funeral assistance fund contributions
- **Other**: Any other payment type

## Environment Variables

See `.env.example` for all available variables. Key variables:

```
SMS_PROVIDER=akasel              # SMS provider to use
AKASEL_API_KEY=...              # Arkesel API key
SMS_SENDER=CHURCH               # SMS sender name
SESSION_SECRET=...              # Session encryption key
NODE_ENV=production             # Environment (production/development)
```

## API Endpoints

### SMS Sending
- `POST /messages/compose` - Send SMS to selected members

### Payment Management
- `POST /payments/add` - Add a payment for a member
- `DELETE /payments/:id` - Delete a payment (admin only)

### Member Management
- `GET /members` - List members (with search via `?q=phone_or_name`)
- `GET /members/:id` - View member details
- `PUT /members/:id` - Update member information
- `DELETE /members/:id` - Delete member (cascades to payments)

### Public Payments
- `GET /my-payments` - Payment lookup page
- `POST /my-payments/lookup` - Lookup payments by phone

## Deployment on Vercel

1. Create a Vercel account and connect your GitHub repository
2. Set environment variables in Vercel project settings:
   - `SMS_PROVIDER`
   - `AKASEL_API_KEY`
   - `SMS_SENDER`
   - `SESSION_SECRET`
   - `NODE_ENV=production`
3. Deploy (automatic on push to master)

**Note**: SQLite on Vercel is ephemeral. Data persists within a deployment but is lost when the function restarts. For production use, set up an external database.

## Development

- Run in simulate mode to test SMS flows without API calls
- Check logs at `/tmp/church.db` (locally) for message history
- Use admin SMS tools to test sending and check balance

## Security Notes

- Always use strong `SESSION_SECRET`
- Keep API keys in environment variables, never commit them
- Change default admin credentials immediately
- Use HTTPS in production (Vercel handles this automatically)
- Regularly backup your database if using SQLite

## Support

For issues or questions, please check the GitHub repository or contact the development team.

## License

ISC
