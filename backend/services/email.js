import crypto from 'crypto';

/**
 * Sends a verification email using Nylas Transactional Send API.
 * Endpoint: POST https://api.us.nylas.com/v3/domains/{domain_name}/messages/send
 * 
 * Accepts either:
 *   sendVerificationEmail({ email, name, verificationUrl })
 * or:
 *   sendVerificationEmail(email, name, verificationUrl)
 */
export const sendVerificationEmail = async (arg1, arg2, arg3) => {
  let recipientEmail;
  let recipientName;
  let verificationUrl;

  if (typeof arg1 === 'object' && arg1 !== null) {
    recipientEmail = arg1.email;
    recipientName = arg1.name || 'User';
    verificationUrl = arg1.verificationUrl;
  } else {
    recipientEmail = arg1;
    recipientName = arg2 || 'User';
    verificationUrl = arg3;
  }

  if (!recipientEmail) {
    console.error('❌ [NYLAS EMAIL ERROR]: Recipient email is required');
    return { success: false, method: 'nylas', error: 'Recipient email is required' };
  }

  const apiKey = process.env.NYLAS_API_KEY;
  const domainName = process.env.NYLAS_EMAIL_DOMAIN || 'sudomus.nylas.email';
  const fromEmail = process.env.NYLAS_FROM_EMAIL || 'no-reply@sudomus.nylas.email';
  const fromName = process.env.NYLAS_FROM_NAME || 'SuDomus';

  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; color: #1e1e24; border: 1px solid #e2e8f0; border-radius: 16px; padding: 32px; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #6366f1; margin: 0; font-size: 28px; font-weight: 800;">SuDomus</h1>
        <p style="color: #64748b; font-size: 14px; margin-top: 4px;">Verified Real Estate Platform</p>
      </div>
      <h2 style="color: #1e293b; margin-top: 0; font-size: 20px;">Verify your email</h2>
      <p style="font-size: 15px; line-height: 1.6; color: #334155;">
        Hello ${recipientName || 'there'},
      </p>
      <p style="font-size: 15px; line-height: 1.6; color: #334155;">
        Thank you for creating an account on SuDomus. Please click the button below to verify your email address and activate your account.
      </p>
      <div style="margin: 32px 0; text-align: center;">
        <a href="${verificationUrl}" style="background: linear-gradient(135deg, #6366f1, #8b5cf6); color: #ffffff; padding: 14px 32px; text-decoration: none; border-radius: 50px; font-weight: 600; display: inline-block; font-size: 16px;">
          Verify Email
        </a>
      </div>
      <p style="font-size: 13px; color: #64748b;">Or copy and paste this link into your browser:</p>
      <p style="font-size: 13px; word-break: break-all;"><a href="${verificationUrl}" style="color: #6366f1;">${verificationUrl}</a></p>
      <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 28px 0;" />
      <p style="color: #94a3b8; font-size: 12px; margin-bottom: 0; line-height: 1.5;">
        This verification link will expire in 24 hours. If you did not create a SuDomus account, please ignore this email.
      </p>
    </div>
  `;

  if (process.env.EMAIL_VERIFICATION_MODE === 'development') {
    return { success: true, method: 'development', skipped: true };
  }

  if (!apiKey) {
    console.warn('⚠️ Email service API key is missing in backend environment.');
    return { success: false, method: 'nylas', error: 'Email service configuration missing' };
  }

  const nylasEndpoint = `https://api.us.nylas.com/v3/domains/${domainName}/messages/send`;
  const idempotencyKey = crypto.randomUUID();

  try {
    const response = await fetch(nylasEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify({
        to: [
          {
            email: recipientEmail,
          },
        ],
        from: {
          name: fromName,
          email: fromEmail,
        },
        subject: 'Verify your SuDomus email',
        body: html,
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      console.error(`❌ [NYLAS API ERROR]: Status ${response.status}`, data);
      return {
        success: false,
        method: 'nylas',
        error: 'Failed to send verification email. Please try again later.',
      };
    }

    console.log(`✅ [NYLAS] Verification email sent to ${recipientEmail}`);
    return {
      success: true,
      method: 'nylas',
      data,
      verificationUrl,
    };
  } catch (err) {
    console.error('❌ [NYLAS ERROR]:', err.message || err);
    return {
      success: false,
      method: 'nylas',
      error: 'Failed to send verification email. Network error.',
    };
  }
};

