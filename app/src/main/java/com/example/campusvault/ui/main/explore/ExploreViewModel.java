package com.example.campusvault.ui.main.explore;

import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;
import androidx.lifecycle.ViewModel;

import com.example.campusvault.data.api.ApiService;
import com.example.campusvault.data.models.PaginatedResponse;
import com.example.campusvault.data.models.Resource;
import com.example.campusvault.data.models.FacultyResponse;
import com.example.campusvault.data.models.ProgramResponse;

import io.reactivex.rxjava3.android.schedulers.AndroidSchedulers;
import io.reactivex.rxjava3.disposables.CompositeDisposable;
import io.reactivex.rxjava3.schedulers.Schedulers;

import java.util.List;

public class ExploreViewModel extends ViewModel {
    private final ApiService api;
    private final CompositeDisposable cd = new CompositeDisposable();

    private final MutableLiveData<List<FacultyResponse>> _faculties = new MutableLiveData<>();
    public LiveData<List<FacultyResponse>> faculties = _faculties;

    private final MutableLiveData<List<ProgramResponse>> _programs = new MutableLiveData<>();
    public LiveData<List<ProgramResponse>> programs = _programs;

    private final MutableLiveData<List<Resource>> _resources = new MutableLiveData<>();
    public LiveData<List<Resource>> resources = _resources;

    private String currentQuery = null;
    private Integer selectedFacultyId = null;
    private Integer programId = null;

    public ExploreViewModel(ApiService api) {
        this.api = api;
    }

    public void loadFaculties() {
        cd.add(api.getFaculties()
                .subscribeOn(Schedulers.io())
                .observeOn(AndroidSchedulers.mainThread())
                .subscribe(_faculties::setValue, err -> {}));
    }

    public void loadPrograms(Integer facultyId) {
        this.selectedFacultyId = facultyId;
        cd.add(api.getPrograms(facultyId)
                .subscribeOn(Schedulers.io())
                .observeOn(AndroidSchedulers.mainThread())
                .subscribe(_programs::setValue, err -> {}));
    }

    public void setProgramAndQuery(Integer programId, String query) {
        this.programId = programId;
        this.currentQuery = query;
        loadResources();
    }

    public void refresh() { loadResources(); }

    private void loadResources() {
        cd.add(api.getResources(1, 40, currentQuery, programId, null, null, null, null)
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
