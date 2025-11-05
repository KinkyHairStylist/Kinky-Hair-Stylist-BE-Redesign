import * as sgMail from '@sendgrid/mail';

sgMail.setApiKey(process.env.SENDGRID_API_KEY as string); // 👈 assert as string

export async function sendEmail(to: string, subject: string, html: string) {
  const msg = {
    to,
    from: {
      email: process.env.SENDGRID_FROM_EMAIL as string, // 👈 assert as string
      name: process.env.SENDGRID_FROM_NAME as string,   // 👈 assert as string
    },
    subject,
    text: html.replace(/<[^>]+>/g, ''), // plain text version
    html,
  };

  await sgMail.send(msg);
}



// import sgMail from '@sendgrid/mail';
// import { error } from 'console';

// sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// export const sendEmail = async (email, otp)=> {
//     const msg ={
//         to: email,
//         from: {
//             email: process.env.SENDGRID_FROM_EMAIL,
//             name: process.env.SENDGRID_FROM_NAME,
//         },
//         subject: 'Your KHS Email Verification Code',
//         text: `Your OTP is ${otp}`,
//         html: `<p>Your verification code is: <strong> ${otp}</strong>. It is valid for 10 minutes.</p>`,
//     };

//     try {
//         await sgMail.send(msg);
//         console.log(`Verification email sent to ${email}`);
//     } catch (error) {
//         console.error('Error sending email:', error);
//         throw new Error ("Email not sent");
//     }
// };