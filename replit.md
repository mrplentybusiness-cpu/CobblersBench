# Cobbler's Bench - E-commerce Platform

## Overview
Cobbler's Bench is a production-ready e-commerce platform designed for a cobbler and shoe repair business. It features a public storefront for browsing repair services and leather goods, a shopping cart, and a manual Venmo payment checkout. An administrative dashboard allows for comprehensive product and order management, including product variants, service inquiries, and site content. The platform aims to provide a robust online presence to expand business reach and streamline operations.

## User Preferences
Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter
- **State Management**: Zustand (with persistence for cart)
- **Data Fetching**: TanStack React Query
- **Styling**: Tailwind CSS v4 and shadcn/ui (New York style)
- **Form Handling**: React Hook Form with Zod validation
- **File Uploads**: Uppy with AWS S3-compatible presigned URL flow

### Backend
- **Framework**: Express.js with TypeScript
- **Server**: Node.js
- **Build Tools**: Vite (client), esbuild (server)
- **Development**: tsx

### Data Storage
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM
- **Schema**: Shared `shared/schema.ts`
- **Migrations**: Drizzle Kit (push-based)
- **Tables**: `products`, `product_images`, `orders`, `order_items`, `service_inquiries`, `reviews`, `site_content`.

### Key Features
- **Product Management**: Shopify-like features including product status (active/draft/archived), inventory tracking, pricing (compare-at price, cost per item), SKUs, tags, and "in-store only" designation.
- **Product Variants**: Support for up to 3 options per product (e.g., Size, Color) with auto-generated variants, individual pricing, SKU, inventory, and status.
- **Gallery**: A dedicated section for "in-store only" items, separate from the main shop, with no e-commerce functionality.
- **Checkout & Delivery**: Options for shipping (with free shipping threshold) or in-store pickup. Manual Venmo payment method only. MA Sales Tax (6.25%) applied.
- **Order Management**: Comprehensive order tracking with delivery method, payment status, fulfillment status, archive functionality, admin notes, and tracking numbers.
- **Service Inquiry Management**: Customers can submit repair service requests via a form, with status tracking (new/in-progress/closed) and admin notes in the dashboard.
- **Customer Reviews Management**: Reviews stored in the database, with admin controls to add, edit, delete, and feature reviews for display on the homepage.
- **Site Content Management**: Dynamic content sections (Hero, About Us, Value Propositions, CTAs, Business Info) editable via the admin portal.
- **API Structure**: RESTful API endpoints for all core functionalities under `/api/`.
- **Authentication**: Session-based authentication for the admin dashboard with server-side token validation.

### UI/UX
- **Design System**: shadcn/ui with "New York" style provides a modern and consistent aesthetic.
- **Component-based**: Reusable React components ensure maintainability and scalability.

## External Dependencies

### Database
- **PostgreSQL**: Primary data store.
- **Drizzle ORM**: For database interaction.

### Object Storage
- **Cloudinary**: Primary for image and video uploads (products, reviews, site content).
- **Cloudflare R2**: Legacy fallback.
- **Replit Object Storage**: Fallback for Replit environments.

### UI Components
- **shadcn/ui**: Component library.
- **Radix UI**: Unstyled primitive components.
- **Lucide React**: Icon library.

### File Upload
- **Uppy**: Frontend file upload library.
- **@uppy/aws-s3**: S3-compatible upload plugin for Uppy.

### Payment Processing
- **Venmo**: Manual payment instructions. No integrated payment gateway.

### Email Services
- **Gmail API**: Primary for sending email notifications (order confirmations, admin alerts, status updates).
- **Nodemailer (SMTP)**: Fallback for email sending.
- **Dynamic Settings**: Email templates pull Venmo handle, business contact info, and from email dynamically from the database via `getEmailSettings()` in `server/email.ts`. Changes made in the Admin Portal are reflected in all outgoing emails automatically.