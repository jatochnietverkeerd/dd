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
- **vehicles**: Core entity storing car inventory (brand, model, year, price, mileage, fuel type, transmission, color, description, images, featured status)
- **contacts**: Customer inquiries and contact form submissions
- **users**: Basic user authentication system (username/password)
- **reservations**: Vehicle reservations with customer details, deposit amounts, and payment intent IDs
- **admin_sessions**: Session management for admin authentication

### API Endpoints
- `GET /api/vehicles` - Retrieve all vehicles
- `GET /api/vehicles/featured` - Get featured vehicles for homepage
- `GET /api/vehicles/:id` - Get specific vehicle details
- `POST /api/vehicles` - Create new vehicle listing
- `POST /api/contacts` - Submit contact form
- `POST /api/reservations` - Create vehicle reservation
- `GET /api/reservations` - Get all reservations (admin only)
- `GET /api/vehicles/:id/reservations` - Get reservations for specific vehicle (admin only)
- `POST /api/create-payment-intent` - Create payment intent for reservation deposit

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
- Pre-populated with sample premium vehicles (BMW, Mercedes, Audi, etc.)

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