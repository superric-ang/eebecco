const https = require('https');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { email, password, fullName } = JSON.parse(event.body);
    if (!email || !password || !fullName) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields' }) };
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
      return { statusCode: 500, body: JSON.stringify({ error: 'Server configuration error.' }) };
    }

    const body = JSON.stringify({
      email,
      password,
      email_confirm: true,
      data: { full_name: fullName },
    });

    const result = await new Promise((resolve, reject) => {
      const url = new URL(`${supabaseUrl}/auth/v1/admin/users`);
      const req = https.request(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
          'Content-Length': Buffer.byteLength(body),
        },
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
          catch { resolve({ status: res.statusCode, body: { error: data.substring(0, 200) } }); }
        });
      });
      req.on('error', reject);
      req.write(body);
      req.end();
    });

    if (result.status >= 400) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: result.body?.msg || result.body?.error || 'Registration failed.' }),
      };
    }

    const userId = result.body?.id;
    if (userId) {
      await new Promise((resolve) => {
        const pbody = JSON.stringify({ id: userId, full_name: fullName });
        const url = new URL(`${supabaseUrl}/rest/v1/profiles`);
        url.searchParams.set('on_conflict', 'id');
        const req = https.request(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': serviceKey,
            'Authorization': `Bearer ${serviceKey}`,
            'Prefer': 'resolution=merge-duplicates',
            'Content-Length': Buffer.byteLength(pbody),
          },
        }, (res) => {
          let d = '';
          res.on('data', c => d += c);
          res.on('end', () => resolve());
        });
        req.on('error', () => resolve());
        req.write(pbody);
        req.end();
      });
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, user: { id: userId, email } }),
    };
  } catch (err) {
    console.error('register-user error:', err.message);
    return { statusCode: 500, body: JSON.stringify({ error: 'Registration failed. Please try again.' }) };
  }
};
