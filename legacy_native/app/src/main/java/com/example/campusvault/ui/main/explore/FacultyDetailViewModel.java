package com.example.campusvault.ui.main.explore;

import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;
import androidx.lifecycle.ViewModel;
import com.example.campusvault.data.models.CourseUnit;
import com.example.campusvault.data.models.ProgramResponse;
import com.example.campusvault.data.repository.UniversityRepository;
import io.reactivex.rxjava3.android.schedulers.AndroidSchedulers;
import io.reactivex.rxjava3.disposables.CompositeDisposable;
import java.util.ArrayList;
import java.util.List;

public class FacultyDetailViewModel extends ViewModel {
    private final UniversityRepository repo;
    private final CompositeDisposable cd = new CompositeDisposable();

    private final MutableLiveData<List<ProgramResponse>> _programs = new MutableLiveData<>();
    public LiveData<List<ProgramResponse>> programs = _programs;

    private final MutableLiveData<List<CourseUnit>> _courseUnits = new MutableLiveData<>();
    public LiveData<List<CourseUnit>> courseUnits = _courseUnits;

    private final MutableLiveData<Boolean> _loading = new MutableLiveData<>();
    public LiveData<Boolean> loading = _loading;

    private Integer facultyId = null;

    public FacultyDetailViewModel(UniversityRepository repo) {
        this.repo = repo;
    }

    public void loadPrograms(Integer facultyId) {
        this.facultyId = facultyId;
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

    public void loadAllCourseUnitsForFaculty(Integer facultyId) {
        // Load all course units for all programs in this faculty
        // We'll aggregate them as programs come in
        cd.add(repo.getPrograms(facultyId)
                .observeOn(AndroidSchedulers.mainThread())
                .subscribe(programs -> {
                    if (programs != null && !programs.isEmpty()) {
                        loadCourseUnitsForPrograms(programs);
                    }
                }, err -> {}));
    }

    private void loadCourseUnitsForPrograms(List<ProgramResponse> programs) {
        List<CourseUnit> allUnits = new ArrayList<>();
        
        for (ProgramResponse program : programs) {
            // Load course units for each program
            cd.add(repo.getCourseUnits(program.getId(), null, null)
                    .observeOn(AndroidSchedulers.mainThread())
                    .subscribe(units -> {
                        if (units != null) {
                            // Add unique units
                            for (CourseUnit unit : units) {
                                boolean exists = false;
                                for (CourseUnit existing : allUnits) {
                                    if (existing.getId() == unit.getId()) {
                                        exists = true;
                                        break;
                                    }
                                }
                                if (!exists) {
                                    allUnits.add(unit);
                                }
                            }
                            _courseUnits.setValue(new ArrayList<>(allUnits));
                        }
                    }, err -> {}));

            // Refresh from network
            cd.add(repo.refreshCourseUnits(program.getId(), null, null)
                    .observeOn(AndroidSchedulers.mainThread())
                    .subscribe(() -> {}, err -> {}));
        }
    }

    public void loadCourseUnitsForProgram(Integer programId) {
        _loading.setValue(true);

        cd.add(repo.getCourseUnits(programId, null, null)
                .observeOn(AndroidSchedulers.mainThread())
                .subscribe(data -> {
                    _courseUnits.setValue(data);
                    _loading.setValue(false);
                }, err -> _loading.setValue(false)));

        cd.add(repo.refreshCourseUnits(programId, null, null)
                .observeOn(AndroidSchedulers.mainThread())
                .doFinally(() -> _loading.setValue(false))
                .subscribe(() -> {}, err -> {}));
    }

    @Override
    protected void onCleared() {
        cd.clear();
        super.onCleared();
    }
}
