import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import React from 'react';
import { render, screen } from '@testing-library/react';

// Mock Next.js navigation
const mockRedirect = jest.fn();

jest.mock('next/navigation', () => ({
  redirect: mockRedirect,
}));

// Mock the auth module
jest.mock('../../../../../lib/auth/get-session', () => ({
  getSession: jest.fn(),
}));

// Mock FormCreator component
jest.mock('../../../../../components/dashboard/form-creator', () => ({
  FormCreator: ({ initialTemplates }: { initialTemplates: any[] }) => (
    <div data-testid="form-creator">
      <div>Form Creator Component</div>
      <div data-testid="templates-count">{initialTemplates.length} templates</div>
    </div>
  ),
}));

// Import after mocking
import NewFormPage, { generateMetadata } from '../page';
import { getSession } from '../../../../../lib/auth/get-session';

const mockGetSession = getSession as jest.MockedFunction<typeof getSession>;

const mockSession = {
  token: 'valid-token',
  owner: {
    id: 'owner-1',
    name: 'John Doe',
    email: 'john@example.com',
    rcicNumber: 'R12345',
  },
};

describe('NewFormPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue(mockSession);
  });

  it('should render new form page with header and breadcrumbs', async () => {
    const NewFormPageComponent = await NewFormPage();
    render(NewFormPageComponent);

    expect(screen.getByText('Create New Form')).toBeInTheDocument();
    expect(screen.getByText('Send a personalized intake form to your client. They\'ll receive an email with a secure link to complete the form.')).toBeInTheDocument();

    // Check breadcrumbs
    expect(screen.getByText('Forms')).toBeInTheDocument();
    expect(screen.getByText('New Form')).toBeInTheDocument();
  });

  it('should render FormCreator component with templates', async () => {
    const NewFormPageComponent = await NewFormPage();
    render(NewFormPageComponent);

    expect(screen.getByTestId('form-creator')).toBeInTheDocument();
    expect(screen.getByText('Form Creator Component')).toBeInTheDocument();
    expect(screen.getByTestId('templates-count')).toHaveTextContent('4 templates');
  });

  it('should display how it works section', async () => {
    const NewFormPageComponent = await NewFormPage();
    render(NewFormPageComponent);

    expect(screen.getByText('How it works')).toBeInTheDocument();
    expect(screen.getByText('Select a template that matches your client\'s immigration needs')).toBeInTheDocument();
    expect(screen.getByText('Enter your client\'s name and email address')).toBeInTheDocument();
    expect(screen.getByText('Set how long the client has to complete the form (1-90 days)')).toBeInTheDocument();
    expect(screen.getByText('Add a personal message to include in the email (optional)')).toBeInTheDocument();
    expect(screen.getByText('Click "Create Form & Send to Client" to generate and send the form')).toBeInTheDocument();
  });

  it('should display available templates section', async () => {
    const NewFormPageComponent = await NewFormPage();
    render(NewFormPageComponent);

    expect(screen.getByText('Available Templates')).toBeInTheDocument();

    // Check for template cards
    expect(screen.getByText('Basic Client Intake')).toBeInTheDocument();
    expect(screen.getByText('Standard immigration client information collection form')).toBeInTheDocument();
    expect(screen.getByText('Immigration')).toBeInTheDocument();

    expect(screen.getByText('Express Entry Assessment')).toBeInTheDocument();
    expect(screen.getByText('Comprehensive form for Express Entry program eligibility assessment')).toBeInTheDocument();
    expect(screen.getByText('Express Entry')).toBeInTheDocument();

    expect(screen.getByText('Family Sponsorship')).toBeInTheDocument();
    expect(screen.getByText('Form for sponsoring family members for Canadian immigration')).toBeInTheDocument();
    expect(screen.getByText('Family Class')).toBeInTheDocument();

    expect(screen.getByText('Study Permit Application')).toBeInTheDocument();
    expect(screen.getByText('Initial assessment for study permit applications')).toBeInTheDocument();
    expect(screen.getByText('Study Permits')).toBeInTheDocument();
  });

  it('should display field counts for each template', async () => {
    const NewFormPageComponent = await NewFormPage();
    render(NewFormPageComponent);

    // Basic Client Intake should have 10 fields
    const basicIntakeCard = screen.getByText('Basic Client Intake').closest('.bg-white');
    expect(basicIntakeCard).toHaveTextContent('10 fields');

    // Express Entry Assessment should have 11 fields
    const expressEntryCard = screen.getByText('Express Entry Assessment').closest('.bg-white');
    expect(expressEntryCard).toHaveTextContent('11 fields');

    // Family Sponsorship should have 11 fields
    const familySponsorshipCard = screen.getByText('Family Sponsorship').closest('.bg-white');
    expect(familySponsorshipCard).toHaveTextContent('11 fields');

    // Study Permit Application should have 12 fields
    const studyPermitCard = screen.getByText('Study Permit Application').closest('.bg-white');
    expect(studyPermitCard).toHaveTextContent('12 fields');
  });

  it('should display template categories as badges', async () => {
    const NewFormPageComponent = await NewFormPage();
    render(NewFormPageComponent);

    // Check for category badges
    const categoryBadges = document.querySelectorAll('.bg-gray-100.text-gray-800');
    expect(categoryBadges).toHaveLength(4);

    const badgeTexts = Array.from(categoryBadges).map(badge => badge.textContent);
    expect(badgeTexts).toContain('Immigration');
    expect(badgeTexts).toContain('Express Entry');
    expect(badgeTexts).toContain('Family Class');
    expect(badgeTexts).toContain('Study Permits');
  });

  it('should have proper navigation links in breadcrumbs', async () => {
    const NewFormPageComponent = await NewFormPage();
    render(NewFormPageComponent);

    // The dashboard link contains sr-only text "Dashboard"
    const dashboardSpan = screen.getByText('Dashboard');
    const dashboardLink = dashboardSpan.closest('a');
    expect(dashboardLink).toHaveAttribute('href', '/dashboard');

    const formsLink = screen.getByText('Forms').closest('a');
    expect(formsLink).toHaveAttribute('href', '/dashboard/forms');
  });

  it('should redirect when user is not authenticated', async () => {
    mockGetSession.mockResolvedValue(null);

    try {
      await NewFormPage();
    } catch (error) {
      // redirect throws, so we catch it
    }

    expect(mockRedirect).toHaveBeenCalledWith('/login');
  });

  it('should redirect when session has no owner', async () => {
    mockGetSession.mockResolvedValue({
      token: 'valid-token',
      owner: null,
    });

    try {
      await NewFormPage();
    } catch (error) {
      // redirect throws, so we catch it
    }

    expect(mockRedirect).toHaveBeenCalledWith('/login');
  });

  it('should render proper template structure with all required fields', async () => {
    const NewFormPageComponent = await NewFormPage();
    render(NewFormPageComponent);

    // Check that templates have proper structure
    const templateCards = document.querySelectorAll('.bg-white.border.border-gray-200.rounded-lg.p-4');
    expect(templateCards).toHaveLength(4);

    templateCards.forEach(card => {
      // Each card should have an icon
      expect(card.querySelector('svg')).toBeInTheDocument();

      // Each card should have a title
      const title = card.querySelector('.text-sm.font-medium.text-gray-900');
      expect(title).toBeInTheDocument();

      // Each card should have a description
      const description = card.querySelector('.text-sm.text-gray-500');
      expect(description).toBeInTheDocument();

      // Each card should have a category badge and field count
      const categoryBadge = card.querySelector('.bg-gray-100.text-gray-800');
      expect(categoryBadge).toBeInTheDocument();

      const fieldCount = card.querySelector('.text-xs.text-gray-500');
      expect(fieldCount).toBeInTheDocument();
      expect(fieldCount?.textContent).toMatch(/\d+ fields/);
    });
  });

  it('should include additional help text', async () => {
    const NewFormPageComponent = await NewFormPage();
    render(NewFormPageComponent);

    expect(screen.getByText('Your client will receive a secure email with a link to complete the form. You can track the status and view submissions in the Forms section.')).toBeInTheDocument();
  });

  it('should generate correct metadata', async () => {
    const metadata = await generateMetadata();

    expect(metadata).toEqual({
      title: 'Create New Form - FormFlow Dashboard',
      description: 'Create and send personalized intake forms to your immigration clients.',
    });
  });

  it('should have all template data with correct schema structure', async () => {
    const NewFormPageComponent = await NewFormPage();

    // We can't directly test the getTemplates function since it's internal,
    // but we can verify the component renders with the expected template count
    render(NewFormPageComponent);

    expect(screen.getByTestId('templates-count')).toHaveTextContent('4 templates');
  });

  it('should display template icons consistently', async () => {
    const NewFormPageComponent = await NewFormPage();
    render(NewFormPageComponent);

    // Check that all template cards have the same icon (document icon)
    const templateIcons = document.querySelectorAll('.w-8.h-8.bg-indigo-100.rounded-md svg');
    expect(templateIcons).toHaveLength(4);

    // All should use the document icon path
    templateIcons.forEach(icon => {
      const path = icon.querySelector('path');
      expect(path).toHaveAttribute('d', 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z');
    });
  });

  it('should have proper page structure with sections', async () => {
    const NewFormPageComponent = await NewFormPage();
    render(NewFormPageComponent);

    // Main content sections should be present
    const formCreatorSection = document.querySelector('.bg-white.shadow.rounded-lg');
    expect(formCreatorSection).toBeInTheDocument();

    const helpSection = document.querySelector('.bg-blue-50.border.border-blue-200.rounded-lg');
    expect(helpSection).toBeInTheDocument();

    const templatesSection = screen.getByText('Available Templates').parentElement;
    expect(templatesSection).toBeInTheDocument();
  });
});