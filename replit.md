# DD Cars - Premium Auto Dealership Platform

## Overview

DD Cars is a premium auto dealership platform built with a full-stack TypeScript architecture. The application serves as a luxury car dealership website featuring vehicle listings, contact forms, and a sleek, responsive design targeted at high-end automobile sales.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for development and production builds
- **UI Library**: Radix UI components with shadcn/ui styling system
- **Styling**: Tailwind CSS with custom dark theme and luxury gold accents
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for client-side routing
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database (serverless PostgreSQL)
- **API Pattern**: RESTful API with JSON responses
- **Session Management**: PostgreSQL session store with connect-pg-simple

### Development Environment
- **Development Server**: Vite dev server with HMR
- **TypeScript**: Strict mode with modern ES features
- **Package Manager**: npm with lock file
- **Build Process**: Vite for frontend, esbuild for backend bundling

### Luxury Micro-Interactions
- **Scroll Animations**: Fade-in animations triggered by intersection observer
- **Hover Effects**: Smooth scale transformations and golden glow effects
- **Lazy Loading**: Performance-optimized image loading with fade-in transitions
- **Smooth Scrolling**: Custom scrollbar styling and smooth navigation
- **Button Animations**: Luxury shimmer effects and elevation on hover
- **Staggered Animations**: Delayed animations for grid items and lists
- **Navigation**: Underline animations on menu items

## Key Components

### Database Schema
- **vehicles**: Core entity storing car inventory (brand, model, year, price, mileage, fuel type, transmission, color, description, images, featured status, slug, metaTitle, metaDescription)
- **contacts**: Customer inquiries and contact form submissions
- **users**: Basic user authentication system (username/password)
- **reservations**: Vehicle reservations with customer details, deposit amounts, and payment intent IDs
- **admin_sessions**: Session management for admin authentication

### API Endpoints
- `GET /api/vehicles` - Retrieve all vehicles
- `GET /api/vehicles/featured` - Get featured vehicles for homepage
- `GET /api/vehicles/:id` - Get specific vehicle details
- `GET /api/vehicles/slug/:slug` - Get vehicle by SEO-friendly slug
- `POST /api/vehicles` - Create new vehicle listing
- `POST /api/contacts` - Submit contact form
- `POST /api/reservations` - Create vehicle reservation
- `GET /api/reservations` - Get all reservations (admin only)
- `GET /api/vehicles/:id/reservations` - Get reservations for specific vehicle (admin only)
- `POST /api/create-payment-intent` - Create payment intent for reservation deposit
- `GET /sitemap.xml` - Dynamic sitemap generation for SEO
- `GET /robots.txt` - Robots.txt for search engine crawlers

### Pages
- **Home**: Landing page with hero, features, vehicle showcase, about, and contact sections
- **Aanbod**: Dedicated vehicle inventory page with filtering and sorting capabilities
- **VehicleDetail**: Individual vehicle detail pages with comprehensive information, media, and inspection details
- **OverOns**: Dedicated about page with storytelling, team profiles, testimonials, and partner logos
- **AdminLogin**: Secure admin login page for dashboard access
- **AdminDashboard**: Admin interface for vehicle and contact management

### UI Components
- **VehicleCard**: Individual vehicle display with pricing and specs, includes lazy loading and hover animations
- **VehicleShowcase**: Grid layout for vehicle listings on homepage with staggered fade-in animations
- **Contact**: Contact form with validation and smooth fade-in animations
- **Hero**: Landing page hero section with animated text and lazy-loaded background
- **Features**: Service highlights section with scroll-triggered animations
- **About**: Company information section with fade-in animations and hover effects
- **Header**: Navigation with routing, includes underline animations on hover
- **Footer**: Site footer with links and contact information
- **ReservationForm**: Secure vehicle reservation form with Stripe payment integration
- **LazyImage**: Performance-optimized image loading with fade-in effects

### Storage Layer
- **MemStorage**: In-memory storage implementation for development
- **IStorage**: Interface defining storage operations
- Pre-populated with affordable premium vehicles (Volkswagen GTI models, Mercedes A35 AMG, etc.) in 20.000-45.000 euro range

## Data Flow

1. **Client Request**: React components use TanStack Query to fetch data
2. **API Layer**: Express routes handle HTTP requests and validation
3. **Storage Layer**: Storage interface abstracts database operations
4. **Database**: Drizzle ORM manages PostgreSQL interactions
5. **Response**: JSON responses sent back to client
6. **UI Update**: React Query updates UI state automatically

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Serverless PostgreSQL driver
- **drizzle-orm**: Type-safe database ORM
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: Headless UI components
- **tailwindcss**: Utility-first CSS framework
- **zod**: Schema validation
- **react-hook-form**: Form state management

### Development Dependencies
- **vite**: Build tool and dev server
- **typescript**: Static type checking
- **tsx**: TypeScript execution for development
- **esbuild**: Backend bundling for production

## Deployment Strategy

### Build Process
1. **Frontend**: Vite builds React app to `dist/public`
2. **Backend**: esbuild bundles server code to `dist/index.js`
3. **Database**: Drizzle migrations applied via `db:push` script

### Environment Configuration
- **Development**: Uses Vite dev server with HMR
- **Production**: Serves static files from Express with built frontend
- **Database**: PostgreSQL connection via DATABASE_URL environment variable

### Scripts
- `dev`: Development server with tsx
- `build`: Production build for both frontend and backend
- `start`: Production server
- `check`: TypeScript type checking
- `db:push`: Database schema updates

### Replit Integration
- Custom Vite plugins for Replit environment
- Development banner for external access
- Cartographer plugin for code visualization
- Runtime error overlay for debugging

The application uses a modern, type-safe architecture with excellent developer experience through hot reloading, strict TypeScript, and comprehensive tooling integration.

## SEO Optimizations (Recent Changes)

### Technical SEO Enhancements
- **Meta Tags**: Comprehensive meta tag implementation with Dutch language support
- **Open Graph**: Full Open Graph protocol implementation for social media sharing
- **Twitter Cards**: Twitter-specific meta tags for optimal social sharing
- **Structured Data**: JSON-LD schema.org markup for search engines
- **Sitemap**: Dynamic XML sitemap generation for all pages and vehicle listings
- **Robots.txt**: Search engine crawler instructions with proper directives

### URL Structure
- **SEO-friendly URLs**: Changed from `/vehicle/:id` to `/auto/:slug` format
- **Slug Generation**: Automatic slug creation using brand, model, and year
- **Meta Generation**: Automatic meta title and description generation for each vehicle
- **Dynamic Meta Updates**: Page-specific meta tags updated via JavaScript for SPA

### Performance Optimizations
- **Lazy Loading**: Intersection Observer API for efficient image loading
- **Image Optimization**: Automatic image optimization for Unsplash images
- **Preconnects**: DNS prefetch and preconnect for external resources
- **Semantic HTML**: Proper HTML5 semantic structure throughout

### Content Optimization
- **Dutch Language**: Full Dutch language implementation in meta tags and content
- **Breadcrumbs**: Semantic navigation structure
- **Schema Markup**: Vehicle-specific structured data for rich snippets
- **Alt Text**: Descriptive alt text for all images

### Performance Metrics
- **Core Web Vitals**: Optimized loading performance
- **Lighthouse**: SEO score improvements through technical optimizations
- **Page Speed**: Reduced initial load times through lazy loading and image optimization

## Premium Invoice System (Latest Update - July 11, 2025)

### Professional Invoice Generation
- **PDFKit-based Generation**: Reliable PDF generation using PDFKit instead of Puppeteer for serverless compatibility
- **Premium Design**: Luxury-themed invoice layout with dark header, gold accents, and professional typography
- **Individual Car Invoices**: Each vehicle generates separate purchase or sale invoices with proper formatting
- **VAT Compliance**: Proper VAT breakdown with excl. BTW, BTW amount, and total calculations
- **Margeregeling Support**: Automatic handling of margin scheme invoices with proper disclaimers

### Enhanced Layout Features
- **Professional Header**: Dark background with gold "DD CARS" branding and invoice type
- **Structured Information**: Clear sections for company info, customer/supplier, vehicle details, and financials
- **Table-style Vehicle Details**: Organized vehicle information with labels and values
- **Financial Breakdown**: Detailed cost breakdown including BPM, transport, maintenance, and cleaning costs
- **Premium Footer**: Company tagline "Premium Performance • GTI & AMG Specialists" with contact information

### Advanced Modal Interface
- **Professional Modal**: Enhanced invoice modal with better accessibility and user experience
- **Four Main Actions**: View (inline), Download, Print, and Email functionality
- **Loading States**: Proper loading indicators and error handling
- **Email Validation**: Built-in email validation and user feedback
- **Responsive Design**: Mobile-friendly modal with clear action buttons

### Technical Implementation
- **PDFKit**: Serverless-compatible PDF generation with professional styling
- **Typography**: Helvetica font family with proper weights and sizes
- **Color Scheme**: Dark headers (#1a1a1a), gold accents (#D4AF37), and professional layout
- **Authentication**: Secure token-based authentication for all invoice operations
- **Error Handling**: Comprehensive error handling with user-friendly messages

## Vehicle Focus Update (July 2025)

### Affordable Premium Car Range
- **Price Range**: 20.000 - 45.000 euro target market
- **Brand Focus**: Volkswagen GTI models (Golf GTI, Polo GTI, T-Roc), Mercedes-Benz A-Class AMG
- **Target Audience**: Young professionals and enthusiasts looking for accessible premium performance
- **Unique Offering**: GTI Duo package (Polo GTI + Golf GTI combination)

### Updated Vehicle Inventory
- **Volkswagen Golf GTI 2023**: €38.900 - Tornado Red, 245 PK, handgeschakeld
- **Volkswagen T-Roc R-Line 2022**: €32.500 - Deep Black Pearl, 190 PK, automaat
- **Volkswagen Polo GTI 2024**: €29.900 - Pure White, 207 PK, nieuwstaat
- **Mercedes-Benz A35 AMG 2022**: €42.900 - Mountain Grey, 306 PK, AMG Performance
- **Volkswagen Golf R 2021**: €44.500 - Lapiz Blue, 320 PK, vierwielaandrijving
- **GTI Duo Package 2024**: €65.000 - Exclusive Polo GTI + Golf GTI combination

### Market Positioning
- **Accessibility**: Focus on attainable luxury performance cars
- **Performance**: Emphasis on GTI heritage and AMG engineering
- **Value Proposition**: Premium features at accessible price points
- **Target Demographics**: 25-45 age group, performance enthusiasts, first-time luxury buyers

## Simplified Vehicle Management Workflow (Latest Update - July 11, 2025)

### Working Vehicle Sales System
- **Fixed Form Validation**: Sales form now correctly validates and submits data
- **Schema Correction**: Database numeric fields properly converted from JavaScript numbers to strings
- **Working Registration**: Users can successfully register vehicle sales through the form
- **Complete Separation**: Vehicle details, purchase data, and sales data kept completely separate
- **Manual Control**: Dedicated purchase/sale buttons provide full control over workflow

### BPM Compliance Features (July 10, 2025)
- **BPM Calculation Fields**: CO2 emission, first registration date, catalog price
- **Automatic Concept Sale Creation**: When vehicle status changes to "verkocht", system automatically creates concept sale registration
- **Total Cost Price Integration**: Includes all costs (purchase + transport + maintenance + BPM) in profit calculations
- **Schema Validation**: Proper date handling and optional field validation for BPM fields

### Key Features
- **Collapsible Sections**: Purchase details can be shown/hidden for clean interface
- **Live Calculations**: Purchase totals and profit margins update in real-time
- **VAT Type Selection**: Proper compliance with Dutch automotive tax regulations
- **Color-coded Profit Display**: Green for profit, red for loss, with percentage margins
- **Supplier Management**: Track vehicle suppliers and invoice numbers

### Technical Implementation
- **Form Validation**: Zod schema validation with date transformation for all purchase fields
- **Real-time Watching**: React Hook Form watch for live calculations
- **Utility Functions**: Shared VAT calculation utilities for consistency
- **Error Handling**: Comprehensive error handling and recovery mechanisms
- **Enhanced Logging**: Detailed validation error logging for debugging

### Database Stability Improvements
- **Schema Synchronization**: All database columns properly synchronized
- **Validation Fixed**: Numeric fields properly converted between JavaScript numbers and database strings
- **Data Persistence**: Reliable data storage without cache issues
- **Error Prevention**: Comprehensive error handling and recovery mechanisms
- **Working Forms**: All purchase and sale forms now submit successfully

## Premium Invoice System Completed (July 11, 2025)

### Major Invoice System Overhaul
- **Complete PDF Redesign**: Switched from Puppeteer to PDFKit for reliable serverless PDF generation
- **Professional Layout**: Premium invoice design with dark header, structured sections, and luxury styling
- **VAT Compliance**: Proper VAT breakdown showing excl. BTW, BTW amount, and total with correct calculations
- **BPM Support**: Integrated BPM fields in vehicle details and financial calculations
- **Margeregeling Implementation**: Automatic margin scheme handling with proper legal disclaimers

### Key Features Implemented
- **Modal Interface**: Professional invoice modal with four main actions (View, Download, Print, Email)
- **Authentication**: Secure token-based authentication for all invoice operations
- **Error Handling**: Comprehensive error handling with user-friendly feedback messages
- **Email Integration**: Working email functionality with validation and delivery confirmation
- **Premium Branding**: "DD CARS" header with "Premium Performance • GTI & AMG Specialists" tagline

## Visual Updates (July 10, 2025)

### Hero Section Redesign
- **New Hero Image**: Premium Volkswagen GTI performance cars showcasing brand focus
- **Updated Messaging**: "Premium Performance" with "GTI & AMG Specialists" tagline
- **Performance Focus**: Messaging aligned with affordable premium performance market
- **Visual Consistency**: Hero imagery matches inventory focus on GTI and AMG vehicles