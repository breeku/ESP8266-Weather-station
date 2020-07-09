// Imports: Dependencies
import { combineReducers } from 'redux' // Imports: Reducers
import settingsReducer from './settingsReducer'
import wifiReducer from './wifiReducer'
import themeReducer from './themeReducer'

// Redux: Root Reducer
const rootReducer = combineReducers({
    settingsReducer,
    wifiReducer,
    themeReducer,
}) // Exports

export default rootReducer
