import { combineReducers } from '@reduxjs/toolkit';
import { authReducer } from '../slices/authSlice';

const rootReducer = combineReducers({
  auth: authReducer,
  _placeholder: (state: null = null) => state,
});

export default rootReducer;
