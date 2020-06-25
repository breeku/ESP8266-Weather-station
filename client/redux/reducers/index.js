// Imports: Dependencies
import {combineReducers} from 'redux'; // Imports: Reducers
import settingsReducer from './settingsReducer';
import wifiReducer from './wifiReducer';

// Redux: Root Reducer
const rootReducer = combineReducers({
  settingsReducer,
  wifiReducer,
}); // Exports

export default rootReducer;
