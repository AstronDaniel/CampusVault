package com.example.campusvault.ui.main.explore;

import android.app.Application;
import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;
import androidx.lifecycle.ViewModel;
import com.example.campusvault.data.api.ApiService;
import com.example.campusvault.data.models.FacultyResponse;
import com.example.campusvault.data.models.PaginatedResponse;
import com.example.campusvault.data.models.ProgramResponse;
import com.example.campusvault.data.models.Resource;
import com.example.campusvault.data.repository.UniversityRepository;
import com.example.campusvault.data.sync.NetworkMonitor;
import io.reactivex.rxjava3.android.schedulers.AndroidSchedulers;
import io.reactivex.rxjava3.disposables.CompositeDisposable;
import io.reactivex.rxjava3.schedulers.Schedulers;
import java.util.List;

public class ExploreViewModel extends ViewModel {
    private final UniversityRepository repo;
    private final NetworkMonitor networkMonitor;
    private final CompositeDisposable cd = new CompositeDisposable();

    private final MutableLiveData<List<FacultyResponse>> _faculties = new MutableLiveData<>();
    public LiveData<List<FacultyResponse>> faculties = _faculties;

    private final MutableLiveData<List<ProgramResponse>> _programs = new MutableLiveData<>();
    public LiveData<List<ProgramResponse>> programs = _programs;

    private final MutableLiveData<Boolean> _loading = new MutableLiveData<>();
    public LiveData<Boolean> loading = _loading;
    
    private final MutableLiveData<String> _error = new MutableLiveData<>();
    public LiveData<String> error = _error;

    private Integer programId = null;

    private final MutableLiveData<List<com.example.campusvault.data.models.CourseUnit>> _courseUnits = new MutableLiveData<>();
    public LiveData<List<com.example.campusvault.data.models.CourseUnit>> courseUnits = _courseUnits;

    private Integer year = null;
    private Integer semester = null;

    public ExploreViewModel(UniversityRepository repo, Application application) {
        this.repo = repo;
        this.networkMonitor = NetworkMonitor.getInstance(application);
    }

    public void loadFaculties() {
        // Subscribe to DB updates - this is instant from local cache
        cd.add(repo.getFaculties()
                .observeOn(AndroidSchedulers.mainThread())
                .subscribe(data -> {
                    _faculties.setValue(data);
                    // If we have data from local DB, no need to show loading
                    if (!data.isEmpty()) {
                        _loading.setValue(false);
                    }
                }, err -> {}));

        // If no data yet, show loading
        if (_faculties.getValue() == null || _faculties.getValue().isEmpty()) {
            _loading.setValue(true);
        }
        
        // Always refresh from API in background if online
        if (networkMonitor.isOnline()) {
            cd.add(repo.refreshFaculties()
                    .observeOn(AndroidSchedulers.mainThread())
                    .doFinally(() -> _loading.setValue(false))
                    .subscribe(() -> {}, err -> {}));
        }
    }
    
    /**
     * Force refresh from API (e.g., pull-to-refresh)
     */
    public void forceRefreshFaculties() {
        if (!networkMonitor.isOnline()) {
            _error.setValue("Cannot refresh while offline. Viewing cached data.");
            return;
        }
        
        _loading.setValue(true);
        cd.add(repo.refreshFaculties()
                .observeOn(AndroidSchedulers.mainThread())
                .doFinally(() -> _loading.setValue(false))
                .subscribe(() -> {}, err -> {}));
    }

    public void loadPrograms(Integer facultyId) {
        // Subscribe to DB - instant local data
        cd.add(repo.getPrograms(facultyId)
                .observeOn(AndroidSchedulers.mainThread())
                .subscribe(data -> {
                    _programs.setValue(data);
                    if (!data.isEmpty()) {
                        _loading.setValue(false);
                    }
                }, err -> {}));

        if (_programs.getValue() == null || _programs.getValue().isEmpty()) {
            _loading.setValue(true);
        }
        
        // Always refresh from API in background if online
        if (networkMonitor.isOnline()) {
            cd.add(repo.refreshPrograms(facultyId)
                    .observeOn(AndroidSchedulers.mainThread())
                    .doFinally(() -> _loading.setValue(false))
                    .subscribe(() -> {}, err -> {}));
        }
    }

    public void loadCourseUnits() {
        if (programId == null || year == null || semester == null) return;
        
        // Subscribe to DB - instant local data
        cd.add(repo.getCourseUnits(programId, year, semester)
                .observeOn(AndroidSchedulers.mainThread())
                .subscribe(data -> {
                    _courseUnits.setValue(data);
                    if (!data.isEmpty()) {
                        _loading.setValue(false);
                    }
                }, err -> {}));

        if (_courseUnits.getValue() == null || _courseUnits.getValue().isEmpty()) {
            _loading.setValue(true);
        }
        
        // Always refresh from API in background if online
        if (networkMonitor.isOnline()) {
            cd.add(repo.refreshCourseUnits(programId, year, semester)
                    .observeOn(AndroidSchedulers.mainThread())
                    .doFinally(() -> _loading.setValue(false))
                    .subscribe(() -> {}, err -> {}));
        }
    }

    public void setProgram(Integer programId) {
        this.programId = programId;
        // Reset dependent filters
        this.year = null;
        this.semester = null;
        _courseUnits.setValue(java.util.Collections.emptyList());
    }

    public void setYearAndSemester(Integer year, Integer semester) {
        this.year = year;
        this.semester = semester;
        loadCourseUnits();
    }

    @Override
    protected void onCleared() {
        cd.clear();
        super.onCleared();
    }
}
