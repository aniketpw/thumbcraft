/**
 * Silent Visitor Telemetry for ThumbCraft
 * Logs visitor details (Timestamp, IP, City, Region, Country, ISP, Device, Page)
 * into Google Sheet (Sheet2) via Google Apps Script Webhook.
 */

const GOOGLE_APPS_SCRIPT_WEBHOOK = 
  'https://script.google.com/macros/s/AKfycbxPzp5iv_ukhgiR_1ZydNfg7Th7WmnIBJda00aaz4meXB_fYHSJ_Riu3AzTYLGgIq_yGg/exec';

function parseDevice(ua: string): string {
  if (!ua) return 'Unknown Device';
  let os = 'Unknown OS';
  if (/android/i.test(ua)) os = 'Android';
  else if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS';
  else if (/windows/i.test(ua)) os = 'Windows';
  else if (/macintosh|mac os/i.test(ua)) os = 'macOS';
  else if (/linux/i.test(ua)) os = 'Linux';

  let browser = 'Browser';
  if (/edg/i.test(ua)) browser = 'Edge';
  else if (/chrome|crios/i.test(ua)) browser = 'Chrome';
  else if (/safari/i.test(ua) && !/chrome|crios/i.test(ua)) browser = 'Safari';
  else if (/firefox|fxios/i.test(ua)) browser = 'Firefox';
  else if (/opera|opr/i.test(ua)) browser = 'Opera';

  const isMobile = /mobile|android|iphone/i.test(ua);
  return `${os} (${browser}${isMobile ? ' Mobile' : ''})`;
}

export async function logVisitorTelemetry(pageName: string = 'ThumbCraft'): Promise<void> {
  // Prevent flood: log once per session (15 minutes cooldown)
  try {
    const lastVisitKey = 'thumbcraft_last_visit_log';
    const lastVisit = sessionStorage.getItem(lastVisitKey);
    const now = Date.now();
    if (lastVisit && now - parseInt(lastVisit, 10) < 15 * 60 * 1000) {
      return;
    }
    sessionStorage.setItem(lastVisitKey, now.toString());
  } catch {}

  try {
    let ip = 'Unknown IP';
    let city = 'Online Visitor';
    let region = '';
    let country = 'India';
    let isp = 'Broadband/Mobile';

    // 1. Fetch IP & Geolocation
    try {
      const geoRes = await fetch('https://ipwho.is/', { signal: AbortSignal.timeout(3500) });
      if (geoRes.ok) {
        const geoData = await geoRes.json();
        if (geoData.success) {
          ip = geoData.ip || ip;
          city = geoData.city || city;
          region = geoData.region || region;
          country = geoData.country || country;
          isp = geoData.connection?.isp || geoData.connection?.org || isp;
        }
      }
    } catch {
      // Fallback Geo service if ipwho.is is blocked
      try {
        const fbRes = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(3000) });
        if (fbRes.ok) {
          const fbData = await fbRes.json();
          ip = fbData.ip || ip;
          city = fbData.city || city;
          region = fbData.region || region;
          country = fbData.country_name || country;
          isp = fbData.org || isp;
        }
      } catch {}
    }

    // 2. Format Timestamp in Indian Standard Time (IST)
    const timestamp = new Date().toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });

    // 3. Detect Device & Screen info
    const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
    const device = parseDevice(ua);

    // 4. Construct payload (targeting Sheet2)
    const payload = {
      sheet: 'Sheet2',
      sheetName: 'Sheet2',
      targetSheet: 'Sheet2',
      timestamp,
      ip,
      city,
      region,
      country,
      isp,
      device,
      email: 'Guest (ThumbCraft)',
      page: pageName
    };

    // 5. Send POST to Apps Script Webhook
    await fetch(GOOGLE_APPS_SCRIPT_WEBHOOK, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8'
      },
      body: JSON.stringify(payload)
    });
  } catch (err) {
    // Silent fail so visitor's app experience is never interrupted
    console.debug('Visitor telemetry note:', err);
  }
}
