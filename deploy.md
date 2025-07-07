
# TreeHub Production Deployment Guide

## Prerequisites

1. **Domain Configuration**
   - Ensure treehub.app domain is properly configured
   - SSL certificates are set up and valid
   - DNS records point to the correct server

2. **Environment Variables**
   - Copy `.env.production` to `.env.local` on production server
   - Update `DATABASE_URL` with production database credentials
   - Set secure `NEXTAUTH_SECRET` value
   - Configure any external API keys (ABACUSAI_API_KEY, etc.)

3. **Database Setup**
   - Ensure PostgreSQL is running and accessible
   - Run database migrations: `npx prisma migrate deploy`
   - Seed initial data if needed: `npx prisma db seed`

## Deployment Steps

### 1. Pre-deployment Checks
```bash
# Test the build locally
cd /home/ubuntu/treehub/app
yarn build

# Run type checking
yarn type-check

# Test production build
yarn start
```

### 2. Environment Configuration
```bash
# Copy production environment file
cp .env.production .env.local

# Update database URL and secrets
nano .env.local
```

### 3. Database Setup
```bash
# Generate Prisma client
npx prisma generate

# Deploy database schema
npx prisma migrate deploy

# Seed database (optional)
npx prisma db seed
```

### 4. Build and Deploy
```bash
# Install dependencies
yarn install --frozen-lockfile

# Build the application
yarn build

# Start the production server
yarn start
```

### 5. Post-deployment Verification
- [ ] Test authentication flows (signup/signin)
- [ ] Verify all pages load correctly
- [ ] Check API endpoints functionality
- [ ] Test database connections
- [ ] Verify SSL certificates
- [ ] Check performance metrics
- [ ] Test mobile responsiveness

## Production Configuration Features

### Security
- Rate limiting on API routes
- CSRF protection
- Security headers (CSP, HSTS, etc.)
- Authentication middleware
- Input validation and sanitization

### Performance
- Image optimization
- Static asset caching
- Compression enabled
- Database connection pooling
- API response caching

### SEO & Analytics
- Sitemap generation (`/sitemap.xml`)
- Robots.txt configuration (`/robots.txt`)
- Structured data markup
- Open Graph meta tags
- Twitter Card support
- Google Analytics ready

### Monitoring
- Error logging
- Performance monitoring
- Health check endpoints
- Database query monitoring

## Domain-Specific Configuration

### treehub.app Features
- Custom domain SSL configuration
- Production-ready authentication URLs
- Professional email addresses (support@treehub.app)
- Branded contact information
- Social media integration

### API Configuration
- All API endpoints configured for treehub.app
- CORS settings for production domain
- Rate limiting per IP address
- Secure session management

## Troubleshooting

### Common Issues
1. **Database Connection Errors**
   - Check DATABASE_URL format
   - Verify database server is running
   - Ensure proper network connectivity

2. **Authentication Issues**
   - Verify NEXTAUTH_URL matches domain
   - Check NEXTAUTH_SECRET is set
   - Ensure proper session configuration

3. **Build Errors**
   - Run `yarn type-check` to identify TypeScript issues
   - Check for missing dependencies
   - Verify environment variables are set

### Health Checks
- Application health: `https://treehub.app/api/health`
- Database connectivity: Check admin dashboard
- Authentication: Test login/logout flows

## Maintenance

### Regular Tasks
- Monitor error logs
- Update dependencies
- Database backups
- Performance optimization
- Security updates

### Scaling Considerations
- Database connection pooling
- CDN configuration
- Load balancing
- Caching strategies
- API rate limiting adjustments
