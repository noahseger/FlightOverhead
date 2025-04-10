/**
 * @format
 */

// Import polyfill first to ensure it loads before any other module
import './src/core/utils/HermesPolyfill';

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';

// Register the app component
AppRegistry.registerComponent(appName, () => App);