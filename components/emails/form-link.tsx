import React from 'react';

interface FormLinkEmailProps {
  formUrl: string;
  ownerName: string;
  templateName: string;
  personalMessage?: string;
  expiresAt: Date;
}

export function FormLinkEmail({
  formUrl,
  ownerName,
  templateName,
  personalMessage,
  expiresAt,
}: FormLinkEmailProps) {
  const expiryFormatted = expiresAt.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', lineHeight: 1.6, color: '#333', maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <div style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '8px' }}>
        <h1 style={{ color: '#2c3e50', marginBottom: '20px' }}>Please Complete Your Form</h1>

        <p>Hello,</p>

        <p>You have been invited by <strong>{ownerName}</strong> to complete the following form:</p>

        <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '6px', borderLeft: '4px solid #3498db', margin: '20px 0' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>{templateName}</h3>
        </div>

        {personalMessage && (
          <p><em>{personalMessage}</em></p>
        )}

        <div style={{ textAlign: 'center', margin: '30px 0' }}>
          <a href={formUrl}
             style={{
               backgroundColor: '#3498db',
               color: 'white',
               padding: '12px 24px',
               textDecoration: 'none',
               borderRadius: '6px',
               display: 'inline-block',
               fontWeight: 'bold'
             }}>
            Complete Form
          </a>
        </div>

        <p style={{ color: '#666', fontSize: '14px' }}>
          <strong>Important:</strong> This form link expires on <strong>{expiryFormatted}</strong>.
          Please complete it before the expiry date.
        </p>

        <p style={{ color: '#666', fontSize: '14px' }}>
          If you&apos;re unable to click the button above, you can copy and paste this link into your browser:<br />
          <a href={formUrl} style={{ color: '#3498db', wordBreak: 'break-all' }}>{formUrl}</a>
        </p>

        <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '30px 0' }} />

        <p style={{ color: '#666', fontSize: '12px' }}>
          This email was sent by {ownerName}. If you have any questions, please contact them directly.
        </p>
      </div>
    </div>
  );
}