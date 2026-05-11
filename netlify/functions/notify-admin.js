const nodemailer = require('nodemailer');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  try {
    const { order, admin_email } = JSON.parse(event.body);

    if (!order) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Order data required' }) };
    }

    const gmailEmail = process.env.GMAIL_EMAIL;
    const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;

    if (!gmailEmail || !gmailAppPassword) {
      return { statusCode: 500, body: JSON.stringify({ error: 'Gmail credentials not configured' }) };
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailEmail,
        pass: gmailAppPassword,
      },
    });

    const items = Array.isArray(order.order_items) ? order.order_items : JSON.parse(order.order_items || '[]');
    const shipData = order.shipping_data ? (typeof order.shipping_data === 'string' ? JSON.parse(order.shipping_data) : order.shipping_data) : {};

    const itemsList = items.map(item => `• ${item.quantity}x ${item.product_name} - S$${((item.unit_price_cents || 0) * item.quantity / 100).toFixed(2)}`).join('\n');
    const subtotal = ((order.subtotal_cents || 0) / 100).toFixed(2);
    const shipping = order.shipping_cents === 0 ? 'FREE' : 'S$' + ((order.shipping_cents || 0) / 100).toFixed(2);
    const discount = order.discount_cents > 0 ? 'S$' + ((order.discount_cents || 0) / 100).toFixed(2) : '-';
    const total = ((order.total_cents || 0) / 100).toFixed(2);

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1A1108; padding: 20px; text-align: center; border-bottom: 2px solid #C9933A;">
          <h1 style="color: #C9933A; margin: 0; font-size: 24px;">EEBECCO</h1>
          <p style="color: #F5ECD7; margin: 5px 0 0;">New Order Received</p>
        </div>

        <div style="padding: 20px; background: #f9f9f9;">
          <h2 style="color: #333; margin-top: 0;">Order #${order.id.substring(0, 8).toUpperCase()}</h2>
          <p style="color: #666; margin-bottom: 20px;">${new Date(order.created_at).toLocaleString('en-US', { timeZone: 'Asia/Singapore', dateStyle: 'long', timeStyle: 'short' })}</p>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd; color: #666;">Customer</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd; font-weight: bold;">${order.customer_name || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd; color: #666;">Email</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;"><a href="mailto:${order.email}">${order.email || 'N/A'}</a></td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd; color: #666;">Phone</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${shipData.recipient_phone || 'N/A'}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #ddd; color: #666;">Shipping Method</td>
              <td style="padding: 8px; border-bottom: 1px solid #ddd;">${shipData.carrier || 'N/A'} - ${shipData.method || 'N/A'}</td>
            </tr>
          </table>

          <h3 style="color: #333; border-bottom: 2px solid #C9933A; padding-bottom: 10px;">Items Ordered</h3>
          <pre style="background: #fff; padding: 15px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; line-height: 1.6; overflow-x: auto;">${itemsList}</pre>

          <table style="width: 100%; margin-top: 20px;">
            <tr>
              <td style="padding: 8px;">Subtotal</td>
              <td style="padding: 8px; text-align: right;">S$${subtotal}</td>
            </tr>
            <tr>
              <td style="padding: 8px;">Shipping</td>
              <td style="padding: 8px; text-align: right;">${shipping}</td>
            </tr>
            ${order.discount_cents > 0 ? `<tr style="color: #6DA85E;"><td style="padding: 8px;">Discount (${order.discount_code || ''})</td><td style="padding: 8px; text-align: right;">-${discount}</td></tr>` : ''}
            <tr style="font-weight: bold; font-size: 18px; background: #1A1108; color: #C9933A;">
              <td style="padding: 12px;">TOTAL</td>
              <td style="padding: 12px; text-align: right;">S$${total}</td>
            </tr>
          </table>

          <h3 style="color: #333; margin-top: 30px; border-bottom: 2px solid #C9933A; padding-bottom: 10px;">Shipping Address</h3>
          <p style="color: #333; line-height: 1.6;">
            ${order.customer_name || ''}<br>
            ${shipData.address?.line1 || ''}${shipData.address?.line2 ? '<br>' + shipData.address.line2 : ''}<br>
            ${shipData.address?.postal || ''} ${shipData.address?.city || ''}<br>
            ${shipData.address?.country || ''}
          </p>

          <div style="margin-top: 30px; padding: 20px; background: #C9933A; text-align: center; border-radius: 8px;">
            <a href="https://eebecco.netlify.app/admin/orders.html" style="color: #1A1108; text-decoration: none; font-weight: bold; font-size: 16px;">View Order in Admin →</a>
          </div>
        </div>

        <div style="padding: 15px; text-align: center; color: #999; font-size: 12px;">
          eebecco Admin Notification | ${new Date().toLocaleDateString()}
        </div>
      </div>
    `;

    const mailOptions = {
      from: `"eebecco" <${gmailEmail}>`,
      to: admin_email || gmailEmail,
      subject: `🛒 New Order #${order.id.substring(0, 8).toUpperCase()} - S$${total}`,
      html: emailHtml,
    };

    const info = await transporter.sendMail(mailOptions);

    return { statusCode: 200, body: JSON.stringify({ success: true, messageId: info.messageId }) };
  } catch (err) {
    console.error('Email error:', err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};