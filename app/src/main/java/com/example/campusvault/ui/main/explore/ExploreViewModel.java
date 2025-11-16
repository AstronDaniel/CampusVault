package com.example.campusvault.ui.main.explore;

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

public class ExploreViewModel extends ViewModel {
    private final ApiService api;
    private final CompositeDisposable cd = new CompositeDisposable();

    private final MutableLiveData<List<Resource>> _resources = new MutableLiveData<>();
    public LiveData<List<Resource>> resources = _resources;

    private String currentQuery = null;
    private Integer year = 1;
    private Integer semester = 1;
    private Integer programId = null;

    public ExploreViewModel(ApiService api) {
        this.api = api;
    }

    public void setFilters(Integer programId, Integer year, Integer semester, String query) {
        this.programId = programId;
        this.year = year;
        this.semester = semester;
        this.currentQuery = query;
        load();
    }

    public void refresh() {
        load();
    }

    private void load() {
        cd.add(api.getResources(1, 40, currentQuery, programId, null, year, semester, null)
                .subscribeOn(Schedulers.io())
                .observeOn(AndroidSchedulers.mainThread())
                .subscribe((PaginatedResponse<Resource> page) -> _resources.setValue(page.getItems()),
                        err -> {
                            // noop for now
                        }));
    }

    @Override
    protected void onCleared() {
        cd.clear();
        super.onCleared();
    }
}
