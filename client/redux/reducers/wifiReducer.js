// Initial State
const initialState = {
  wifiName: null,
  wifiIP: null,
}; // Reducers (Modifies The State And Returns A New State)
const wifiReducer = (state = initialState, action) => {
  switch (
    action.type // Login
  ) {
    case 'SET_WIFI_NAME': {
      return {
        ...state,
        wifiName: action.data,
      };
    } // Default
    case 'SET_WIFI_IP': {
      return {
        ...state,
        wifiIP: action.data,
      };
    } // Default
    default: {
      return state;
    }
  }
}; // Exports
export default wifiReducer;
