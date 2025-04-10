import React from 'react';
import { render } from '@testing-library/react-native';
import { PermissionStatusIndicator } from '../PermissionStatus';

describe('PermissionStatusIndicator', () => {
  it('should render correctly with granted status', () => {
    const { getByText } = render(
      <PermissionStatusIndicator type="Location" status="granted" />
    );
    
    expect(getByText('Location')).toBeTruthy();
    expect(getByText('Granted')).toBeTruthy();
    expect(getByText('✅')).toBeTruthy();
  });

  it('should render correctly with denied status', () => {
    const { getByText } = render(
      <PermissionStatusIndicator type="Camera" status="denied" />
    );
    
    expect(getByText('Camera')).toBeTruthy();
    expect(getByText('Denied')).toBeTruthy();
    expect(getByText('❌')).toBeTruthy();
  });

  it('should render correctly with unknown status', () => {
    const { getByText } = render(
      <PermissionStatusIndicator type="Notifications" status="unknown" />
    );
    
    expect(getByText('Notifications')).toBeTruthy();
    expect(getByText('Unknown')).toBeTruthy();
    expect(getByText('❓')).toBeTruthy();
  });

  it('should use the correct colors for different statuses', () => {
    const { getByText: getGrantedText } = render(
      <PermissionStatusIndicator type="Location" status="granted" />
    );
    
    const { getByText: getDeniedText } = render(
      <PermissionStatusIndicator type="Camera" status="denied" />
    );
    
    const { getByText: getUnknownText } = render(
      <PermissionStatusIndicator type="Notifications" status="unknown" />
    );
    
    // Check that the status text has the right color style
    const grantedStatusText = getGrantedText('Granted');
    const deniedStatusText = getDeniedText('Denied');
    const unknownStatusText = getUnknownText('Unknown');
    
    expect(grantedStatusText.props.style[1].color).toBe('#4CAF50');
    expect(deniedStatusText.props.style[1].color).toBe('#F44336');
    expect(unknownStatusText.props.style[1].color).toBe('#FFC107');
  });
});