import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ErrorBoundary } from '../ErrorBoundary';
import { Text, View } from 'react-native';

// Mock the Logger
jest.mock('../../../core/utils/Logger', () => {
  return {
    LogLevel: {
      DEBUG: 0,
      INFO: 1,
      WARNING: 2,
      ERROR: 3,
    },
    Logger: {
      getInstance: jest.fn().mockImplementation(() => ({
        error: jest.fn(),
      })),
    },
  };
});

// Component that throws an error
const ProblemComponent = () => {
  throw new Error('Test error');
};

// Simple component for testing
const GoodComponent = () => <Text>Good Component</Text>;

describe('ErrorBoundary', () => {
  // Silence React error boundary warning in tests
  const originalConsoleError = console.error;

  beforeAll(() => {
    console.error = jest.fn();
  });

  afterAll(() => {
    console.error = originalConsoleError;
  });

  it('should render children when there is no error', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <GoodComponent />
      </ErrorBoundary>
    );

    expect(getByText('Good Component')).toBeTruthy();
  });

  it('should render fallback UI when there is an error', () => {
    const { getByText } = render(
      <ErrorBoundary>
        <ProblemComponent />
      </ErrorBoundary>
    );

    // Check that the error UI is rendered
    expect(getByText('Something went wrong')).toBeTruthy();
    expect(getByText('Application error: Test error')).toBeTruthy();
    expect(getByText('Try Again')).toBeTruthy();
  });

  it('should render custom fallback when provided', () => {
    const customFallback = <View><Text>Custom Error UI</Text></View>;

    const { getByText, queryByText } = render(
      <ErrorBoundary fallback={customFallback}>
        <ProblemComponent />
      </ErrorBoundary>
    );

    // Should render custom fallback instead of default one
    expect(getByText('Custom Error UI')).toBeTruthy();
    expect(queryByText('Something went wrong')).toBeNull();
  });

  it('should recover when "Try Again" is clicked', () => {
    let shouldThrow = true;

    const TestComponent = () => {
      if (shouldThrow) {
        throw new Error('Recoverable error');
      }
      return <Text>Recovered Successfully</Text>;
    };

    const { getByText, queryByText } = render(
      <ErrorBoundary>
        <TestComponent />
      </ErrorBoundary>
    );

    // Initially shows error
    expect(getByText('Something went wrong')).toBeTruthy();

    // Simulate fix
    shouldThrow = false;

    // Click try again
    fireEvent.press(getByText('Try Again'));

    // Should now show recovered component
    expect(queryByText('Something went wrong')).toBeNull();
    expect(getByText('Recovered Successfully')).toBeTruthy();
  });
});
