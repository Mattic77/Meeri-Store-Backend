const nodemailer = require('nodemailer');

const transport = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    secure: false,
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASSWORD,
    },
});

const sendemailauth = async ({ recipients, message }) => {
    const htmlContent = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <div style="text-align: center; background-color: #f8f9fa; padding: 20px;">
                <h1 style="color: #007bff;">Welcome to Meeristore!</h1>
                <p style="font-size: 18px; color: #555;">Your trusted store for the best products.</p>
            </div>
            <div style="padding: 20px;">
                <p>${message}</p>
                <p>We hope you enjoy your shopping experience with us. Feel free to explore our wide range of products.</p>
            </div>
            <hr style="border: none; border-top: 1px solid #ccc;">
            <footer style="text-align: center; padding: 10px;">
                <p>Thank you for choosing Meeristore!</p>
                <p><strong>Meeristore Team</strong></p>
                <p>
                    <a href="https://meeristore.com" style="color: #007bff; text-decoration: none;">Visit Meeristore</a>
                </p>
            </footer>
        </div>
    `;

    // Send email
    return await transport.sendMail({
        from: process.env.MAIL_SENDER,
        to: recipients,
        subject: 'Welcome to Meeristore!',
        text: message,
        html: htmlContent,
    }), (error, info) => {
        if (error) {
            console.error("Error:", error);
        } else {
            console.log("Email sent:", info.response);
        }
    };
};

module.exports = sendemailauth;
