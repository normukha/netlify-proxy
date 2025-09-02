// netlify/functions/fetch-proxy.js
const ALLOW_HOSTS = new Set([
  'www.vvapplianceparts.com',
  'www.appliancerepair.homedepot.com',          // ← added
]);

const BROWSER_HEADERS = {
  'Accept': 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Upgrade-Insecure-Requests': '1',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) ' +
    'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
};

exports.handler = async (event) => {
  try {
    const target = (event.queryStringParameters && event.queryStringParameters.url) || '';
    if (!target) return resp(400, 'Missing ?url=');

    let u;
    try { u = new URL(target); } catch { return resp(400, 'Bad url'); }
    if (!ALLOW_HOSTS.has(u.hostname)) return resp(403, 'Host not allowed');

    const r = await fetch(target, {
      headers: { ...BROWSER_HEADERS, Referer: `${u.protocol}//${u.hostname}/` },
      redirect: 'follow',
    });

    const body = await r.text();
    return {
      statusCode: r.status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Vary': 'Origin',
        'Content-Type': r.headers.get('content-type') || 'text/html; charset=utf-8',
      },
      body,
    };
  } catch (e) {
    return resp(500, String(e && e.message || e));
  }
};

function resp(code, body) {
  return {
    statusCode: code,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'text/plain; charset=utf-8',
    },
    body,
  };
}
