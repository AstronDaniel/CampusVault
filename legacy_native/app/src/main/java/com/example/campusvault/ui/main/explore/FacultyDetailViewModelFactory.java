package com.example.campusvault.ui.main.explore;

import android.app.Application;
import androidx.annotation.NonNull;
import androidx.lifecycle.ViewModel;
import androidx.lifecycle.ViewModelProvider;
import com.example.campusvault.data.api.ApiClient;
import com.example.campusvault.data.api.ApiService;
import com.example.campusvault.data.local.SharedPreferencesManager;
import com.example.campusvault.data.repository.UniversityRepository;

public class FacultyDetailViewModelFactory implements ViewModelProvider.Factory {
    private final Application application;
    private final SharedPreferencesManager spm;

    public FacultyDetailViewModelFactory(Application application, SharedPreferencesManager spm) {
        this.application = application;
        this.spm = spm;
    }

    @NonNull
    @Override
    public <T extends ViewModel> T create(@NonNull Class<T> modelClass) {
        if (modelClass.isAssignableFrom(FacultyDetailViewModel.class)) {
            ApiService api = ApiClient.getInstance(spm).getApiService();
            UniversityRepository repo = new UniversityRepository(application, api);
            return (T) new FacultyDetailViewModel(repo);
        }
        throw new IllegalArgumentException("Unknown ViewModel class");
    }
}
