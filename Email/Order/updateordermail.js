const nodemailer = require('nodemailer');

// Configure the transporter
const transport = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    secure: false,
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASSWORD,
    },
});

const sendUpdateOrderEmail = async ({ orderid, recipient, name, orderDetails, totalPrice, status }) => {
    // Generate the email HTML content
    const orderEmailHtml = (name, orderid, items, totalPrice, status) => `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #007bff; text-align: center;">Order Status Update</h1>
      <p style="font-size: 16px;">Hi ${name},</p>
      <p style="font-size: 16px;">We wanted to let you know that the status of your order <strong>#${orderid}</strong> has been updated to <strong>${status}</strong>.</p>
  
      <h2 style="color: #333;">Order Details:</h2>
      <table style="border-collapse: collapse; width: 100%; margin: 20px 0; border: 1px solid #ddd;">
        <thead>
          <tr>
            <th style="padding: 8px; background-color: #f4f4f4; text-align: left;">Product</th>
            <th style="padding: 8px; background-color: #f4f4f4; text-align: right;">Quantity</th>
            <th style="padding: 8px; background-color: #f4f4f4; text-align: right;">Price</th>
          </tr>
        </thead>
        <tbody>
          ${items.map(item => `
            <tr>
              <td style="border-top: 1px solid #ddd; padding: 8px;">${item.productName}</td>
              <td style="border-top: 1px solid #ddd; padding: 8px; text-align: right;">${item.quantity}</td>
              <td style="border-top: 1px solid #ddd; padding: 8px; text-align: right;">$${item.price}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
  
      <p style="font-size: 16px;"><strong>Total Price: $${totalPrice}</strong></p>
  
      <p style="font-size: 16px;">We will notify you once your order is shipped. If you have any questions or need further assistance, feel free to contact us.</p>
  
      <p style="font-size: 16px;">Thank you for choosing Meeristore!</p>
      <p style="font-size: 16px;">The Meeristore Team</p>
  
      <footer style="text-align: center; font-size: 14px; color: #777;">
        <p>If you didn't make this request, please ignore this email.</p>
      </footer>
    </div>
  `;

    try {
        // Send email with the correct arguments
        await transport.sendMail({
            from: process.env.MAIL_SENDER,
            to: recipient,
            subject: 'Meeristore - Order Status Update',
            html: orderEmailHtml(name, orderid, orderDetails, totalPrice, status), // Pass all required arguments
        });
        console.log('Email sent successfully!');
    } catch (error) {
        console.error("Error sending email:", error);
    }
};

module.exports = sendUpdateOrderEmail;
