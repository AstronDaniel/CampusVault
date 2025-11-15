package com.example.campusvault.ui.main.resources;

import android.content.Context;
import androidx.annotation.NonNull;
import androidx.lifecycle.ViewModel;
import androidx.lifecycle.ViewModelProvider;
import com.example.campusvault.data.api.ApiClient;
import com.example.campusvault.data.api.ApiService;
import com.example.campusvault.data.local.SharedPreferencesManager;

public class ResourcesViewModelFactory implements ViewModelProvider.Factory {
    private final Context context;
    public ResourcesViewModelFactory(Context context) { this.context = context.getApplicationContext(); }

    @NonNull @Override
    @SuppressWarnings("unchecked")
    public <T extends ViewModel> T create(@NonNull Class<T> modelClass) {
        if (modelClass.isAssignableFrom(ResourcesViewModel.class)) {
            SharedPreferencesManager prefs = new SharedPreferencesManager(context);
            ApiService api = ApiClient.getInstance(prefs).getApiService();
            return (T) new ResourcesViewModel(api);
        }
        throw new IllegalArgumentException("Unknown ViewModel class: " + modelClass.getName());
    }
}
