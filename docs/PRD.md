# Immigration Form Sender — PRD (Solo RCIC, With Auto-Save)

**Version:** 1.2
**Owner:** Solo RCIC (single user)
**Last updated:** 2025-09-25

## 1. Summary

A lightweight, private web tool for a single RCIC to send clients secure forms and receive their answers.

- No staff or team accounts.
- No file uploads, storage, or PDF packaging.
- Focus is on create form → send link → client fills gradually (auto-saves) → you review/export answers.

## 2. Goals & Non-Goals

### Goals
- Let the RCIC create and version intake forms.
- Send secure, unique, expiring form links to clients.
- Allow clients to auto-save progress and finish later.
- Store final submissions and allow export to CSV/JSON.

### Non-Goals
- Team collaboration or multi-user roles.
- Document upload or file storage.
- Messaging, reminders, or payment handling.
- Government portal integrations.

## 3. Personas & Jobs-to-Be-Done

**Owner (You, RCIC)**
- Create forms.
- Send forms to client emails.
- Track form status.
- View/export submissions.

**Client (Applicant)**
- Open secure form link (no login needed).
- Fill out form gradually (auto-save enabled).
- Submit once complete and get confirmation.

## 4. Primary User Journeys

### Create Form Template
Define fields → save template (versioned).

### Send Form
Choose template + client email → system creates unique expiring link → sends email.

### Client Completes Form (Auto-Save)
Opens link → starts filling → answers auto-saved as draft.
Can close browser → reopen same link → resume.
Submits → link becomes read-only with confirmation page.

### Review Submission
Owner sees table of submissions (filter/search).
Opens details to review answers.
Exports data as CSV/JSON.

## 5. Feature Requirements

### A. Form Templates
- Simple fields: text, textarea, select, radio, checkbox, date.
- Validation: required, email format, length.
- Versioning: new versions don't break old sends.

### B. Form Sending
- Owner selects template + email.
- Creates a form_send record with tokenized URL + expiry.
- Sends email automatically.
- Status: sent, opened, in_progress, submitted, expired.

### C. Client Experience
- No login required, just secure token link.
- Draft answers auto-saved server-side:
  - Trigger: every field change OR periodic (e.g., every 5s).
  - Draft linked to form_send.
- Draft reloads on revisit.
- Submit final answers → status set to submitted.

### D. Submissions
- Table for submissions: name, email, template, status, submitted_at.
- Detail page: view answers.
- Export: CSV/JSON (bulk or single).
- Print-friendly HTML (optional).

### E. Settings
- Configure sender email.
- Default link expiry (e.g., 14 days).
- Toggle client confirmation email after submission.

## 6. Data Model (Conceptual)

- **templates**: id, name, version, schema_json, created_at.
- **form_sends**: id, template_id, client_name, client_email, token, status, expires_at, created_at.
- **drafts**: id, form_send_id, data_json, updated_at.
- **submissions**: id, form_send_id, data_json, submitted_at.
- **owner_profile**: id, sender_email, expiry_default, preferences.

## 7. Permissions & Access Control

- **Owner**: full access to templates, sends, submissions.
- **Client**: access only to their tokenized form link.
  - Can save drafts until expiry/submission.
  - Link becomes read-only after submission.

## 8. Non-Functional Requirements

### Security
- Links are long, random, unguessable.
- HTTPS enforced.
- Draft/submission data encrypted at rest.

### Reliability
- Draft autosave is atomic.
- Expired or already-submitted links show clear messages.

### Performance
- Forms load in <1s.
- Autosave round-trip <500ms.

### Accessibility
- WCAG 2.1 AA (labels, keyboard nav, focus states).

### Observability
- Log key events: sent, opened, autosaved, submitted.

### Backups
- Database backups; CSV export available.

## 9. Success Metrics

- ≥ 95% of forms are successfully submitted once opened.
- ≥ 90% of clients who start forms return to drafts and complete.
- 0 unauthorized access.
- < 1% failed autosave attempts.

## 10. Scope & Releases

### MVP
- Form templates.
- Send secure links by email.
- Client fills form with autosave.
- Submission storage + view + export.

### Later Releases
- Bulk export by date/template.
- Print-friendly view.
- Event log dashboard.
- Option to extend/resent expired links.

## 11. Risks, Assumptions, Constraints

- **[RISK]** Email deliverability (spam).
- **[RISK]** Client might think draft is submitted → need clear UI indicators.
- **[ASSUMPTION]** Only one owner account.
- **Constraint**: No files/documents ever.

## 12. Out of Scope

- File uploads.
- Staff roles.
- Messaging/reminders.
- PDF packaging.
- Payments/e-signatures.

## 13. Open Questions [NEEDS CLARIFICATION]

- Autosave frequency: per field change vs. every few seconds?
- Should clients receive a draft recovery email (resume link)?
- Should owner be able to see drafts in progress, or only final submissions?
- Should expired drafts be purged or retained?
- Do forms need simple branding (logo/colors)?

## 14. Acceptance Criteria

- Owner can create and send a form template.
- Client receives link → fills form → draft autosaves → can resume.
- Client submits → link locked → success screen visible.
- Owner sees submission in dashboard.
- Owner can search, filter, and export data.