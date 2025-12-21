package com.example.campusvault.ui.main.resources;

import android.app.Application;
import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;
import androidx.lifecycle.ViewModel;
import com.example.campusvault.data.api.ApiService;
import com.example.campusvault.data.models.PaginatedResponse;
import com.example.campusvault.data.models.Resource;
import com.example.campusvault.data.repository.ResourceRepository;
import com.example.campusvault.data.sync.NetworkMonitor;
import io.reactivex.rxjava3.android.schedulers.AndroidSchedulers;
import io.reactivex.rxjava3.disposables.CompositeDisposable;
import io.reactivex.rxjava3.schedulers.Schedulers;
import java.util.List;

public class ResourcesViewModel extends ViewModel {
    private final ResourceRepository repo;
    private final NetworkMonitor networkMonitor;
    private final CompositeDisposable disposables = new CompositeDisposable();

    public ResourcesViewModel(ResourceRepository repo, Application application) {
        this.repo = repo;
        this.networkMonitor = NetworkMonitor.getInstance(application);
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
        
        final String finalResourceType = resourceType;
        
        // Subscribe to DB - instant local data
        disposables.add(
            repo.getResourcesByCourseUnit(courseUnitId, finalResourceType)
                .observeOn(AndroidSchedulers.mainThread())
                .subscribe(
                    data -> _resources.postValue(data),
                    err -> {}
                )
        );
        
        // Always refresh from API in background if online
        if (networkMonitor.isOnline()) {
            disposables.add(
                repo.refreshResourcesByCourseUnit(courseUnitId, finalResourceType)
                    .observeOn(AndroidSchedulers.mainThread())
                    .subscribe(
                        () -> {},
                        throwable -> {}
                    )
            );
        }
    }

    @Override
    protected void onCleared() {
        disposables.clear();
    }
}
