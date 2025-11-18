package com.example.campusvault.ui.main.bookmarks;

import androidx.annotation.NonNull;
import androidx.lifecycle.ViewModel;
import androidx.lifecycle.ViewModelProvider;

import com.example.campusvault.data.api.ApiClient;
import com.example.campusvault.data.api.ApiService;
import com.example.campusvault.data.local.SharedPreferencesManager;

public class BookmarkViewModelFactory implements ViewModelProvider.Factory {
    private final SharedPreferencesManager prefsManager;

    public BookmarkViewModelFactory(SharedPreferencesManager prefsManager) {
        this.prefsManager = prefsManager;
    }

    @NonNull
    @Override
    public <T extends ViewModel> T create(@NonNull Class<T> modelClass) {
        if (modelClass.isAssignableFrom(BookmarkViewModel.class)) {
            ApiService apiService = ApiClient.getInstance(prefsManager).getApiService();
            return (T) new BookmarkViewModel(apiService);
        }
        throw new IllegalArgumentException("Unknown ViewModel class");
    }
}

