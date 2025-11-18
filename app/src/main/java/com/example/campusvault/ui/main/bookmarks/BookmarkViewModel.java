package com.example.campusvault.ui.main.bookmarks;

import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;
import androidx.lifecycle.ViewModel;

import com.example.campusvault.data.api.ApiService;
import com.example.campusvault.data.models.PaginatedResponse;
import com.example.campusvault.data.models.Resource;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

import io.reactivex.rxjava3.android.schedulers.AndroidSchedulers;
import io.reactivex.rxjava3.disposables.CompositeDisposable;
import io.reactivex.rxjava3.schedulers.Schedulers;

public class BookmarkViewModel extends ViewModel {
    private final ApiService api;
    private final CompositeDisposable cd = new CompositeDisposable();

    private final MutableLiveData<List<Resource>> _bookmarks = new MutableLiveData<>();
    public LiveData<List<Resource>> bookmarks = _bookmarks;

    private List<Resource> allBookmarks = new ArrayList<>();
    private String currentSort = "recent";
    private String currentType = null;
    private String searchQuery = null;

    public BookmarkViewModel(ApiService api) {
        this.api = api;
    }

    public void loadBookmarks() {
        cd.add(api.getBookmarkedResources(1, 100)
                .subscribeOn(Schedulers.io())
                .observeOn(AndroidSchedulers.mainThread())
                .subscribe(
                        (PaginatedResponse<Resource> page) -> {
                            allBookmarks = page.getItems() != null ? new ArrayList<>(page.getItems()) : new ArrayList<>();
                            applyFiltersAndSort();
                        },
                        err -> _bookmarks.setValue(new ArrayList<>())
                ));
    }

    public void refresh() {
        loadBookmarks();
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
        cd.add(api.bookmarkResource(resourceId)
                .subscribeOn(Schedulers.io())
                .observeOn(AndroidSchedulers.mainThread())
                .subscribe(
                        () -> loadBookmarks(),
                        err -> {}
                ));
    }

    public void unbookmarkResource(int resourceId) {
        cd.add(api.unbookmarkResource(resourceId)
                .subscribeOn(Schedulers.io())
                .observeOn(AndroidSchedulers.mainThread())
                .subscribe(
                        () -> loadBookmarks(),
                        err -> {}
                ));
    }

    private void applyFiltersAndSort() {
        List<Resource> filtered = new ArrayList<>(allBookmarks);

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

    @Override
    protected void onCleared() {
        cd.clear();
        super.onCleared();
    }
}

