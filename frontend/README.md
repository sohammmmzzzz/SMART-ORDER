# Frontend - Next.js Application

## Overview

A modern, responsive frontend built with Next.js 14, featuring role-based dashboards, real-time updates, and smooth animations.

## Features

- **Authentication**: Secure JWT-based authentication
- **Role-Based Access**: Different dashboards for users, pantry staff, and admins
- **Real-time Updates**: Supabase Realtime for live order updates
- **Smooth Animations**: Anime.js for polished UI interactions
- **Responsive Design**: Works on mobile, tablet, and desktop
- **Modern UI**: Built with Tailwind CSS and shadcn/ui components

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment Variables

```bash
cp .env.example .env.local
```

Edit `.env.local` with your actual values:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_UNSPLASH_ACCESS_KEY=your_unsplash_access_key
```

### 3. Run Development Server

```bash
npm run dev
```

The app will be available at http://localhost:3000

## Project Structure

```
frontend/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home/redirect page
│   ├── login/             # Login page
│   ├── user/              # User dashboard
│   ├── pantry/            # Pantry dashboard
│   └── admin/             # Admin dashboard
├── components/            # React components
│   └── ui/               # shadcn/ui components
├── lib/                   # Utilities and configurations
│   ├── api.ts            # API client
│   ├── supabase.ts       # Supabase client
│   └── utils.ts          # Helper functions
├── store/                 # Zustand state management
│   ├── authStore.ts      # Authentication state
│   └── orderStore.ts     # Order state
└── public/                # Static assets
```

## User Flows

### User Role
1. Login → Location selection
2. Browse menu by categories
3. Select items and add to cart
4. Place order with 5-second countdown
5. Track order preparation (15-minute timer)

### Pantry Role
1. Login → Dashboard
2. View pending orders (one at a time)
3. Navigate between orders with arrow buttons or swipe
4. Mark orders as complete
5. View order history

### Admin Role
1. Login → Dashboard
2. View analytics and statistics
3. Monitor orders by location and time
4. Access complete order history
5. Filter and export data

## Key Features

### Animations
- Page transitions with Anime.js
- Card hover effects
- Smooth modal animations
- Loading states and transitions

### Real-time Updates
- Live order status changes
- Automatic refresh for pantry dashboard
- Supabase Realtime subscriptions

### Responsive Design
- Mobile-first approach
- Touch gestures for mobile/tablet
- Adaptive layouts for all screen sizes

## Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Build for Production

```bash
# Build the application
npm run build

# Test the production build locally
npm run start
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import your repository in Vercel
3. Configure environment variables
4. Deploy

### Other Platforms

The app can be deployed to any platform that supports Next.js:
- Netlify
- AWS Amplify
- Railway
- DigitalOcean App Platform

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| NEXT_PUBLIC_API_URL | Backend API URL | Yes |
| NEXT_PUBLIC_SUPABASE_URL | Supabase project URL | Yes |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Supabase anonymous key | Yes |
| NEXT_PUBLIC_UNSPLASH_ACCESS_KEY | Unsplash API key for images | Optional |

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Performance

- Code splitting with Next.js
- Image optimization with next/image
- Lazy loading for heavy components
- Optimized bundle size

## Troubleshooting

### Can't connect to backend
- Ensure backend is running on port 8000
- Check NEXT_PUBLIC_API_URL in .env.local
- Verify CORS settings in backend

### Real-time updates not working
- Check Supabase URL and key
- Ensure Realtime is enabled in Supabase
- Verify network connection

### Build errors
- Delete .next folder and node_modules
- Run `npm install` again
- Check for TypeScript errors

## Test Accounts

After setting up the database:

| Username | Password | Role |
|----------|----------|------|
| admin | password123 | admin |
| pantry1 | password123 | pantry |
| user1 | password123 | user |

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

## License

MIT
