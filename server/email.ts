import { Resend } from 'resend';
import nodemailer from 'nodemailer';

const BUSINESS_NAME = "Cobbler's Bench";
const LOGO_PATH = '/images/email-logo.png';
const DEFAULT_FROM_EMAIL = 'onboarding@resend.dev';

type EmailProvider = 'brevo' | 'resend' | null;
let cachedProvider: EmailProvider = null;
let cachedTransporter: nodemailer.Transporter | null = null;
let cachedResendClient: Resend | null = null;
let cachedFromEmail: string | null = null;

async function initEmailProvider(): Promise<EmailProvider> {
  if (cachedProvider !== null) {
    return cachedProvider;
  }

  // Primary: Brevo SMTP with SMTP_USER/SMTP_PASS (Railway recommended)
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    console.log('[Email] Using Brevo SMTP');
    cachedFromEmail = process.env.EMAIL_FROM || process.env.SMTP_USER;
    cachedTransporter = nodemailer.createTransport({
      host: 'smtp-relay.brevo.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
    cachedProvider = 'brevo';
    return 'brevo';
  }

  // Fallback: Legacy BREVO_SMTP_KEY format
  if (process.env.BREVO_SMTP_LOGIN && process.env.BREVO_SMTP_KEY) {
    console.log('[Email] Using Brevo SMTP (legacy config)');
    cachedFromEmail = process.env.EMAIL_FROM || process.env.BREVO_SMTP_LOGIN;
    cachedTransporter = nodemailer.createTransport({
      host: 'smtp-relay.brevo.com',
      port: 587,
      secure: false,
      auth: {
        user: process.env.BREVO_SMTP_LOGIN,
        pass: process.env.BREVO_SMTP_KEY
      }
    });
    cachedProvider = 'brevo';
    return 'brevo';
  }

  if (process.env.RESEND_API_KEY) {
    console.log('[Email] Using Resend API');
    cachedFromEmail = process.env.RESEND_FROM_EMAIL || DEFAULT_FROM_EMAIL;
    cachedResendClient = new Resend(process.env.RESEND_API_KEY);
    cachedProvider = 'resend';
    return 'resend';
  }

  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (hostname && xReplitToken) {
    try {
      const connectionSettings = await fetch(
        'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
        {
          headers: {
            'Accept': 'application/json',
            'X_REPLIT_TOKEN': xReplitToken
          }
        }
      ).then(res => res.json()).then(data => data.items?.[0]);

      if (connectionSettings?.settings?.api_key) {
        console.log('[Email] Using Resend via Replit connector');
        cachedFromEmail = connectionSettings.settings.from_email || DEFAULT_FROM_EMAIL;
        cachedResendClient = new Resend(connectionSettings.settings.api_key);
        cachedProvider = 'resend';
        return 'resend';
      }
    } catch (error) {
      console.warn('[Email] Failed to fetch Replit connector:', error);
    }
  }

  console.warn('[Email] No email provider configured. Set BREVO_SMTP_KEY or RESEND_API_KEY');
  cachedProvider = null;
  return null;
}

async function sendEmail(to: string, subject: string, html: string): Promise<{ success: boolean; error?: string }> {
  const provider = await initEmailProvider();
  
  if (!provider || !cachedFromEmail) {
    return { success: false, error: 'No email provider configured' };
  }

  try {
    if (provider === 'brevo' && cachedTransporter) {
      await cachedTransporter.sendMail({
        from: `"${BUSINESS_NAME}" <${cachedFromEmail}>`,
        to,
        subject,
        html
      });
      return { success: true };
    }

    if (provider === 'resend' && cachedResendClient) {
      const result = await cachedResendClient.emails.send({
        from: `${BUSINESS_NAME} <${cachedFromEmail}>`,
        to,
        subject,
        html
      });
      if (result.error) {
        return { success: false, error: result.error.message };
      }
      return { success: true };
    }

    return { success: false, error: 'Provider not initialized' };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

function getFromEmail(): string {
  return cachedFromEmail || 'cobblersbenchcapecod@gmail.com';
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
  const fromEmail = getFromEmail();
  
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
          
          <p>If you have any questions, please reply to this email or contact us at ${fromEmail}.</p>
        </div>
        <div class="footer">
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
  const fromEmail = getFromEmail();
  
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
          
          <p>If you have any questions, please reply to this email or contact us at ${fromEmail}.</p>
        </div>
        <div class="footer">
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
