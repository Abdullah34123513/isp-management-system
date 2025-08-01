# ISP Management System

A comprehensive full-stack ISP management web application built with Next.js 15, TypeScript, and Prisma. This system allows ISP owners to manage MikroTik routers, PPPoE customers, billing, and service plans from a single dashboard.

## Features

### Core Functionality
- **Router Management**: Add, configure, and sync MikroTik routers automatically
- **Customer Management**: Create, suspend, and manage PPPoE customer accounts
- **Plan Management**: Define service plans with bandwidth limits and pricing
- **Invoice Management**: Generate and track customer invoices with automatic overdue detection
- **Real-time Monitoring**: Live view of active PPPoE sessions and customer connections
- **Authentication**: Secure admin login with password change functionality

### Technical Features
- **Real-time Updates**: Socket.io integration for live session monitoring
- **Automatic Suspension**: Automatically suspend overdue accounts and reactivate when paid
- **MikroTik Integration**: Seamless integration with RouterOS API for PPPoE management
- **Responsive Design**: Mobile-friendly interface built with shadcn/ui components
- **Dark/Light Theme**: Toggle between light and dark themes
- **Type Safety**: Full TypeScript implementation with strict typing

## Tech Stack

### Frontend
- **Next.js 15**: React framework with App Router
- **TypeScript 5**: Type-safe JavaScript
- **Tailwind CSS 4**: Utility-first CSS framework
- **shadcn/ui**: Modern React component library
- **Lucide Icons**: Beautiful icon library
- **NextAuth.js v4**: Authentication framework
- **TanStack Query**: Server state management
- **Zustand**: Client state management
- **Socket.io Client**: Real-time communication

### Backend
- **Next.js API Routes**: Serverless API endpoints
- **Prisma ORM**: Database ORM with SQLite
- **Socket.io**: Real-time bidirectional communication
- **bcryptjs**: Password hashing
- **NextAuth.js**: Session management

### Database
- **SQLite**: Lightweight database for prototyping
- **Prisma Migrations**: Database schema management

## Getting Started

### Prerequisites
- Node.js 18 or higher
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd isp-management-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` file with your configuration:
   ```env
   DATABASE_URL=file:./dev.db
   NEXTAUTH_SECRET=your-super-secret-key-here
   NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
   ```

4. **Set up the database**
   ```bash
   # Generate Prisma client
   npm run db:generate
   
   # Push database schema
   npm run db:push
   
   # Seed database with default admin and sample plans
   npm run db:seed
   ```

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Access the application**
   - Open your browser and navigate to `http://localhost:3000`
   - Login with default credentials:
     - Username: `admin`
     - Password: `admin123`

## Default Configuration

### Admin Account
- **Username**: `admin`
- **Password**: `admin123`
- **⚠️ Important**: Change the default password after first login

### Sample Plans
The system comes pre-configured with three sample plans:
- **Basic**: $29.99/month (5M/5M bandwidth)
- **Standard**: $49.99/month (10M/10M bandwidth)
- **Premium**: $79.99/month (20M/20M bandwidth)

## Quick Start Guide

### First-Time Setup

1. **Install and Run**
   ```bash
   # Clone the repository
   git clone <repository-url>
   cd isp-management-system
   
   # Install dependencies
   npm install
   
   # Set up environment
   cp .env.example .env
   # Edit .env with your configuration
   
   # Set up database
   npm run db:generate
   npm run db:push
   npm run db:seed
   
   # Start the application
   npm run dev
   ```

2. **Login to System**
   - Go to `http://localhost:3000`
   - Username: `admin`
   - Password: `admin123`
   - **IMPORTANT**: Change your password immediately in Settings

### Daily Operations

#### Managing Routers
1. Go to **Routers** page
2. Click **Add Router**
3. Enter:
   - **Label**: A friendly name (e.g., "Main Router")
   - **Host**: Router IP address (e.g., 192.168.1.1)
   - **Port**: API port (default: 8728)
   - **Username**: API username (e.g., apiuser)
   - **Password**: API password
4. Click **Test Connection** to verify
5. Click **Add Router** to save
6. Use **Sync** button to pull existing customers from router

#### Adding Customers
1. Go to **Customers** page
2. Click **Add Customer**
3. Enter customer details:
   - **Name**: Customer's full name
   - **Username**: PPPoE username
   - **Password**: PPPoE password
   - **Email**: Customer email (optional)
   - **Phone**: Customer phone (optional)
   - **Address**: Customer address (optional)
4. Select **Router** and **Plan**
5. Click **Add Customer**
6. Customer will be automatically created on MikroTik router

#### Managing Invoices
1. Go to **Invoices** page
2. Click **Create Invoice**
3. Select **Customer** and enter:
   - **Amount**: Invoice amount
   - **Due Date**: When payment is due
   - **Description**: Invoice details
4. Click **Create Invoice**
5. When customer pays, click **Mark as Paid**
6. Suspended accounts will automatically reactivate

#### Monitoring Sessions
1. **Dashboard** shows live active sessions
2. View customer uptime, IP addresses, and data usage
3. Real-time updates every 30 seconds
4. Click **Disconnect** to force disconnect a session

### System Administration

#### Changing Admin Password
1. Go to **Settings** page
2. Enter **Current Password**
3. Enter **New Password** (minimum 8 characters)
4. Enter **Confirm Password**
5. Click **Change Password**

#### Managing Service Plans
1. Go to **Plans** page
2. Click **Add Plan**
3. Configure:
   - **Name**: Plan name (e.g., "Basic")
   - **Price**: Monthly price
   - **Download Speed**: Download limit (e.g., 5M)
   - **Upload Speed**: Upload limit (e.g., 5M)
   - **Data Cap**: Monthly data limit (optional)
4. Click **Add Plan**

### MikroTik Router Setup

#### Enable API Access
```bash
# On MikroTik terminal
/ip service enable api
/ip service set api port=8728
/ip service set api address=0.0.0.0/0
```

#### Create API User
```bash
# On MikroTik terminal
/user add name=apiuser group=full password=yourpassword
```

#### Configure PPPoE Server
```bash
# On MikroTik terminal
/interface pppoe-server server add service-name=isp interface=ether1
/ppp profile add name=basic local-address=192.168.1.1 remote-address=pppoe-pool
/ip pool add name=pppoe-pool ranges=192.168.1.100-192.168.1.200
```

## Troubleshooting

### Common Issues

**Cannot connect to router**
- Check router IP and port
- Verify API is enabled on router
- Check firewall rules
- Test with `telnet <router-ip> 8728`

**Customers not syncing**
- Verify router credentials are correct
- Check PPPoE server is configured
- Use "Sync" button on router page

**Real-time updates not working**
- Refresh browser page
- Check Socket.io connection in browser console
- Verify NEXT_PUBLIC_SOCKET_URL in .env

**Database errors**
- Run `npm run db:push` to update schema
- Check database file permissions
- Verify DATABASE_URL in .env

## Usage Guide

### 1. Router Management
- Navigate to `/routers` to manage your MikroTik routers
- Click "Add Router" to connect a new router
- Provide the router's IP/hostname, API credentials, and a label
- The system will automatically test the connection and sync existing PPPoE customers
- Use the sync button to manually update customer data from the router

### 2. Customer Management
- Navigate to `/customers` to manage PPPoE customer accounts
- Click "Add Customer" to create a new PPPoE account
- Select the router and assign a service plan
- Use the suspend/activate buttons to control customer access
- Customer changes are automatically synced with MikroTik routers

### 3. Plan Management
- Navigate to `/plans` to manage service plans
- Define bandwidth limits, pricing, and billing cycles
- Plans map to MikroTik PPP profiles for rate limiting
- Active plans can be assigned to new customers

### 4. Invoice Management
- Navigate to `/invoices` to manage customer billing
- Create invoices for customers with due dates
- Mark invoices as paid to automatically reactivate suspended accounts
- The system automatically detects and marks overdue invoices
- Overdue accounts are automatically suspended (runs hourly)

### 5. Real-time Monitoring
- The dashboard shows live active PPPoE sessions
- View customer uptime, IP addresses, and data usage
- Real-time updates via Socket.io connections
- Monitor system health and router status

### 6. Settings
- Navigate to `/settings` to change your admin password
- View system information and quick links
- Access all management features from one place

## MikroTik Integration

### Requirements
- MikroTik RouterOS device with API access enabled
- API user with appropriate permissions
- Network connectivity between the application and router

### Configuration
1. **Enable API on MikroTik**:
   ```
   /ip service enable api
   /ip service set api port=8728
   /ip service set api address=0.0.0.0/0
   ```

2. **Create API User**:
   ```
   /user add name=apiuser group=full password=yourpassword
   ```

3. **Configure PPPoE Server** (if not already configured):
   ```
   /interface pppoe-server server add service-name=isp interface=ether1
   /ppp profile add name=basic local-address=192.168.1.1 remote-address=pppoe-pool
   /ppp secret add name=test-user password=test123 service=pppoe profile=basic
   ```

### Supported Operations
- List PPPoE secrets (customers)
- Add new PPPoE secrets
- Update existing secrets (disable/enable)
- Remove PPPoE secrets
- List active PPPoE sessions
- Disconnect active sessions

## API Endpoints

### Authentication
- `POST /api/auth/signin` - Login
- `GET /api/auth/session` - Get session
- `POST /api/auth/signout` - Logout

### Routers
- `GET /api/routers` - List all routers
- `POST /api/routers` - Add new router
- `GET /api/routers/[id]` - Get router details
- `PUT /api/routers/[id]` - Update router
- `DELETE /api/routers/[id]` - Delete router
- `POST /api/routers/[id]` - Sync router with MikroTik

### Customers
- `GET /api/customers` - List all customers
- `POST /api/customers` - Create new customer
- `GET /api/customers/[id]` - Get customer details
- `PUT /api/customers/[id]` - Update customer
- `DELETE /api/customers/[id]` - Delete customer
- `POST /api/customers/[id]` - Suspend/activate customer

### Plans
- `GET /api/plans` - List all plans
- `POST /api/plans` - Create new plan
- `GET /api/plans/[id]` - Get plan details
- `PUT /api/plans/[id]` - Update plan
- `DELETE /api/plans/[id]` - Delete plan

### Invoices
- `GET /api/invoices` - List all invoices
- `POST /api/invoices` - Create new invoice
- `GET /api/invoices/[id]` - Get invoice details
- `PUT /api/invoices/[id]` - Update invoice
- `DELETE /api/invoices/[id]` - Delete invoice
- `POST /api/invoices/[id]` - Mark as paid

### Sessions
- `GET /api/sessions` - List active PPPoE sessions

### Admin
- `PUT /api/admin/password` - Change admin password

## Database Schema

### Core Tables
- **Admin**: System administrator accounts
- **Router**: MikroTik router configurations
- **Customer**: PPPoE customer accounts
- **Plan**: Service plans and pricing
- **Invoice**: Customer billing records
- **ActiveSession**: Real-time session tracking

### Relationships
- Router → Customers (one-to-many)
- Router → ActiveSessions (one-to-many)
- Customer → Invoices (one-to-many)
- Customer → ActiveSessions (one-to-many)
- Plan → Customers (one-to-many)

## Security Considerations

### Password Security
- Admin passwords are hashed using bcryptjs
- Default password should be changed immediately
- Strong password requirements (minimum 8 characters)

### API Security
- All API routes require authentication
- MikroTik API credentials are encrypted in the database
- Session-based authentication with NextAuth.js

### Data Protection
- Customer PPPoE passwords are stored for MikroTik sync (consider encryption in production)
- Sensitive operations require confirmation
- Input validation and sanitization

## Development

### Available Scripts
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run db:push` - Push schema changes to database
- `npm run db:generate` - Generate Prisma client
- `npm run db:seed` - Seed database with initial data

### Project Structure
```
src/
├── app/                 # Next.js App Router pages
│   ├── api/            # API routes
│   ├── auth/           # Authentication pages
│   ├── customers/      # Customer management
│   ├── invoices/       # Invoice management
│   ├── plans/          # Plan management
│   ├── routers/        # Router management
│   └── settings/       # Admin settings
├── components/         # React components
│   ├── ui/            # shadcn/ui components
│   └── theme-toggle.tsx
├── hooks/             # Custom React hooks
├── lib/               # Utility libraries
│   ├── auth.ts        # NextAuth configuration
│   ├── db.ts          # Prisma database client
│   ├── mikrotik.ts    # MikroTik integration
│   ├── socket.ts      # Socket.io setup
│   └── utils.ts       # Utility functions
└── prisma/            # Database schema and migrations
```

## Production Deployment

### Environment Variables
```env
DATABASE_URL=your-production-database-url
NEXTAUTH_SECRET=your-production-secret-key
NEXT_PUBLIC_SOCKET_URL=your-production-url
```

### Database
- For production, consider using PostgreSQL or MySQL instead of SQLite
- Set up proper database backups
- Configure connection pooling

### Security
- Use strong, randomly generated secrets
- Enable HTTPS in production
- Configure proper CORS policies
- Set up rate limiting for API endpoints

### Monitoring
- Monitor router connectivity and sync status
- Track failed login attempts
- Monitor database performance
- Set up logging for troubleshooting

## Troubleshooting

### Common Issues

**Router Connection Issues**
- Verify MikroTik API is enabled and accessible
- Check firewall rules allow API traffic
- Verify API credentials are correct
- Ensure network connectivity between application and router

**Database Issues**
- Run `npm run db:push` to update schema
- Check database file permissions
- Verify DATABASE_URL is correct

**Authentication Issues**
- Clear browser cookies and cache
- Verify NEXTAUTH_SECRET is set
- Check database for admin user record

**Real-time Updates Not Working**
- Verify Socket.io server is running
- Check WebSocket connection in browser dev tools
- Ensure NEXT_PUBLIC_SOCKET_URL is correct

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions:
- Check the troubleshooting section
- Review the API documentation
- Examine the database schema
- Check the browser console for errors

---

**Note**: This is a comprehensive ISP management system designed for single ISP owners. It provides all the essential features for managing MikroTik routers, PPPoE customers, billing, and monitoring from a single, easy-to-use interface.