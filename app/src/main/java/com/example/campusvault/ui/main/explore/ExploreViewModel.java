package com.example.campusvault.ui.main.explore;

import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;
import androidx.lifecycle.ViewModel;
import com.example.campusvault.data.api.ApiService;
import com.example.campusvault.data.models.FacultyResponse;
import com.example.campusvault.data.models.PaginatedResponse;
import com.example.campusvault.data.models.ProgramResponse;
import com.example.campusvault.data.models.Resource;
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

    private final MutableLiveData<List<Resource>> _resourcesPaged = new MutableLiveData<>();
    public LiveData<List<Resource>> resourcesPaged = _resourcesPaged;

    private final MutableLiveData<List<String>> _suggestions = new MutableLiveData<>();
    public LiveData<List<String>> suggestions = _suggestions;

    private final MutableLiveData<Boolean> _loading = new MutableLiveData<>();
    public LiveData<Boolean> loading = _loading;

    private String currentQuery = null;
    private Integer programId = null;
    private String resourceType = null;

    public ExploreViewModel(ApiService api) {
        this.api = api;
    }

    public void loadFaculties() {
        _loading.setValue(true);
        cd.add(api.getFaculties()
                .subscribeOn(Schedulers.io())
                .observeOn(AndroidSchedulers.mainThread())
                .doFinally(() -> _loading.setValue(false))
                .subscribe(_faculties::setValue, err -> {}));
    }

    public void loadPrograms(Integer facultyId) {
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

    public void setResourceType(String resourceType) {
        this.resourceType = resourceType;
        loadResources();
    }

    public void loadSuggestions(String query) {
        // Mock suggestions
        // In a real app, you would call an API endpoint
        List<String> mockSuggestions = List.of(query + " suggestion 1", query + " suggestion 2");
        _suggestions.setValue(mockSuggestions);
    }

    private void loadResources() {
        _loading.setValue(true);
        cd.add(api.getResources(1, 40, currentQuery, programId, null, null, null, resourceType)
                .subscribeOn(Schedulers.io())
                .observeOn(AndroidSchedulers.mainThread())
                .doFinally(() -> _loading.setValue(false))
                .subscribe((PaginatedResponse<Resource> page) -> _resourcesPaged.setValue(page.getItems()),
                        err -> {
                            // Handle error
                        }));
    }

    @Override
    protected void onCleared() {
        cd.clear();
        super.onCleared();
    }
}
