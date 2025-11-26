package com.example.campusvault.ui.main.explore;

import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;
import androidx.lifecycle.ViewModel;
import com.example.campusvault.data.api.ApiService;
import com.example.campusvault.data.models.FacultyResponse;
import com.example.campusvault.data.models.PaginatedResponse;
import com.example.campusvault.data.models.ProgramResponse;
import com.example.campusvault.data.models.Resource;
import com.example.campusvault.data.repository.UniversityRepository;
import io.reactivex.rxjava3.android.schedulers.AndroidSchedulers;
import io.reactivex.rxjava3.disposables.CompositeDisposable;
import io.reactivex.rxjava3.schedulers.Schedulers;
import java.util.List;

public class ExploreViewModel extends ViewModel {
    private final UniversityRepository repo;
    private final CompositeDisposable cd = new CompositeDisposable();

    private final MutableLiveData<List<FacultyResponse>> _faculties = new MutableLiveData<>();
    public LiveData<List<FacultyResponse>> faculties = _faculties;

    private final MutableLiveData<List<ProgramResponse>> _programs = new MutableLiveData<>();
    public LiveData<List<ProgramResponse>> programs = _programs;

    private final MutableLiveData<Boolean> _loading = new MutableLiveData<>();
    public LiveData<Boolean> loading = _loading;

    private Integer programId = null;

    private final MutableLiveData<List<com.example.campusvault.data.models.CourseUnit>> _courseUnits = new MutableLiveData<>();
    public LiveData<List<com.example.campusvault.data.models.CourseUnit>> courseUnits = _courseUnits;

    private Integer year = null;
    private Integer semester = null;

    public ExploreViewModel(UniversityRepository repo) {
        this.repo = repo;
    }

    public void loadFaculties() {
        // Subscribe to DB updates
        cd.add(repo.getFaculties()
                .observeOn(AndroidSchedulers.mainThread())
                .subscribe(data -> {
                    _faculties.setValue(data);
                    // If we have data, stop loading
                    if (!data.isEmpty()) _loading.setValue(false);
                }, err -> {}));

        // Trigger network refresh
        _loading.setValue(true);
        cd.add(repo.refreshFaculties()
                .observeOn(AndroidSchedulers.mainThread())
                .doFinally(() -> _loading.setValue(false))
                .subscribe(() -> {}, err -> {
                    // Handle error (maybe show toast via LiveData)
                }));
    }

    public void loadPrograms(Integer facultyId) {
        _loading.setValue(true);
        
        // Subscribe to DB
        cd.add(repo.getPrograms(facultyId)
                .observeOn(AndroidSchedulers.mainThread())
                .subscribe(data -> {
                    _programs.setValue(data);
                    if (!data.isEmpty()) _loading.setValue(false);
                }, err -> {}));

        // Trigger refresh
        cd.add(repo.refreshPrograms(facultyId)
                .observeOn(AndroidSchedulers.mainThread())
                .doFinally(() -> _loading.setValue(false))
                .subscribe(() -> {}, err -> {}));
    }

    public void loadCourseUnits() {
        if (programId == null || year == null || semester == null) return;
        
        _loading.setValue(true);
        
        // Subscribe to DB
        cd.add(repo.getCourseUnits(programId, year, semester)
                .observeOn(AndroidSchedulers.mainThread())
                .subscribe(data -> {
                    _courseUnits.setValue(data);
                    if (!data.isEmpty()) _loading.setValue(false);
                }, err -> {}));

        // Trigger refresh
        cd.add(repo.refreshCourseUnits(programId, year, semester)
                .observeOn(AndroidSchedulers.mainThread())
                .doFinally(() -> _loading.setValue(false))
                .subscribe(() -> {}, err -> {}));
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
