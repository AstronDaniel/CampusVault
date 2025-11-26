package com.example.campusvault.ui.main.resources;

import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;
import androidx.lifecycle.ViewModel;
import com.example.campusvault.data.api.ApiService;
import com.example.campusvault.data.models.PaginatedResponse;
import com.example.campusvault.data.models.Resource;
import com.example.campusvault.data.repository.ResourceRepository;
import io.reactivex.rxjava3.android.schedulers.AndroidSchedulers;
import io.reactivex.rxjava3.disposables.CompositeDisposable;
import io.reactivex.rxjava3.schedulers.Schedulers;
import java.util.List;

public class ResourcesViewModel extends ViewModel {
    private final ResourceRepository repo;
    private final CompositeDisposable disposables = new CompositeDisposable();

    public ResourcesViewModel(ResourceRepository repo) {
        this.repo = repo;
    }

    private final MutableLiveData<List<Resource>> _resources = new MutableLiveData<>();
    public final LiveData<List<Resource>> resources = _resources;

    public void loadResources(int courseUnitId, String kind) {
        // Map kind to resource_type
        String resourceType = null;
        if ("past".equalsIgnoreCase(kind)) {
            resourceType = "past_paper";
        } else if ("notes".equalsIgnoreCase(kind)) {
            resourceType = "notes";
        }
        
        // Subscribe to DB
        disposables.add(
            repo.getResourcesByCourseUnit(courseUnitId, resourceType)
                .observeOn(AndroidSchedulers.mainThread())
                .subscribe(
                    data -> _resources.postValue(data),
                    err -> {}
                )
        );

        // Refresh from API
        disposables.add(
            repo.refreshResourcesByCourseUnit(courseUnitId, resourceType)
                .observeOn(AndroidSchedulers.mainThread())
                .subscribe(
                    () -> {},
                    throwable -> {
                        // If empty, post empty list
                        if (_resources.getValue() == null || _resources.getValue().isEmpty()) {
                            _resources.postValue(new java.util.ArrayList<>());
                        }
                    })
        );
    }

    @Override
    protected void onCleared() {
        disposables.clear();
    }
}
