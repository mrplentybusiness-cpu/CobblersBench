# Cobbler's Bench - E-commerce Platform

## Overview

Cobbler's Bench is a production-ready e-commerce website for a cobbler/shoe repair business. The application provides a public storefront for customers to browse repair services and leather goods, a shopping cart system, and a manual payment checkout flow using Venmo/Zelle. An admin dashboard allows product and order management.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: Zustand with persistence for cart functionality
- **Data Fetching**: TanStack React Query for server state management
- **Styling**: Tailwind CSS v4 with shadcn/ui component library (New York style)
- **Form Handling**: React Hook Form with Zod validation
- **File Uploads**: Uppy with AWS S3-compatible presigned URL flow

The frontend follows a page-based architecture with shared components. Key pages include Home, Shop, Cart, Checkout, Confirmation, and Admin. The Layout component provides consistent navigation and branding across all public pages.

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Server**: Node.js with HTTP server
- **Build Tool**: Vite for client, esbuild for server bundling
- **Development**: tsx for TypeScript execution

The backend serves both the API endpoints and static files in production. In development, Vite's dev server handles hot module replacement.

### Data Storage
- **Database**: PostgreSQL with Drizzle ORM
- **Schema Location**: `shared/schema.ts` - shared between client and server
- **Migrations**: Drizzle Kit with push-based migrations (`db:push`)
- **Tables**: products, orders, order_items with proper foreign key relationships

### API Structure
RESTful API endpoints under `/api/`:
- `GET/POST /api/products` - List and create products
- `GET/PUT/DELETE /api/products/:id` - Product CRUD operations
- `GET/POST /api/orders` - List and create orders
- `GET/PUT /api/orders/:id` - Order management and status updates
- `POST /api/uploads/request-url` - Presigned URL generation for file uploads

### Object Storage Integration
Uses Replit's Object Storage (Google Cloud Storage compatible) for image uploads:
- Presigned URL flow for secure direct uploads
- ACL policy system for access control
- Integration via `@google-cloud/storage` SDK

### Authentication
- Admin dashboard uses simple password-based authentication (stored in environment)
- No user authentication system for customers (manual payment flow)

## External Dependencies

### Database
- **PostgreSQL**: Primary database, connection via `DATABASE_URL` environment variable
- **Drizzle ORM**: Type-safe database queries and schema management

### Object Storage
- **Replit Object Storage**: Google Cloud Storage-compatible service for image uploads
- **Sidecar Endpoint**: `http://127.0.0.1:1106` for credential management

### UI Component Libraries
- **shadcn/ui**: Comprehensive component library built on Radix UI primitives
- **Radix UI**: Accessible, unstyled UI primitives
- **Lucide React**: Icon library

### File Upload
- **Uppy**: File upload widget with dashboard modal
- **@uppy/aws-s3**: S3-compatible upload handling

### Payment Processing
- **Manual Flow**: Venmo/Zelle payment instructions displayed on confirmation page
- No integrated payment processor (by design)

### Environment Variables Required
- `DATABASE_URL`: PostgreSQL connection string
- `PUBLIC_OBJECT_SEARCH_PATHS`: Paths for public object storage access (optional)
- Admin password configured in application code (currently hardcoded as `admin123`)