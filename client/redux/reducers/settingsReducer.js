// Initial State
const initialState = {
  permissions: false,
  autoWifi: false,
  credentials: {SSID: null, password: null, isWep: null},
}; // Reducers (Modifies The State And Returns A New State)
const settingsReducer = (state = initialState, action) => {
  switch (
    action.type // Login
  ) {
    case 'SET_SETTINGS': {
      return {
        ...action.data,
      };
    } // Default
    default: {
      return state;
    }
  }
}; // Exports
export default settingsReducer;
