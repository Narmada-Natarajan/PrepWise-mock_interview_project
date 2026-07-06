export const getOTPTemplate = (name: string, otp: string) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify your Account</title>
      <style>
        body { font-family: 'Inter', system-ui, sans-serif; background-color: #0d0d0d; color: #ffffff; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background-color: #1a1a1a; border: 1px solid #333; border-radius: 16px; overflow: hidden; }
        .header { background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); padding: 40px 20px; text-align: center; }
        .logo { font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; }
        .content { padding: 40px; text-align: center; }
        h1 { font-size: 28px; margin-bottom: 16px; color: #ffffff; }
        p { color: #a1a1aa; line-height: 1.6; font-size: 16px; }
        .otp-container { margin: 32px 0; padding: 24px; background-color: #27272a; border-radius: 12px; border: 1px dashed #3b82f6; }
        .otp-code { font-size: 42px; font-weight: 800; color: #3b82f6; letter-spacing: 12px; font-family: 'Courier New', Courier, monospace; }
        .footer { padding: 24px; text-align: center; border-top: 1px solid #333; background-color: #121212; }
        .footer p { font-size: 14px; margin: 0; color: #71717a; }
        .social-link { color: #3b82f6; text-decoration: none; font-weight: 600; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">PrepWise</div>
        </div>
        <div class="content">
          <h1>Welcome aboard, ${name}!</h1>
          <p>Thank you for joining PrepWise. To get started with your AI mock interviews, verify your identity using the code below.</p>
          <div class="otp-container">
            <div class="otp-code">${otp}</div>
          </div>
          <p>This code will expire in 10 minutes. If you did not request this, please ignore this email.</p>
        </div>
        <div class="footer">
          <p>© 2026 PrepWise AI. Elevate your career with AI mock interviews.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};

export const getResetPasswordTemplate = (name: string, otp: string) => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset your Password</title>
      <style>
        body { font-family: 'Inter', system-ui, sans-serif; background-color: #0d0d0d; color: #ffffff; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background-color: #1a1a1a; border: 1px solid #333; border-radius: 16px; overflow: hidden; }
        .header { background: linear-gradient(135deg, #7c3aed 0%, #a855f7 100%); padding: 40px 20px; text-align: center; }
        .logo { font-size: 24px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px; }
        .content { padding: 40px; text-align: center; }
        h1 { font-size: 28px; margin-bottom: 16px; color: #ffffff; }
        p { color: #a1a1aa; line-height: 1.6; font-size: 16px; }
        .otp-container { margin: 32px 0; padding: 24px; background-color: #2a2233; border-radius: 12px; border: 1px dashed #a855f7; }
        .otp-code { font-size: 42px; font-weight: 800; color: #a855f7; letter-spacing: 12px; font-family: 'Courier New', Courier, monospace; }
        .footer { padding: 24px; text-align: center; border-top: 1px solid #333; background-color: #121212; }
        .footer p { font-size: 14px; margin: 0; color: #71717a; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">PrepWise</div>
        </div>
        <div class="content">
          <h1>Reset Password Request</h1>
          <p>Hi ${name}, we received a request to reset your password. Use the verification code below to proceed.</p>
          <div class="otp-container">
            <div class="otp-code">${otp}</div>
          </div>
          <p>This code will expire in 15 minutes. If you did not request a password reset, you can safely ignore this email.</p>
        </div>
        <div class="footer">
          <p>© 2026 PrepWise AI. Elevate your career with AI mock interviews.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};
