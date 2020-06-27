// Initial State
const initialState = {
    name: null,
    ip: null,
} // Reducers (Modifies The State And Returns A New State)
const wifiReducer = (state = initialState, action) => {
    switch (
        action.type // Login
    ) {
        case 'SET_WIFI': {
            return {
                ...action.data,
            }
        } // Default
        default: {
            return state
        }
    }
} // Exports
export default wifiReducer
