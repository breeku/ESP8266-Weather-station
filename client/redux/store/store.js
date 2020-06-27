// Imports: Dependencies
import AsyncStorage from '@react-native-community/async-storage'
import {createStore, applyMiddleware} from 'redux'
import {createLogger} from 'redux-logger'
import {persistStore, persistReducer} from 'redux-persist' // Imports: Redux
import rootReducer from '../reducers/index' // Middleware: Redux Persist Config

const persistConfig = {
    // Root
    key: 'root',
    // Storage Method (React Native)
    storage: AsyncStorage,
    // Whitelist (Save Specific Reducers)
    whitelist: [],
    // Blacklist (Don't Save Specific Reducers)
} // Middleware: Redux Persist Persisted Reducer

const logger = createLogger({
    colors: {},
})

const persistedReducer = persistReducer(persistConfig, rootReducer) // Redux: Store
const store = createStore(persistedReducer, applyMiddleware(logger)) // Middleware: Redux Persist Persister
let persistor = persistStore(store) // Exports
export {store, persistor}
