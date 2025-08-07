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

const sendemailrestpass = async ({ recipients, message, name, resetLink }) => {
    const htmlContent = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <h1 style="color: #007bff;">Password Reset Request</h1>
            <p>Hi ${name},</p>
            <p>You requested to reset your password. Click the button below to reset it:</p>
            <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
            <p>If you didn't request this, you can ignore this email.</p>
            <p>Thank you,<br>The Meeristore Team</p>
        </div>
    `;

    // try {
    //     console.log('Sending email to:', recipients);
    //     console.log('Name:', name);
    //     console.log('Reset Link:', resetLink);

    //     const info = await transport.sendMail({
    //         from: process.env.MAIL_SENDER,
    //         to: recipients,
    //         subject: 'Meeristore Reset Password!',
    //         text: message,
    //         html: htmlContent,
    //     });
    //     console.log("Email sent:", info.response);
    //     return info;
    // } catch (error) {
    //     console.error("Error sending email:", error);
    //     throw new Error("Email sending failed");
    // }
        return await transport.sendMail({
        from: process.env.MAIL_SENDER,
        to: recipients,
        subject: 'Meeristore Reset Password!',
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


module.exports = sendemailrestpass;
