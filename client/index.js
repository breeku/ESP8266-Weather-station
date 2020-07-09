/**
 * @format
 */

import React from 'react'
import { AppRegistry } from 'react-native'
import App from './src'
import { name as appName } from './app.json'

import { PersistGate } from 'redux-persist/integration/react'

import { AppearanceProvider } from 'react-native-appearance'

import { Provider } from 'react-redux'
import { store, persistor } from '_redux/store/store'

const Root = () => (
    <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
            <AppearanceProvider>
                <App />
            </AppearanceProvider>
        </PersistGate>
    </Provider>
)

AppRegistry.registerComponent(appName, () => Root)
