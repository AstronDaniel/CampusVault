package com.example.campusvault.ui.main.explore;

import androidx.lifecycle.MutableLiveData;
import androidx.lifecycle.ViewModel;
import com.example.campusvault.data.models.CourseUnit;
import com.example.campusvault.data.repository.UniversityRepository;
import java.util.List;
import io.reactivex.rxjava3.android.schedulers.AndroidSchedulers;
import io.reactivex.rxjava3.disposables.CompositeDisposable;

public class ProgramDetailViewModel extends ViewModel {
    private final UniversityRepository repository;
    private final CompositeDisposable disposables = new CompositeDisposable();

    public final MutableLiveData<List<CourseUnit>> courseUnits = new MutableLiveData<>();
    public final MutableLiveData<Boolean> loading = new MutableLiveData<>(false);
    public final MutableLiveData<String> error = new MutableLiveData<>();

    public ProgramDetailViewModel(UniversityRepository repository) {
        this.repository = repository;
    }

    public void loadCourseUnits(int programId) {
        loading.setValue(true);
        
        // Subscribe to local database for reactive updates
        disposables.add(
            repository.getCourseUnits(programId, null, null)
                .observeOn(AndroidSchedulers.mainThread())
                .subscribe(
                    units -> {
                        courseUnits.setValue(units);
                        if (!units.isEmpty()) {
                            loading.setValue(false);
                        }
                    },
                    throwable -> {
                        error.setValue(throwable.getMessage());
                    }
                )
        );
        
        // Refresh from API to get all course units
        disposables.add(
            repository.refreshCourseUnits(programId, null, null)
                .observeOn(AndroidSchedulers.mainThread())
                .subscribe(
                    () -> {},
                    throwable -> {
                        loading.setValue(false);
                        error.setValue(throwable.getMessage());
                    }
                )
        );
    }

    @Override
    protected void onCleared() {
        super.onCleared();
        disposables.clear();
    }
}
