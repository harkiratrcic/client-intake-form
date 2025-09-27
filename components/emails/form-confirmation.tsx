import React from 'react';

interface FormConfirmationEmailProps {
  ownerName: string;
  templateName: string;
  submittedAt: Date;
  ownerEmail: string;
}

export function FormConfirmationEmail({
  ownerName,
  templateName,
  submittedAt,
  ownerEmail,
}: FormConfirmationEmailProps) {
  const submittedFormatted = submittedAt.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', lineHeight: 1.6, color: '#333', maxWidth: '600px', margin: '0 auto', padding: '20px' }}>
      <div style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '8px' }}>
        <h1 style={{ color: '#27ae60', marginBottom: '20px' }}>✓ Form Submission Confirmed</h1>

        <p>Hello,</p>

        <p>Thank you for submitting your form. We have successfully received your information.</p>

        <div style={{ backgroundColor: 'white', padding: '15px', borderRadius: '6px', borderLeft: '4px solid #27ae60', margin: '20px 0' }}>
          <h3 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>Submission Details</h3>
          <p style={{ margin: '5px 0' }}><strong>Form:</strong> {templateName}</p>
          <p style={{ margin: '5px 0' }}><strong>Submitted:</strong> {submittedFormatted}</p>
          <p style={{ margin: '5px 0' }}><strong>Submitted to:</strong> {ownerName}</p>
        </div>

        <p>Your information has been securely transmitted and will be reviewed by our team. We will contact you if any additional information is needed.</p>

        <div style={{ backgroundColor: '#e8f4fd', padding: '15px', borderRadius: '6px', margin: '20px 0' }}>
          <p style={{ margin: 0, color: '#2c3e50' }}>
            <strong>Next Steps:</strong> We will review your submission and contact you within the next business day if we need any clarification or additional documents.
          </p>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '30px 0' }} />

        <p style={{ color: '#666', fontSize: '12px' }}>
          If you have any questions about your submission, please contact:<br />
          <strong>{ownerName}</strong><br />
          Email: <a href={`mailto:${ownerEmail}`} style={{ color: '#3498db' }}>{ownerEmail}</a>
        </p>
      </div>
    </div>
  );
}