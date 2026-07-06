import nodemailer from "nodemailer";

const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_PASS = process.env.GMAIL_PASS;

export async function sendEmail({
  to,
  subject,
  text,
  html,
}: {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}) {
  try {
    if (!GMAIL_USER || !GMAIL_PASS) {
      console.warn("Gmail credentials not provided. Falling back to console logging.");
      console.log(`[MAIL FALLBACK] To: ${to}\nSubject: ${subject}\nBody: ${text || html}`);
      return { success: true, fallback: true };
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: GMAIL_USER,
        pass: GMAIL_PASS, // App-specific password for Gmail
      },
    });

    const info = await transporter.sendMail({
      from: `"PrepWise" <${GMAIL_USER}>`,
      to,
      subject,
      text,
      html,
    });

    console.log("Email sent: %s", info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("Error sending email:", error);
    // Explicit Fallback
    console.log(`[CRITICAL MAIL FAILURE] Falling back to console logging.`);
    console.log(`To: ${to}\nSubject: ${subject}\nBody: ${text || html}`);
    return { success: false, error: "Failed to send email. Logged to console." };
  }
}
