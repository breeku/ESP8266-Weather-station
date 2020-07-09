// Initial State
const initialState = {
    theme: 'default',
} // Reducers (Modifies The State And Returns A New State)
const themeReducer = (state = initialState, action) => {
    switch (
        action.type // Login
    ) {
        case 'SET_THEME': {
            return {
                theme: action.data,
            }
        } // Default
        default: {
            return state
        }
    }
} // Exports
export default themeReducer
