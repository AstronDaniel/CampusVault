package com.example.campusvault.ui.main.explore;

import androidx.annotation.NonNull;
import androidx.lifecycle.ViewModel;
import androidx.lifecycle.ViewModelProvider;

import com.example.campusvault.data.api.ApiClient;
import com.example.campusvault.data.api.ApiService;
import com.example.campusvault.data.local.SharedPreferencesManager;

public class ExploreViewModelFactory implements ViewModelProvider.Factory {
    private final SharedPreferencesManager spm;

    public ExploreViewModelFactory(SharedPreferencesManager spm) {
        this.spm = spm;
    }

    @NonNull
    @Override
    public <T extends ViewModel> T create(@NonNull Class<T> modelClass) {
        ApiService api = ApiClient.getInstance(spm).getApiService();
        return (T) new ExploreViewModel(api);
    }
}
