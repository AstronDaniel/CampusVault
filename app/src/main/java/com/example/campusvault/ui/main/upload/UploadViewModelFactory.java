package com.example.campusvault.ui.main.upload;

import android.app.Application;
import androidx.annotation.NonNull;
import androidx.lifecycle.ViewModel;
import androidx.lifecycle.ViewModelProvider;
import com.example.campusvault.data.api.ApiClient;
import com.example.campusvault.data.api.ApiService;
import com.example.campusvault.data.local.EncryptedPreferencesManager;
import com.example.campusvault.data.local.SharedPreferencesManager;

public class UploadViewModelFactory implements ViewModelProvider.Factory {
    private final Application application;
    private final SharedPreferencesManager spm;

    public UploadViewModelFactory(Application application, SharedPreferencesManager spm) {
        this.application = application;
        this.spm = spm;
    }

    @NonNull
    @Override
    public <T extends ViewModel> T create(@NonNull Class<T> modelClass) {
        // Create encrypted preferences manager and pass both to ApiClient
        EncryptedPreferencesManager epm = new EncryptedPreferencesManager(application);
        ApiService api = ApiClient.getInstance(spm, epm).getApiService();
        return (T) new UploadViewModel(application, api);
    }
}
