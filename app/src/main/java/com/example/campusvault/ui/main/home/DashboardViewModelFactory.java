package com.example.campusvault.ui.main.home;

import android.app.Application;
import android.content.Context;
import androidx.annotation.NonNull;
import androidx.lifecycle.ViewModel;
import androidx.lifecycle.ViewModelProvider;
import com.example.campusvault.data.api.ApiClient;
import com.example.campusvault.data.local.SharedPreferencesManager;
import com.example.campusvault.data.repository.ResourceRepository;
import com.example.campusvault.data.repository.UniversityRepository;

public class DashboardViewModelFactory implements ViewModelProvider.Factory {

    private final Application application;
    private final ApiClient apiClient;

    public DashboardViewModelFactory(Context context) {
        this.application = (Application) context.getApplicationContext();
        SharedPreferencesManager prefs = new SharedPreferencesManager(context);
        this.apiClient = ApiClient.getInstance(prefs);
    }

    @NonNull
    @Override
    public <T extends ViewModel> T create(@NonNull Class<T> modelClass) {
        if (modelClass.isAssignableFrom(DashboardViewModel.class)) {
            ResourceRepository resourceRepo = new ResourceRepository(application, apiClient.getApiService());
            UniversityRepository universityRepo = new UniversityRepository(application, apiClient.getApiService());
            return (T) new DashboardViewModel(resourceRepo, universityRepo, apiClient.getApiService());
        }
        throw new IllegalArgumentException("Unknown ViewModel class");
    }
}
