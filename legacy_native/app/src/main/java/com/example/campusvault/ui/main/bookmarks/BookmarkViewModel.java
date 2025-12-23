package com.example.campusvault.ui.main.bookmarks;

import android.app.Application;
import androidx.annotation.NonNull;
import androidx.lifecycle.AndroidViewModel;
import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;
import com.example.campusvault.data.api.ApiClient;
import com.example.campusvault.data.api.ApiService;
import com.example.campusvault.data.local.EncryptedPreferencesManager;
import com.example.campusvault.data.local.SharedPreferencesManager;
import com.example.campusvault.data.models.Resource;
import io.reactivex.rxjava3.android.schedulers.AndroidSchedulers;
import io.reactivex.rxjava3.disposables.CompositeDisposable;
import io.reactivex.rxjava3.schedulers.Schedulers;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

public class BookmarkViewModel extends AndroidViewModel {
    private final ApiService api;
    private final CompositeDisposable disposables = new CompositeDisposable();

    private final MutableLiveData<List<Resource>> _bookmarks = new MutableLiveData<>();
    public LiveData<List<Resource>> bookmarks = _bookmarks;

    private final MutableLiveData<Boolean> _loading = new MutableLiveData<>(false);
    public LiveData<Boolean> loading = _loading;

    private final MutableLiveData<String> _error = new MutableLiveData<>();
    public LiveData<String> error = _error;

    private List<Resource> allBookmarks = new ArrayList<>();
    private String currentSort = "recent";
    private String currentType = null;
    private String searchQuery = null;

    public BookmarkViewModel(@NonNull Application application) {
        super(application);
        SharedPreferencesManager prefs = new SharedPreferencesManager(application);
        EncryptedPreferencesManager encPrefs = new EncryptedPreferencesManager(application);
        api = ApiClient.getInstance(prefs, encPrefs).getApiService();
        
        loadBookmarks();
    }

    public void loadBookmarks() {
        _loading.setValue(true);
        _error.setValue(null);
        
        disposables.add(api.getBookmarkedResources()
            .subscribeOn(Schedulers.io())
            .observeOn(AndroidSchedulers.mainThread())
            .subscribe(
                resources -> {
                    _loading.setValue(false);
                    allBookmarks = resources != null ? resources : new ArrayList<>();
                    // Mark all as bookmarked since they came from bookmarks endpoint
                    for (Resource r : allBookmarks) {
                        r.setBookmarked(true);
                    }
                    applyFiltersAndSort();
                },
                err -> {
                    _loading.setValue(false);
                    _error.setValue("Failed to load bookmarks: " + err.getMessage());
                    android.util.Log.e("BookmarkViewModel", "Error loading bookmarks", err);
                }
            ));
    }

    public void setSortAndType(String sort, String type) {
        this.currentSort = sort;
        this.currentType = type;
        applyFiltersAndSort();
    }

    public void setSearchQuery(String query) {
        this.searchQuery = query;
        applyFiltersAndSort();
    }

    public void bookmarkResource(int resourceId) {
        disposables.add(api.bookmarkResource(resourceId)
            .subscribeOn(Schedulers.io())
            .observeOn(AndroidSchedulers.mainThread())
            .subscribe(
                () -> loadBookmarks(), // Refresh list
                err -> _error.setValue("Failed to bookmark: " + err.getMessage())
            ));
    }

    public void unbookmarkResource(int resourceId) {
        // Optimistically remove from local list
        allBookmarks = allBookmarks.stream()
            .filter(r -> r.getId() != resourceId)
            .collect(Collectors.toList());
        applyFiltersAndSort();
        
        disposables.add(api.unbookmarkResource(resourceId)
            .subscribeOn(Schedulers.io())
            .observeOn(AndroidSchedulers.mainThread())
            .subscribe(
                () -> { /* Already removed optimistically */ },
                err -> {
                    _error.setValue("Failed to remove bookmark: " + err.getMessage());
                    loadBookmarks(); // Reload to restore state
                }
            ));
    }

    private void applyFiltersAndSort() {
        List<Resource> filtered = new ArrayList<>(allBookmarks);

        // Filter by type (only notes and past_paper)
        if (currentType != null && !currentType.isEmpty()) {
            filtered = filtered.stream()
                    .filter(r -> currentType.equals(r.getResourceType()))
                    .collect(Collectors.toList());
        }

        // Filter by search query
        if (searchQuery != null && !searchQuery.isEmpty()) {
            String query = searchQuery.toLowerCase();
            filtered = filtered.stream()
                    .filter(r -> (r.getTitle() != null && r.getTitle().toLowerCase().contains(query)) ||
                            (r.getDescription() != null && r.getDescription().toLowerCase().contains(query)))
                    .collect(Collectors.toList());
        }

        // Sort
        switch (currentSort) {
            case "alphabetical":
                Collections.sort(filtered, Comparator.comparing(r -> 
                    r.getTitle() != null ? r.getTitle().toLowerCase() : ""));
                break;
            case "rating":
                Collections.sort(filtered, (r1, r2) -> 
                    Float.compare(r2.getAverageRating(), r1.getAverageRating()));
                break;
            case "recent":
            default:
                Collections.sort(filtered, (r1, r2) -> {
                    if (r1.getUploadedAt() == null) return 1;
                    if (r2.getUploadedAt() == null) return -1;
                    return r2.getUploadedAt().compareTo(r1.getUploadedAt());
                });
                break;
        }

        _bookmarks.setValue(filtered);
    }

    @Override
    protected void onCleared() {
        disposables.clear();
        super.onCleared();
    }
}

