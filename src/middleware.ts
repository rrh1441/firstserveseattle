import { NextRequest, NextResponse } from 'next/server';
import { trackServerEvent } from '@/lib/trackServer';

export function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;
  const userAgent = req.headers.get('user-agent') || '';
  const referer = req.headers.get('referer') || '';
  const ip = req.ip || req.headers.get('x-forwarded-for') || 'unknown';
  
  // Track page views server-side (ad-blocker proof)
  const trackPageView = async () => {
    const baseMetadata = {
      pathname,
      userAgent,
      referer,
      ip,
      timestamp: new Date().toISOString()
    };

    // Landing page
    if (pathname === '/') {
      await trackServerEvent('landing:page_view', {
        ...baseMetadata,
        page: 'landing'
      }, ip);
    }
    
    // Courts page
    else if (pathname === '/courts') {
      await trackServerEvent('courts:page_view', {
        ...baseMetadata,
        page: 'courts'
      }, ip);
    }
    
    // Individual court page
    else if (pathname.startsWith('/courts/')) {
      const courtSlug = pathname.split('/')[2];
      await trackServerEvent('court:page_view', {
        ...baseMetadata,
        page: 'court_detail',
        court_slug: courtSlug
      }, ip);
    }
    
    // Signup page
    else if (pathname === '/signup') {
      const fromPaywall = req.nextUrl.searchParams.get('from') === 'paywall';
      await trackServerEvent('signup:page_view', {
        ...baseMetadata,
        page: 'signup',
        from_paywall: fromPaywall
      }, ip);
    }
    
    // Login page
    else if (pathname === '/login') {
      await trackServerEvent('auth:login_page_view', {
        ...baseMetadata,
        page: 'login'
      }, ip);
    }

    // Checkout success
    else if (pathname === '/checkout-success') {
      await trackServerEvent('billing:checkout_success_page_view', {
        ...baseMetadata,
        page: 'checkout_success'
      }, ip);
    }
  };

  // Track asynchronously to not block the response
  trackPageView().catch(err => 
    console.error('Middleware tracking error:', err)
  );

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.).*)',
  ],
};