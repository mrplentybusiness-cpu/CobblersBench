import nodemailer from 'nodemailer';

const BUSINESS_NAME = "Cobbler's Bench";
const LOGO_PATH = '/images/email-logo.png';
const FROM_EMAIL = 'cobblersbenchcapecod@gmail.com';

async function sendViaGmailApi(to: string, subject: string, html: string): Promise<{ success: boolean; method: string; error?: string }> {
  const clientId = process.env.GMAIL_CLIENT_ID?.trim();
  const clientSecret = process.env.GMAIL_CLIENT_SECRET?.trim();
  const refreshToken = process.env.GMAIL_REFRESH_TOKEN?.trim();

  if (!clientId || !clientSecret || !refreshToken) {
    return { success: false, method: 'Gmail API (HTTPS)', error: 'Gmail API credentials not configured (GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN)' };
  }

  try {
    console.log(`[Email] Trying Gmail API (HTTPS) to send to ${to}: "${subject}"`);

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!tokenResponse.ok) {
      const errorBody = await tokenResponse.text();
      const errMsg = `Token request failed (HTTP ${tokenResponse.status}): ${errorBody}`;
      console.error(`[Email] Gmail API token error: ${errMsg}`);
      return { success: false, method: 'Gmail API (HTTPS)', error: errMsg };
    }

    const tokenData = await tokenResponse.json() as any;
    if (!tokenData.access_token) {
      const errMsg = tokenData.error_description || tokenData.error || 'Failed to get access token';
      console.error(`[Email] Gmail API token error: ${errMsg}`);
      return { success: false, method: 'Gmail API (HTTPS)', error: errMsg };
    }

    const mimeMessage = [
      `From: ${BUSINESS_NAME} <${FROM_EMAIL}>`,
      `To: ${to}`,
      `Subject: ${subject}`,
      'MIME-Version: 1.0',
      'Content-Type: text/html; charset=UTF-8',
      '',
      html,
    ].join('\r\n');

    const encodedMessage = Buffer.from(mimeMessage).toString('base64url');

    const sendResponse = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw: encodedMessage }),
    });

    if (!sendResponse.ok) {
      const errorData = await sendResponse.json() as any;
      const errMsg = errorData.error?.message || `HTTP ${sendResponse.status}`;
      console.error(`[Email] Gmail API send error: ${errMsg}`);
      return { success: false, method: 'Gmail API (HTTPS)', error: errMsg };
    }

    const sendData = await sendResponse.json() as any;
    console.log(`[Email] SUCCESS via Gmail API (HTTPS) to ${to}, id: ${sendData.id}`);
    return { success: true, method: 'Gmail API (HTTPS)' };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(`[Email] FAILED via Gmail API (HTTPS): ${errorMsg}`);
    return { success: false, method: 'Gmail API (HTTPS)', error: errorMsg };
  }
}

async function sendViaSmtp(to: string, subject: string, html: string): Promise<{ success: boolean; method: string; error?: string }> {
  const appPassword = process.env.GMAIL_APP_PASSWORD;
  if (!appPassword) {
    return { success: false, method: 'SMTP', error: 'GMAIL_APP_PASSWORD not set' };
  }

  const cleanPassword = appPassword.replace(/\s/g, '');

  const smtpConfigs = [
    {
      name: 'Gmail SSL (port 465)',
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user: FROM_EMAIL, pass: cleanPassword },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    },
    {
      name: 'Gmail STARTTLS (port 587)',
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      auth: { user: FROM_EMAIL, pass: cleanPassword },
      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
    },
  ];

  const errors: string[] = [];

  for (const config of smtpConfigs) {
    const configName = config.name;
    try {
      console.log(`[Email] Trying ${configName} to send to ${to}: "${subject}"`);
      const { name, ...transportConfig } = config;
      const transporter = nodemailer.createTransport(transportConfig as any);

      const info = await transporter.sendMail({
        from: `${BUSINESS_NAME} <${FROM_EMAIL}>`,
        to,
        subject,
        html,
      });
      console.log(`[Email] SUCCESS via ${configName} to ${to}, messageId: ${info.messageId}`);
      return { success: true, method: configName };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error(`[Email] FAILED via ${configName}: ${errorMsg}`);
      errors.push(`${configName}: ${errorMsg}`);
    }
  }

  return { success: false, method: 'SMTP', error: errors.join(' | ') };
}

async function sendEmail(to: string, subject: string, html: string): Promise<{ success: boolean; error?: string }> {
  const gmailApiResult = await sendViaGmailApi(to, subject, html);
  if (gmailApiResult.success) {
    return { success: true };
  }

  console.log(`[Email] Gmail API failed, trying SMTP fallback...`);
  const smtpResult = await sendViaSmtp(to, subject, html);
  if (smtpResult.success) {
    return { success: true };
  }

  const fullError = `All methods failed. Gmail API: ${gmailApiResult.error} | SMTP: ${smtpResult.error}`;
  console.error(`[Email] ${fullError}`);
  return { success: false, error: fullError };
}

export async function testEmailDelivery(testTo: string): Promise<{ success: boolean; error?: string; method?: string }> {
  const testHtml = `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h2>Email Delivery Test</h2>
      <p>This is a test email from ${BUSINESS_NAME}.</p>
      <p><strong>Time:</strong> ${new Date().toISOString()}</p>
      <p><strong>Environment:</strong> ${process.env.NODE_ENV || 'unknown'}</p>
      <p><strong>Platform:</strong> ${process.env.RAILWAY_PUBLIC_DOMAIN ? 'Railway' : process.env.REPLIT_DEPLOYMENT ? 'Replit Deployment' : 'Development'}</p>
      <p>If you receive this email, email delivery is working correctly.</p>
    </div>
  `;
  const subject = `[TEST] Email Delivery Test - ${BUSINESS_NAME}`;

  const gmailApiResult = await sendViaGmailApi(testTo, subject, testHtml);
  if (gmailApiResult.success) {
    return { success: true, method: gmailApiResult.method };
  }

  const smtpResult = await sendViaSmtp(testTo, subject, testHtml);
  if (smtpResult.success) {
    return { success: true, method: smtpResult.method };
  }

  return {
    success: false,
    error: `Gmail API: ${gmailApiResult.error} | SMTP: ${smtpResult.error}`,
  };
}

function getBaseUrl(): string {
  if (process.env.RAILWAY_PUBLIC_DOMAIN) {
    return `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
  }
  if (process.env.REPLIT_DEV_DOMAIN) {
    return `https://${process.env.REPLIT_DEV_DOMAIN}`;
  }
  if (process.env.REPLIT_DOMAINS) {
    const domains = process.env.REPLIT_DOMAINS.split(',');
    return `https://${domains[0]}`;
  }
  return '';
}

export interface OrderDetails {
  orderId: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  shippingAddress: string;
  shippingCity: string;
  shippingState: string | null;
  shippingZip: string;
  total: string;
  shipping: string;
  repairDescription: string | null;
  items: Array<{
    productName: string;
    quantity: number;
    price: string;
    variantTitle?: string | null;
  }>;
}

export async function sendCustomerOrderConfirmation(order: OrderDetails): Promise<void> {
  const itemsHtml = order.items.map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.productName}${item.variantTitle ? ` - ${item.variantTitle}` : ''}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${item.price}</td>
    </tr>
  `).join('');

  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #8B4513; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .order-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        .order-table th { background: #8B4513; color: white; padding: 10px; text-align: left; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="${getBaseUrl()}${LOGO_PATH}" alt="${BUSINESS_NAME}" style="max-width: 180px; height: auto; margin-bottom: 10px;" />
          <p style="margin: 0; font-size: 14px;">Order Confirmation</p>
        </div>
        <div class="content">
          <p>Dear ${order.customerName},</p>
          <p>Thank you for your order! We've received your order #${order.orderId} and will begin processing it soon.</p>
          
          <h3>Order Details</h3>
          <table class="order-table">
            <thead>
              <tr>
                <th>Item</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="2" style="padding: 10px; text-align: right; color: #666;">Shipping:</td>
                <td style="padding: 10px; text-align: right;">${parseFloat(order.shipping) === 0 ? 'FREE' : '$' + order.shipping}</td>
              </tr>
              <tr>
                <td colspan="2" style="padding: 10px; text-align: right; font-weight: bold;">Total (incl. MA 6.25% tax):</td>
                <td style="padding: 10px; text-align: right; font-weight: bold;">$${order.total}</td>
              </tr>
            </tfoot>
          </table>
          
          ${order.repairDescription ? `
            <h3>Repair Instructions</h3>
            <p style="background: #fff; padding: 15px; border-left: 4px solid #8B4513;">${order.repairDescription}</p>
          ` : ''}
          
          <h3>Shipping Address</h3>
          <p>
            ${order.customerName}<br>
            ${order.shippingAddress}<br>
            ${order.shippingCity}${order.shippingState ? `, ${order.shippingState}` : ''} ${order.shippingZip}
          </p>
          
          <h3>Payment Instructions</h3>
          <p style="background: #fff3cd; padding: 15px; border-radius: 5px;">
            Please send payment via <strong>Venmo to @Victor-Hadawar</strong>.<br>
            Include your order number <strong>#${order.orderId}</strong> in the payment note.
          </p>
          
          <p>If you have any questions, please reply to this email or contact us at ${FROM_EMAIL}.</p>
        </div>
        <div class="footer">
          <p>All services are subject to our <a href="${getBaseUrl()}/terms" style="color: #8B4513;">Terms of Service</a>.</p>
          <p>&copy; ${new Date().getFullYear()} ${BUSINESS_NAME}. All rights reserved.</p>
          <p>Cape Cod's Premier Shoe & Leather Repair</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const result = await sendEmail(
    order.customerEmail,
    `Order Confirmation #${order.orderId} - ${BUSINESS_NAME}`,
    htmlBody
  );
  
  if (!result.success) {
    console.error(`[Email] Customer confirmation failed for order #${order.orderId}:`, result.error);
  } else {
    console.log(`[Email] Customer confirmation sent for order #${order.orderId} to ${order.customerEmail}`);
  }
}

export async function sendAdminOrderNotification(order: OrderDetails): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL || 'cobblersbenchcapecod@gmail.com';
  
  const itemsHtml = order.items.map(item => `
    <tr>
      <td style="padding: 8px; border: 1px solid #ddd;">${item.productName}${item.variantTitle ? ` - ${item.variantTitle}` : ''}</td>
      <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${item.quantity}</td>
      <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">$${item.price}</td>
    </tr>
  `).join('');

  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; }
        .alert { background: #d4edda; border: 1px solid #c3e6cb; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin: 15px 0; }
        th { background: #343a40; color: white; padding: 10px; text-align: left; }
      </style>
    </head>
    <body>
      <div style="text-align: center; padding: 20px; background: #1a1a1a;">
        <img src="${getBaseUrl()}${LOGO_PATH}" alt="${BUSINESS_NAME}" style="max-width: 150px; height: auto;" />
      </div>
      <div class="alert">
        <strong>New Order Received!</strong> Order #${order.orderId}
      </div>
      
      <h2>Customer Information</h2>
      <p>
        <strong>Name:</strong> ${order.customerName}<br>
        <strong>Email:</strong> ${order.customerEmail}<br>
        <strong>Phone:</strong> ${order.customerPhone || 'Not provided'}
      </p>
      
      <h2>Shipping Address</h2>
      <p>
        ${order.shippingAddress}<br>
        ${order.shippingCity}${order.shippingState ? `, ${order.shippingState}` : ''} ${order.shippingZip}
      </p>
      
      <h2>Order Items</h2>
      <table>
        <thead>
          <tr>
            <th>Product</th>
            <th style="text-align: center;">Qty</th>
            <th style="text-align: right;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>
      
      <p>
        <strong>Shipping:</strong> ${parseFloat(order.shipping) === 0 ? 'FREE' : '$' + order.shipping}<br>
        <strong>Order Total:</strong> $${order.total} <span style="font-size: 12px; color: #666;">(includes MA 6.25% tax)</span>
      </p>
      
      ${order.repairDescription ? `
        <h2>Repair/Work Order Description</h2>
        <p style="background: #f8f9fa; padding: 15px; border-left: 4px solid #007bff;">${order.repairDescription}</p>
      ` : ''}
      
      <p style="margin-top: 20px;">
        <a href="${getBaseUrl()}/admin" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View in Admin Dashboard</a>
      </p>
      <p style="margin-top: 20px; font-size: 12px; color: #666;">All services are subject to our <a href="${getBaseUrl()}/terms" style="color: #8B4513;">Terms of Service</a>.</p>
    </body>
    </html>
  `;
  
  const result = await sendEmail(
    adminEmail,
    `[NEW ORDER] #${order.orderId} - ${order.customerName} - $${order.total}`,
    htmlBody
  );
  
  if (!result.success) {
    console.error(`[Email] Admin notification failed for order #${order.orderId}:`, result.error);
  } else {
    console.log(`[Email] Admin notification sent for order #${order.orderId} to ${adminEmail}`);
  }
}

export async function sendOrderStatusUpdate(
  customerEmail: string,
  customerName: string,
  orderId: number,
  status: string,
  trackingNumber?: string
): Promise<void> {
  let statusMessage = '';
  switch (status) {
    case 'paid':
      statusMessage = 'We have received your payment. Thank you!';
      break;
    case 'shipped':
      statusMessage = `Your order has been shipped!${trackingNumber ? ` Tracking number: ${trackingNumber}` : ''}`;
      break;
    case 'delivered':
      statusMessage = 'Your order has been delivered. Enjoy!';
      break;
    case 'fulfilled':
      statusMessage = 'Your order has been fulfilled. Thank you for your business!';
      break;
    default:
      statusMessage = `Your order status has been updated to: ${status}`;
  }
  
  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #8B4513; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .status-box { background: #d4edda; border: 1px solid #c3e6cb; padding: 20px; border-radius: 5px; text-align: center; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="${getBaseUrl()}${LOGO_PATH}" alt="${BUSINESS_NAME}" style="max-width: 180px; height: auto; margin-bottom: 10px;" />
          <p style="margin: 0; font-size: 14px;">Order Update</p>
        </div>
        <div class="content">
          <p>Dear ${customerName},</p>
          
          <div class="status-box">
            <h2>Order #${orderId}</h2>
            <p style="font-size: 18px;">${statusMessage}</p>
          </div>
          
          ${trackingNumber ? `
            <p><strong>Tracking Number:</strong> ${trackingNumber}</p>
          ` : ''}
          
          <p>If you have any questions, please reply to this email or contact us at ${FROM_EMAIL}.</p>
        </div>
        <div class="footer">
          <p>All services are subject to our <a href="${getBaseUrl()}/terms" style="color: #8B4513;">Terms of Service</a>.</p>
          <p>&copy; ${new Date().getFullYear()} ${BUSINESS_NAME}. All rights reserved.</p>
          <p>Cape Cod's Premier Shoe & Leather Repair</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const result = await sendEmail(
    customerEmail,
    `Order #${orderId} Update - ${BUSINESS_NAME}`,
    htmlBody
  );
  
  if (!result.success) {
    console.error(`[Email] Status update failed for order #${orderId}:`, result.error);
  } else {
    console.log(`[Email] Status update sent for order #${orderId} to ${customerEmail}`);
  }
}

export async function sendOrderCancellationEmail(
  customerEmail: string,
  customerName: string,
  orderId: number,
  reason?: string
): Promise<void> {
  const htmlBody = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #8B4513; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9f9f9; }
        .cancel-box { background: #f8d7da; border: 1px solid #f5c6cb; padding: 20px; border-radius: 5px; text-align: center; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <img src="${getBaseUrl()}${LOGO_PATH}" alt="${BUSINESS_NAME}" style="max-width: 180px; height: auto; margin-bottom: 10px;" />
          <p style="margin: 0; font-size: 14px;">Order Cancellation</p>
        </div>
        <div class="content">
          <p>Dear ${customerName},</p>
          
          <div class="cancel-box">
            <h2>Order #${orderId} Cancelled</h2>
            <p style="font-size: 16px;">Your order has been cancelled.</p>
            ${reason ? `<p><em>${reason}</em></p>` : ''}
          </div>
          
          <p>If you made a payment via Venmo, a refund will be processed to your original payment method.</p>
          
          <p>If you have any questions about this cancellation, please reply to this email or contact us at ${FROM_EMAIL}.</p>
          
          <p>We apologize for any inconvenience and hope to serve you again soon.</p>
        </div>
        <div class="footer">
          <p>All services are subject to our <a href="${getBaseUrl()}/terms" style="color: #8B4513;">Terms of Service</a>.</p>
          <p>&copy; ${new Date().getFullYear()} ${BUSINESS_NAME}. All rights reserved.</p>
          <p>Cape Cod's Premier Shoe & Leather Repair</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  const result = await sendEmail(
    customerEmail,
    `Order #${orderId} Cancelled - ${BUSINESS_NAME}`,
    htmlBody
  );
  
  if (!result.success) {
    console.error(`[Email] Cancellation email failed for order #${orderId}:`, result.error);
  } else {
    console.log(`[Email] Cancellation email sent for order #${orderId} to ${customerEmail}`);
  }
}
