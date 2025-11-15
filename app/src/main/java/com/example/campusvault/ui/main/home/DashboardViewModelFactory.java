package com.example.campusvault.ui.main.home;

import android.content.Context;
import androidx.annotation.NonNull;
import androidx.lifecycle.ViewModel;
import androidx.lifecycle.ViewModelProvider;
import com.example.campusvault.data.api.ApiClient;
import com.example.campusvault.data.local.SharedPreferencesManager;

public class DashboardViewModelFactory implements ViewModelProvider.Factory {

    private final ApiClient apiClient;

    public DashboardViewModelFactory(Context context) {
        SharedPreferencesManager prefs = new SharedPreferencesManager(context);
        this.apiClient = ApiClient.getInstance(prefs);
    }

    @NonNull
    @Override
    public <T extends ViewModel> T create(@NonNull Class<T> modelClass) {
        if (modelClass.isAssignableFrom(DashboardViewModel.class)) {
            return (T) new DashboardViewModel(apiClient.getApiService());
        }
        throw new IllegalArgumentException("Unknown ViewModel class");
    }
}
