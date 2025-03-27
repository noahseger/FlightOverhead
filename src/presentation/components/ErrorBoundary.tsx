import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { Logger } from '../../core/utils/Logger';
import { ErrorHandler } from '../../core/utils/ErrorHandler';
import { AppError } from '../../core/utils/AppError';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: { message: string; recoveryAction?: string } | null;
}

/**
 * ErrorBoundary component catches JavaScript errors in its child component tree
 * and displays a fallback UI instead of crashing the app
 */
export class ErrorBoundary extends Component<Props, State> {
  private logger: Logger;
  private errorHandler: ErrorHandler;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };

    this.logger = Logger.getInstance();
    this.errorHandler = new ErrorHandler(this.logger);
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to the logger service
    this.logger.error('Error caught by ErrorBoundary', {
      errorMessage: error.message,
      componentStack: errorInfo.componentStack,
    });

    // Convert error to AppError if needed
    const appError = error instanceof AppError
      ? error
      : this.errorHandler.createAppError(error);

    // Get error message and recovery action
    const errorDetails = this.errorHandler.handleError(appError);

    this.setState({
      errorInfo: errorDetails,
    });
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    const { hasError, errorInfo } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      // You can render any custom fallback UI
      if (fallback) {
        return fallback;
      }

      return (
        <View style={styles.container}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>{errorInfo?.message}</Text>
          {errorInfo?.recoveryAction && (
            <Text style={styles.recovery}>{errorInfo.recoveryAction}</Text>
          )}
          <Button title="Try Again" onPress={this.handleReset} />
        </View>
      );
    }

    return children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#dc3545',
  },
  message: {
    fontSize: 16,
    marginBottom: 15,
    textAlign: 'center',
    color: '#343a40',
  },
  recovery: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
    color: '#6c757d',
  },
});
