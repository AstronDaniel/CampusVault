package com.example.campusvault.ui.main.profile;

import androidx.annotation.NonNull;
import androidx.lifecycle.ViewModel;
import androidx.lifecycle.ViewModelProvider;
import com.example.campusvault.data.api.ApiClient;
import com.example.campusvault.data.api.ApiService;
import com.example.campusvault.data.local.SharedPreferencesManager;

public class ProfileViewModelFactory implements ViewModelProvider.Factory {
    private final SharedPreferencesManager spm;

    public ProfileViewModelFactory(SharedPreferencesManager spm) {
        this.spm = spm;
    }

    @NonNull
    @Override
    public <T extends ViewModel> T create(@NonNull Class<T> modelClass) {
        if (modelClass.isAssignableFrom(ProfileViewModel.class)) {
            ApiService api = ApiClient.getInstance(spm).getApiService();
            return (T) new ProfileViewModel(api, spm);
        }
        throw new IllegalArgumentException("Unknown ViewModel class");
    }
}
