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

// Function to send order confirmation email
const sendOrderEmail = async ({ idorder,recipient, name, orderDetails, totalPrice }) => {
    // Generate the email HTML content
    const orderEmailHtml = (name, items) => `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h1 style="color: #007bff;">Order Confirmation</h1>
        <p>Hi ${name},</p>
        <p>Thank you for your order! Here are your order details: ${idorder}</p>
        <table style="border-collapse: collapse; width: 100%; margin: 20px 0;">
            <thead>
                <tr>
                    <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Product</th>
                    <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Quantity</th>
                    <th style="border: 1px solid #ddd; padding: 8px; text-align: right;">Price</th>
                </tr>
            </thead>
            <tbody>
                ${items
                    .map(
                        (item) => `
                <tr>
                    <td style="border: 1px solid #ddd; padding: 8px;">${item.productName}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${item.quantity}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; text-align: right;">${item.price} DA</td>
                </tr>
                `
                    )
                    .join('')}
            </tbody>
        </table>
        <p><strong>Total Price: ${totalPrice} DA</strong></p>
        <p>We will notify you once your order is shipped.</p>
        <p>Thank you for shopping with us!<br>The Meeristore Team</p>
    </div>
    `;

    return await transport.sendMail({
        from: process.env.MAIL_SENDER,
        to: recipient,
        subject: 'Meeristore - Order Confirmation',
        html: orderEmailHtml(name, orderDetails), // Pass orderDetails directly
    }).catch((error) => {
        console.error("Error sending email:", error);
    });
};

module.exports = sendOrderEmail;
