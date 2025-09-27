import { describe, expect, it } from '@jest/globals';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { StatsCard } from '../stats-card';

const mockIcon = (
  <svg data-testid="mock-icon" viewBox="0 0 24 24">
    <path d="M12 12" />
  </svg>
);

describe('StatsCard', () => {
  it('should render basic stats card', () => {
    render(
      <StatsCard
        title="Test Metric"
        value={42}
        icon={mockIcon}
      />
    );

    expect(screen.getByText('Test Metric')).toBeInTheDocument();
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByTestId('mock-icon')).toBeInTheDocument();
  });

  it('should render string value', () => {
    render(
      <StatsCard
        title="Status"
        value="Active"
        icon={mockIcon}
      />
    );

    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('should format large numbers with locale formatting', () => {
    render(
      <StatsCard
        title="Large Number"
        value={1234567}
        icon={mockIcon}
      />
    );

    expect(screen.getByText('1,234,567')).toBeInTheDocument();
  });

  it('should render description when provided', () => {
    render(
      <StatsCard
        title="Test Metric"
        value={42}
        icon={mockIcon}
        description="This is a test description"
      />
    );

    expect(screen.getByText('This is a test description')).toBeInTheDocument();
  });

  it('should render upward trend change', () => {
    render(
      <StatsCard
        title="Test Metric"
        value={42}
        icon={mockIcon}
        change={{
          value: 15,
          trend: 'up',
        }}
      />
    );

    expect(screen.getByText('15%')).toBeInTheDocument();
    const changeElement = screen.getByText('15%').parentElement;
    expect(changeElement).toHaveClass('text-green-600');
  });

  it('should render downward trend change', () => {
    render(
      <StatsCard
        title="Test Metric"
        value={42}
        icon={mockIcon}
        change={{
          value: -10,
          trend: 'down',
        }}
      />
    );

    expect(screen.getByText('10%')).toBeInTheDocument();
    const changeElement = screen.getByText('10%').parentElement;
    expect(changeElement).toHaveClass('text-red-600');
  });

  it('should render neutral trend change', () => {
    render(
      <StatsCard
        title="Test Metric"
        value={42}
        icon={mockIcon}
        change={{
          value: 0,
          trend: 'neutral',
        }}
      />
    );

    expect(screen.getByText('0%')).toBeInTheDocument();
    const changeElement = screen.getByText('0%').parentElement;
    expect(changeElement).toHaveClass('text-gray-600');
  });

  it('should render both description and trend change', () => {
    render(
      <StatsCard
        title="Test Metric"
        value={42}
        icon={mockIcon}
        description="Test description"
        change={{
          value: 5,
          trend: 'up',
        }}
      />
    );

    expect(screen.getByText('Test description')).toBeInTheDocument();
    expect(screen.getByText('5%')).toBeInTheDocument();
  });

  it('should have proper accessibility attributes', () => {
    render(
      <StatsCard
        title="Test Metric"
        value={42}
        icon={mockIcon}
        change={{
          value: 15,
          trend: 'up',
        }}
      />
    );

    expect(screen.getByText('Increased by')).toHaveClass('sr-only');
  });

  it('should render proper icon styling', () => {
    render(
      <StatsCard
        title="Test Metric"
        value={42}
        icon={mockIcon}
      />
    );

    const iconContainer = screen.getByTestId('mock-icon').parentElement;
    expect(iconContainer).toHaveClass('w-5', 'h-5', 'text-indigo-600');

    const iconWrapper = iconContainer?.parentElement;
    expect(iconWrapper).toHaveClass('w-8', 'h-8', 'bg-indigo-100', 'rounded-md');
  });
});