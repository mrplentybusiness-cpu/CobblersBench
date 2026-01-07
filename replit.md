# Cobbler's Bench - E-commerce Platform

## Overview

Cobbler's Bench is a production-ready e-commerce website for a cobbler/shoe repair business. The application provides a public storefront for customers to browse repair services and leather goods, a shopping cart system, and a manual payment checkout flow using Venmo (@Victor-Hadawar). An admin dashboard allows product and order management.

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
- **Tables**: products, product_images, orders, order_items, service_inquiries, reviews with proper foreign key relationships

### Product Management (Shopify-like)
The products table includes comprehensive fields for professional product management:
- **Status**: active/draft/archived - only active products shown on storefront
- **Inventory**: Optional tracking with low-stock warnings (5 or fewer items)
- **Pricing**: Price, compare-at price (for sales), cost per item (for margin calculation)
- **SKU**: Stock keeping unit for internal tracking
- **Tags**: Comma-separated tags for organization

### Product Variants (Shopify-like)
Products can have options and variants for different sizes, colors, etc:
- **Product Options**: Up to 3 options per product (e.g., Size, Color, Material)
- **Option Values**: Each option has an array of values (e.g., S, M, L, XL)
- **Variants**: Auto-generated combinations of option values with individual pricing
- **Variant Fields**: Each variant can have its own price, SKU, inventory, and status
- **Tables**: product_options (name, values array, position), product_variants (title, optionValues JSON, pricing, inventory)

### Checkout & Delivery Options
- **Delivery Methods**: Shipping ($8.99, free over $100) or In-Store Pickup (free)
- **Pickup Location**: 1600 Falmouth Rd, Centerville, MA 02632
- **Pickup Hours**: Mon-Fri 8AM-4PM, Sat 8AM-12PM
- **Payment**: Venmo only (@Victor-Hadawar) - manual payment after checkout
- **Tax**: MA Sales Tax (6.25%) applied to all orders

### Order Management (Shopify-like)
The orders table includes comprehensive fields for professional order management:
- **Delivery Method**: shipping/pickup - stored per order for fulfillment tracking
- **Payment Status**: unpaid/paid - toggle directly from order list or detail view
- **Fulfillment Status**: unfulfilled/shipped/delivered/fulfilled
- **Archive**: Orders can be archived (hidden from main view) without deleting
- **Admin Notes**: Internal notes visible only to admin
- **Tracking Number**: For shipment tracking
- **Customer Details**: Name, email, phone, full shipping address with state
- **Repair Description**: Special work order instructions from customers

### Service Inquiry Management
Service inquiries allow customers to request quotes for repair services (pricing varies per job):
- **Form Submission**: Customers submit via Services page with name, email, phone, service type, description
- **Status Tracking**: new/in-progress/closed - managed from admin dashboard
- **Admin Notes**: Internal notes for tracking communications and quotes
- **Admin Tab**: Dedicated tab in admin dashboard with list view, status management, and detail dialog

### Customer Reviews Management
Customer reviews/testimonials displayed on the homepage:
- **Database Storage**: Reviews stored in `reviews` table with customer name, location, rating, content, image URL
- **Featured Toggle**: Admin can mark reviews as "featured" to show on homepage
- **Fallback Display**: If no featured reviews exist, shows 3 default testimonials
- **Admin Tab**: "Reviews" tab in admin dashboard to add, edit, delete, and toggle featured status
- **Homepage Display**: Up to 3 featured reviews shown in Customer Stories section

### API Structure
RESTful API endpoints under `/api/`:
- `GET /api/products` - List all products (admin)
- `GET /api/products/active` - List active products only (storefront)
- `POST /api/products` - Create product
- `GET/PATCH/DELETE /api/products/:id` - Product CRUD operations
- `GET/POST /api/products/:id/images` - Product image management
- `GET /api/orders?includeArchived=true` - List orders with archive filter
- `POST /api/orders` - Create order
- `GET /api/orders/:id` - Get order details
- `PATCH /api/orders/:id/status` - Update order status
- `PATCH /api/orders/:id/payment` - Toggle payment status (paid/unpaid)
- `PATCH /api/orders/:id/fulfillment` - Update fulfillment status
- `PATCH /api/orders/:id/tracking` - Update tracking number
- `PATCH /api/orders/:id/notes` - Update admin notes
- `PATCH /api/orders/:id/archive` - Archive/restore order
- `DELETE /api/orders/:id` - Permanently delete order
- `GET /api/service-inquiries` - List all service inquiries
- `POST /api/service-inquiries` - Create inquiry (public)
- `GET /api/service-inquiries/:id` - Get inquiry by ID
- `PATCH /api/service-inquiries/:id/status` - Update inquiry status
- `PATCH /api/service-inquiries/:id/notes` - Update inquiry admin notes
- `DELETE /api/service-inquiries/:id` - Delete inquiry
- `POST /api/uploads/request-url` - Presigned URL generation for file uploads
- `GET/PUT /api/products/:id/options` - Bulk manage product options
- `GET/PUT /api/products/:id/variants` - Bulk manage product variants
- `PATCH/DELETE /api/product-options/:id` - Single option operations
- `PATCH/DELETE /api/product-variants/:id` - Single variant operations
- `GET /api/reviews` - List all reviews (admin)
- `GET /api/reviews/featured` - List featured reviews (public, for homepage)
- `POST /api/reviews` - Create review (admin)
- `PATCH /api/reviews/:id` - Update review (admin)
- `DELETE /api/reviews/:id` - Delete review (admin)

### Object Storage Integration
Uses Cloudflare R2 for image uploads (works on both Replit and Railway):
- **Cloudflare R2**: Primary storage with S3-compatible API
- **Public Bucket URL**: https://pub-f6599d1fd6174621afcfcb9c0e548516.r2.dev
- **CORS**: Configured for browser uploads (AllowedOrigins: *, AllowedMethods: GET, PUT, POST, DELETE, HEAD)
- Presigned URL flow for secure direct uploads
- Fallback to Replit Object Storage when R2 is not configured

### Authentication
- Admin dashboard uses simple password-based authentication (stored in environment)
- No user authentication system for customers (manual payment flow)

## External Dependencies

### Database
- **PostgreSQL**: Primary database, connection via `DATABASE_URL` environment variable
- **Drizzle ORM**: Type-safe database queries and schema management

### Object Storage
- **Primary**: Cloudflare R2 with S3-compatible API for image uploads
- **Fallback**: Replit Object Storage (Google Cloud Storage-compatible) when on Replit
- R2 credentials: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_PUBLIC_URL

### UI Component Libraries
- **shadcn/ui**: Comprehensive component library built on Radix UI primitives
- **Radix UI**: Accessible, unstyled UI primitives
- **Lucide React**: Icon library

### File Upload
- **Uppy**: File upload widget with dashboard modal
- **@uppy/aws-s3**: S3-compatible upload handling

### Payment Processing
- **Manual Flow**: Venmo (@Victor-Hadawar) payment instructions displayed on confirmation page
- No integrated payment processor (by design)

### Environment Variables Required
- `DATABASE_URL`: PostgreSQL connection string
- `GMAIL_APP_PASSWORD`: Gmail app password for SMTP email sending
- `ADMIN_PASSWORD`: Admin dashboard password (required secret)
- `R2_ACCOUNT_ID`: Cloudflare account ID for R2 storage
- `R2_ACCESS_KEY_ID`: R2 API token access key
- `R2_SECRET_ACCESS_KEY`: R2 API token secret key
- `R2_BUCKET_NAME`: R2 bucket name (cobblers-bench)
- `R2_PUBLIC_URL`: R2 public bucket URL
- `RAILWAY_PUBLIC_DOMAIN`: (Railway only) Set automatically by Railway for email logo URL

### Email Notifications
- Uses Nodemailer SMTP with Gmail app password authentication
- All order emails sent from: cobblersbenchcapecod@gmail.com
- Customer confirmation emails sent on checkout
- Admin notification emails sent for new orders
- Order status update emails sent when payment/fulfillment changes
- Business logo embedded in all email templates

### Image Uploads
- **Primary Method**: Direct file upload to Cloudflare R2 (works on Replit and Railway)
- **Alternative**: URL input for external image links
- R2 provides reliable image hosting across all deployment platforms

## Railway Deployment

### Required Environment Variables
Set these in Railway's Variables tab:

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `GMAIL_APP_PASSWORD` | Gmail app password (16-char) | `abcd efgh ijkl mnop` |
| `ADMIN_PASSWORD` | Admin dashboard password | `your-secure-password` |
| `R2_ACCOUNT_ID` | Cloudflare account ID | `0a33ed0487836b6b0f4ce60235a7e946` |
| `R2_ACCESS_KEY_ID` | R2 API token access key | `your-access-key` |
| `R2_SECRET_ACCESS_KEY` | R2 API token secret key | `your-secret-key` |
| `R2_BUCKET_NAME` | R2 bucket name | `cobblers-bench` |
| `R2_PUBLIC_URL` | R2 public bucket URL | `https://pub-f6599d1fd6174621afcfcb9c0e548516.r2.dev` |
| `NODE_ENV` | Set to production | `production` |
| `PORT` | Server port (Railway sets this) | `5000` |

### Build & Start Commands
- **Build**: `npm run build`
- **Start**: `npm run start`

### Database Setup
1. Add PostgreSQL plugin to your Railway project
2. Copy the `DATABASE_URL` from Railway's database service
3. Run database migrations after first deploy

### Important Notes for Railway
- Email logo is served from `/images/email-logo.png` (static asset)
- Product images uploaded via Cloudflare R2 (same bucket works on both Replit and Railway)
- Cloudflare R2 CORS must be configured to allow browser uploads
- RAILWAY_PUBLIC_DOMAIN is auto-set by Railway for deployed apps