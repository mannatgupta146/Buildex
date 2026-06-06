import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        type: 'OAuth2',
        user: process.env.EMAIL_USER,
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        pass: process.env.GOOGLE_PASS
    }
})

transporter.verify((error, success) => {
    if (error) {
        console.log("Error connecting to email server: ", error);
    } else {    
        console.log('Server is ready to take messages');
    }
})

export const sendEmail = async (to, subject, text, ) => {
    try {
        const info = await transporter.sendMail({
            from: `Your Name <${process.env.EMAIL_USER}>`,
            to,
            subject,
            text,
            html
        });
        console.log("Email sent: ", info.messageId);
        console.log("Preview URL: ", nodemailer.getTestMessageUrl(info));
    } catch (error) {
        console.error("Error sending email: ", error);
    }
}