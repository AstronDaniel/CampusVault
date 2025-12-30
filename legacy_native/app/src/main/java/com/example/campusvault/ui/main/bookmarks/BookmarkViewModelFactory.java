package com.example.campusvault.ui.main.bookmarks;

import android.app.Application;
import androidx.annotation.NonNull;
import androidx.lifecycle.ViewModel;
import androidx.lifecycle.ViewModelProvider;

public class BookmarkViewModelFactory implements ViewModelProvider.Factory {
    private final Application application;

    public BookmarkViewModelFactory(Application application) {
        this.application = application;
    }

    @NonNull
    @Override
    public <T extends ViewModel> T create(@NonNull Class<T> modelClass) {
        if (modelClass.isAssignableFrom(BookmarkViewModel.class)) {
            return (T) new BookmarkViewModel(application);
        }
        throw new IllegalArgumentException("Unknown ViewModel class");
    }
}

