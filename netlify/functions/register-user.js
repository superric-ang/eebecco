const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { email, password, fullName } = JSON.parse(event.body);

    if (!email || !password || !fullName) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Missing required fields' }) };
    }

    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

    if (error) {
      return { statusCode: 400, body: JSON.stringify({ error: error.message }) };
    }

    if (data?.user?.id) {
      await supabase
        .from('profiles')
        .upsert(
          { id: data.user.id, full_name: fullName },
          { onConflict: 'id' }
        );
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, user: { id: data.user.id, email: data.user.email } }),
    };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: 'Registration failed. Please try again.' }) };
  }
};
