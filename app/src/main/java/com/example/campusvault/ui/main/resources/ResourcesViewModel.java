package com.example.campusvault.ui.main.resources;

import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;
import androidx.lifecycle.ViewModel;
import com.example.campusvault.data.api.ApiService;
import com.example.campusvault.data.models.PaginatedResponse;
import com.example.campusvault.data.models.Resource;
import io.reactivex.rxjava3.android.schedulers.AndroidSchedulers;
import io.reactivex.rxjava3.disposables.CompositeDisposable;
import io.reactivex.rxjava3.schedulers.Schedulers;
import java.util.List;

public class ResourcesViewModel extends ViewModel {
    private final ApiService apiService;
    private final CompositeDisposable disposables = new CompositeDisposable();

    public ResourcesViewModel(ApiService apiService) {
        this.apiService = apiService;
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
        
        disposables.add(
            apiService.getResources(1, 100, null, null, courseUnitId, null, null, resourceType)
                .subscribeOn(Schedulers.io())
                .observeOn(AndroidSchedulers.mainThread())
                .subscribe(
                    (PaginatedResponse<Resource> resp) -> _resources.postValue(resp.getItems()),
                    throwable -> {
                        // Post empty list so dummy data can be loaded
                        _resources.postValue(new java.util.ArrayList<>());
                    })
        );
    }

    @Override
    protected void onCleared() {
        disposables.clear();
    }
}
