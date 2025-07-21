import StaticLandingPage from './components/StaticLandingPage';

// The root of the app is now the landing page - server-side rendered for SEO
export default function HomePage() {
  return <StaticLandingPage />;
}