import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../../frontend/.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const targetAdminEmail = process.argv[2] || process.env.ADMIN_EMAIL || 'krishnaprasath720@gmail.com';
const host = process.env.SMTP_HOST;
const port = parseInt(process.env.SMTP_PORT || '587', 10);
const user = process.env.SMTP_USER || process.env.GMAIL_USER;
const pass = process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD;
const from = process.env.SMTP_FROM || `"AgriTrack Verification" <${user || 'verify@agritrack.app'}>`;

console.log('====================================================');
console.log('🌱 AgriTrack Admin Email Verification Tester');
console.log(`📧 Target Admin Recipient: ${targetAdminEmail}`);
console.log(`📤 Configured Sender User: ${user ? user : '[NOT SET in .env.local]'}`);
console.log('====================================================');

if (!user || !pass) {
  console.log('\n⚠️  SMTP credentials are not yet configured in .env.local.');
  console.log('Please provide your sender email and password/App Password in .env.local:\n');
  console.log('SMTP_USER=your-email@gmail.com');
  console.log('SMTP_PASS=your-16-character-app-password\n');
  process.exit(1);
}

const transporter = host
  ? nodemailer.createTransport({
      host,
      port,
      secure: port === 465 || process.env.SMTP_SECURE === 'true',
      auth: { user, pass },
    })
  : nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
    });

const sampleOtp = Math.floor(100000 + Math.random() * 900000).toString();

const mailOptions = {
  from,
  to: targetAdminEmail,
  subject: `🌱 The AgroTrack Verification - Sample Test Code: ${sampleOtp}`,
  text: `The AgroTrack Verification\n\nHello Admin (${targetAdminEmail})!\nThis is a sample test verification email from AgriTrack.\nYour 6-digit test code is: ${sampleOtp}\n\nEmail delivery is working successfully!`,
  html: `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 24px; border: 1.5px solid #d8e5dd; border-radius: 16px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 24px;">
        <div style="width: 56px; height: 56px; border-radius: 16px; background: linear-gradient(135deg, #1d5a42, #2c7655); display: inline-flex; align-items: center; justify-content: center; color: #ffffff; font-size: 28px; line-height: 56px; margin-bottom: 10px;">
          🌱
        </div>
        <h1 style="color: #08281d; font-size: 22px; font-weight: 800; margin: 0 0 6px 0;">The AgroTrack Verification</h1>
        <p style="color: #4b5563; font-size: 14px; margin: 0;">Admin Test & Verification Delivery</p>
      </div>

      <div style="background: linear-gradient(180deg, #f0fdf4 0%, #ecfdf5 100%); border: 1.5px solid #a7f3d0; border-radius: 14px; padding: 22px; text-align: center; margin-bottom: 24px;">
        <p style="color: #065f46; font-size: 14px; font-weight: 600; margin: 0 0 14px 0;">Sample 6-digit Verification OTP:</p>
        <div style="font-size: 32px; font-weight: 800; letter-spacing: 0.25em; color: #047857; background-color: #ffffff; padding: 12px 24px; border-radius: 10px; border: 2px dashed #34d399; display: inline-block; font-family: monospace;">
          ${sampleOtp}
        </div>
        <p style="color: #047857; font-size: 12px; margin: 12px 0 0 0; font-weight: 500;">Status: <strong>System Ready for New Users</strong></p>
      </div>

      <p style="color: #4b5563; font-size: 13px; line-height: 1.5; margin: 0 0 14px 0;">
        Hello Admin, this is a test email confirming that AgriTrack's email verification engine is active and ready to deliver 6-digit OTP codes to all new farmers signing up.
      </p>

      <div style="border-top: 1px solid #e5e7eb; padding-top: 14px; color: #9ca3af; font-size: 11px; text-align: center;">
        Sent to: ${targetAdminEmail}<br/>
        &copy; ${new Date().getFullYear()} AgriTrack. All rights reserved.
      </div>
    </div>
  `,
};

console.log('⏳ Connecting to SMTP and sending sample test email...');
transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    console.error('❌ Failed to deliver email:', error.message);
    process.exit(1);
  } else {
    console.log('✅ Sample test email successfully sent to admin!');
    console.log(`📬 Message ID: ${info.messageId}`);
    console.log(`🎯 Delivered to: ${targetAdminEmail}`);
    process.exit(0);
  }
});

