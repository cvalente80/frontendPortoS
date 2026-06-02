import { useEffect } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { trackPageView } from '../lib/tracking';

export default function TrackingPageView() {
  const location = useLocation();
  const { lang } = useParams();

  useEffect(() => {
    const pagePath = `${location.pathname}${location.search}${location.hash}`;
    trackPageView(pagePath, document.title, lang === 'en' ? 'en' : 'pt');
  }, [location.pathname, location.search, location.hash, lang]);

  return null;
}