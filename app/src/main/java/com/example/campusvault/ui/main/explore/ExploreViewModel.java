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

    private final MutableLiveData<Boolean> _loading = new MutableLiveData<>();
    public LiveData<Boolean> loading = _loading;

    private Integer programId = null;

    private final MutableLiveData<List<com.example.campusvault.data.models.CourseUnit>> _courseUnits = new MutableLiveData<>();
    public LiveData<List<com.example.campusvault.data.models.CourseUnit>> courseUnits = _courseUnits;

    private Integer year = null;
    private Integer semester = null;

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

    public void loadCourseUnits() {
        if (programId == null || year == null || semester == null) return;
        
        _loading.setValue(true);
        cd.add(api.getCourseUnits(programId, year, semester)
                .subscribeOn(Schedulers.io())
                .observeOn(AndroidSchedulers.mainThread())
                .doFinally(() -> _loading.setValue(false))
                .subscribe(_courseUnits::setValue, err -> {}));
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
