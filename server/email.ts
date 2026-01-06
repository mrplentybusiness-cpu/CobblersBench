import nodemailer from 'nodemailer';

const FROM_EMAIL = 'cobblersbenchcapecod@gmail.com';
const BUSINESS_NAME = "Cobbler's Bench";
const LOGO_PATH = '/images/email-logo.png';

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

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: FROM_EMAIL,
    pass: process.env.GMAIL_APP_PASSWORD
  }
});

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
          <p>&copy; ${new Date().getFullYear()} ${BUSINESS_NAME}. All rights reserved.</p>
          <p>Cape Cod's Premier Shoe & Leather Repair</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  await transporter.sendMail({
    from: `${BUSINESS_NAME} <${FROM_EMAIL}>`,
    to: order.customerEmail,
    subject: `Order Confirmation #${order.orderId} - ${BUSINESS_NAME}`,
    html: htmlBody
  });
}

export async function sendAdminOrderNotification(order: OrderDetails): Promise<void> {
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
  
  await transporter.sendMail({
    from: `${BUSINESS_NAME} <${FROM_EMAIL}>`,
    to: FROM_EMAIL,
    subject: `[NEW ORDER] #${order.orderId} - ${order.customerName} - $${order.total}`,
    html: htmlBody
  });
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
          <p>&copy; ${new Date().getFullYear()} ${BUSINESS_NAME}. All rights reserved.</p>
          <p>Cape Cod's Premier Shoe & Leather Repair</p>
        </div>
      </div>
    </body>
    </html>
  `;
  
  await transporter.sendMail({
    from: `${BUSINESS_NAME} <${FROM_EMAIL}>`,
    to: customerEmail,
    subject: `Order #${orderId} Update - ${BUSINESS_NAME}`,
    html: htmlBody
  });
}
