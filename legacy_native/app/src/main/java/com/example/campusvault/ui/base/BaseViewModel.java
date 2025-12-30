package com.example.campusvault.ui.base;

import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;
import androidx.lifecycle.ViewModel;

/**
 * Base ViewModel class providing common functionality for all ViewModels
 * Handles loading states and error management
 */
public abstract class BaseViewModel extends ViewModel {

    protected final MutableLiveData<Boolean> _isLoading = new MutableLiveData<>(false);
    public final LiveData<Boolean> isLoading = _isLoading;

    protected final MutableLiveData<String> _error = new MutableLiveData<>();
    public final LiveData<String> error = _error;

    /**
     * Set loading state
     */
    protected void setLoading(boolean loading) {
        _isLoading.postValue(loading);
    }

    /**
     * Set error message
     */
    protected void setError(String errorMessage) {
        _error.postValue(errorMessage);
        setLoading(false);
    }

    /**
     * Clear error message
     */
    protected void clearError() {
        _error.postValue(null);
    }

    /**
     * Handle exceptions and set appropriate error messages
     */
    protected void handleException(Throwable throwable) {
        String errorMessage = "An unexpected error occurred";
        
        if (throwable instanceof java.net.UnknownHostException) {
            errorMessage = "No internet connection";
        } else if (throwable instanceof java.net.SocketTimeoutException) {
            errorMessage = "Request timed out";
        } else if (throwable.getMessage() != null) {
            errorMessage = throwable.getMessage();
        }
        
        setError(errorMessage);
    }
}
