// store.js
import { configureStore } from '@reduxjs/toolkit';
import globalSlice from './globalSlice';
import logger from './middleware/logger';
// import {thunk} from 'redux-thunk';

// Configure store
const store = configureStore({
    reducer: {
        global: globalSlice.reducer
    },
    middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware({
            serializableCheck: false,
          })
});

export default store;
