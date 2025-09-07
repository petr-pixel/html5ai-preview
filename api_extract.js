// api/extract-meta.js
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { url } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }
    
    console.log('Extracting from:', url);
    
    // Fetch webpage with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; html5ai-bot/1.0)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const html = await response.text();
    
    // Simple regex-based extraction (no external dependencies)
    const result = {
      logoUrl: null,
      bgUrl: null,
      primaryColor: null,
      title: '',
      description: ''
    };
    
    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) {
      result.title = titleMatch[1].trim().substring(0, 50);
    }
    
    // Extract description
    const descMatch = html.match(/<meta[^>]+name=["\']description["\'][^>]+content=["\']([^"']+)["\'][^>]*>/i);
    if (descMatch) {
      result.description = descMatch[1].trim().substring(0, 80);
    }
    
    // Extract OG image (for background)
    const ogImageMatch = html.match(/<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"']+)["\'][^>]*>/i);
    if (ogImageMatch) {
      result.bgUrl = new URL(ogImageMatch[1], url).href;
    }
    
    // Extract favicon (for logo)
    const faviconMatches = [
      html.match(/<link[^>]+rel=["\'](?:icon|shortcut icon)["\'][^>]+href=["\']([^"']+)["\'][^>]*>/i),
      html.match(/<link[^>]+rel=["\']apple-touch-icon["\'][^>]+href=["\']([^"']+)["\'][^>]*>/i)
    ];
    
    for (const match of faviconMatches) {
      if (match) {
        try {
          result.logoUrl = new URL(match[1], url).href;
          break;
        } catch (e) {
          console.log('Invalid logo URL:', match[1]);
        }
      }
    }
    
    // Extract theme color
    const themeColorMatch = html.match(/<meta[^>]+name=["\']theme-color["\'][^>]+content=["\']([^"']+)["\'][^>]*>/i);
    if (themeColorMatch) {
      result.primaryColor = themeColorMatch[1];
    }
    
    // Fallback: try common logo paths
    if (!result.logoUrl) {
      const urlObj = new URL(url);
      const commonPaths = ['/favicon.ico', '/favicon.png', '/logo.png'];
      result.logoUrl = urlObj.origin + '/favicon.ico'; // Default fallback
    }
    
    console.log('Extracted:', result);
    
    return res.status(200).json(result);
    
  } catch (error) {
    console.error('Extract error:', error.message);
    
    return res.status(500).json({ 
      error: 'Failed to extract data',
      details: error.name === 'AbortError' ? 'Request timeout' : error.message 
    });
  }
}