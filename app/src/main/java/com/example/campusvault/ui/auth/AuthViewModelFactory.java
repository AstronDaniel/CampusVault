package com.example.campusvault.ui.auth;

import android.content.Context;
import androidx.annotation.NonNull;
import androidx.lifecycle.ViewModel;
import androidx.lifecycle.ViewModelProvider;
import com.example.campusvault.data.api.ApiClient;
import com.example.campusvault.data.local.EncryptedPreferencesManager;
import com.example.campusvault.data.local.SharedPreferencesManager;
import com.example.campusvault.data.local.database.AppDatabase;
import com.example.campusvault.data.repository.AuthRepository;

/**
 * Factory for creating AuthViewModel with dependencies
 */
public class AuthViewModelFactory implements ViewModelProvider.Factory {

    private final AuthRepository authRepository;
    private final ApiClient apiClient;

    public AuthViewModelFactory(Context context) {
        SharedPreferencesManager preferencesManager = new SharedPreferencesManager(context);
        EncryptedPreferencesManager encryptedPreferencesManager = new EncryptedPreferencesManager(context);
        AppDatabase database = AppDatabase.getInstance(context);
        
        this.apiClient = ApiClient.getInstance(preferencesManager);
        this.authRepository = new AuthRepository(
            apiClient.getApiService(),
            preferencesManager,
            encryptedPreferencesManager,
            database.userDao()
        );
    }

    @NonNull
    @Override
    public <T extends ViewModel> T create(@NonNull Class<T> modelClass) {
        if (modelClass.isAssignableFrom(AuthViewModel.class)) {
            return (T) new AuthViewModel(authRepository, apiClient.getApiService());
        }
        throw new IllegalArgumentException("Unknown ViewModel class");
    }
}
