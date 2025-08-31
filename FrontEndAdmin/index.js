import { AppRegistry } from 'react-native';

import { name as appName } from './app.json';
import App from './src/App';
import 'react-native-get-random-values';
if (__DEV__) {
  import('@/reactotron.config');
}

AppRegistry.registerComponent(appName, () => App);
