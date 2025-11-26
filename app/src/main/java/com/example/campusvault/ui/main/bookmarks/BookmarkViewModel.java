package com.example.campusvault.ui.main.bookmarks;

import android.app.Application;
import androidx.annotation.NonNull;
import androidx.lifecycle.AndroidViewModel;
import androidx.lifecycle.LiveData;
import androidx.lifecycle.MediatorLiveData;
import androidx.lifecycle.MutableLiveData;
import com.example.campusvault.data.models.Resource;
import com.example.campusvault.data.repository.BookmarkRepository;
import com.example.campusvault.data.repository.ResourceRepository;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

public class BookmarkViewModel extends AndroidViewModel {
    private final BookmarkRepository bookmarkRepository;
    private final ResourceRepository resourceRepository;

    private final MediatorLiveData<List<Resource>> _bookmarks = new MediatorLiveData<>();
    public LiveData<List<Resource>> bookmarks = _bookmarks;

    private LiveData<List<Resource>> allBookmarks;
    private String currentSort = "recent";
    private String currentType = null;
    private String searchQuery = null;

    public BookmarkViewModel(@NonNull Application application) {
        super(application);
        bookmarkRepository = new BookmarkRepository(application);
        
        // Create ResourceRepository with ApiService
        com.example.campusvault.data.local.SharedPreferencesManager prefs = 
            new com.example.campusvault.data.local.SharedPreferencesManager(application);
        com.example.campusvault.data.api.ApiService api = 
            com.example.campusvault.data.api.ApiClient.getInstance(prefs).getApiService();
        resourceRepository = new ResourceRepository(application, api);
        
        // Initialize with empty list for now (bookmarks need LiveData wrapper)
        allBookmarks = new androidx.lifecycle.MutableLiveData<>();
        ((androidx.lifecycle.MutableLiveData<List<Resource>>)allBookmarks).setValue(new ArrayList<>());
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
        bookmarkRepository.insert(resourceId);
    }

    public void unbookmarkResource(int resourceId) {
        bookmarkRepository.delete(resourceId);
    }

    private void applyFiltersAndSort() {
        List<Resource> source = allBookmarks.getValue();
        if (source == null) {
            _bookmarks.setValue(new ArrayList<>());
            return;
        }

        List<Resource> filtered = new ArrayList<>(source);

        // Filter by type
        if (currentType != null && !currentType.isEmpty()) {
            filtered = filtered.stream()
                    .filter(r -> currentType.equals(r.getResourceType()))
                    .collect(Collectors.toList());
        }

        // Filter by search query
        if (searchQuery != null && !searchQuery.isEmpty()) {
            String query = searchQuery.toLowerCase();
            filtered = filtered.stream()
                    .filter(r -> r.getTitle().toLowerCase().contains(query) ||
                            (r.getDescription() != null && r.getDescription().toLowerCase().contains(query)))
                    .collect(Collectors.toList());
        }

        // Sort
        switch (currentSort) {
            case "alphabetical":
                Collections.sort(filtered, Comparator.comparing(r -> r.getTitle().toLowerCase()));
                break;
            case "rating":
                Collections.sort(filtered, (r1, r2) -> Float.compare(r2.getAverageRating(), r1.getAverageRating()));
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
}

