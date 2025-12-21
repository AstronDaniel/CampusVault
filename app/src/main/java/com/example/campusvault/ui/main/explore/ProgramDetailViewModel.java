package com.example.campusvault.ui.main.explore;

import android.app.Application;
import androidx.lifecycle.MutableLiveData;
import androidx.lifecycle.ViewModel;
import com.example.campusvault.data.models.CourseUnit;
import com.example.campusvault.data.repository.UniversityRepository;
import com.example.campusvault.data.sync.NetworkMonitor;
import java.util.List;
import io.reactivex.rxjava3.android.schedulers.AndroidSchedulers;
import io.reactivex.rxjava3.disposables.CompositeDisposable;

public class ProgramDetailViewModel extends ViewModel {
    private final UniversityRepository repository;
    private final NetworkMonitor networkMonitor;
    private final CompositeDisposable disposables = new CompositeDisposable();

    public final MutableLiveData<List<CourseUnit>> courseUnits = new MutableLiveData<>();
    public final MutableLiveData<Boolean> loading = new MutableLiveData<>(false);
    public final MutableLiveData<String> error = new MutableLiveData<>();

    public ProgramDetailViewModel(UniversityRepository repository, Application application) {
        this.repository = repository;
        this.networkMonitor = NetworkMonitor.getInstance(application);
    }

    public void loadCourseUnits(int programId) {
        // Subscribe to local database for reactive updates - instant
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
                        loading.setValue(false);
                        error.setValue(throwable.getMessage());
                    }
                )
        );
        
        // Show loading only if no local data
        if (courseUnits.getValue() == null || courseUnits.getValue().isEmpty()) {
            loading.setValue(true);
        }
        
        // Always refresh from API in background if online
        if (networkMonitor.isOnline()) {
            disposables.add(
                repository.refreshCourseUnits(programId, null, null)
                    .observeOn(AndroidSchedulers.mainThread())
                    .subscribe(
                        () -> loading.setValue(false),
                        throwable -> {
                            loading.setValue(false);
                            error.setValue(throwable.getMessage());
                        }
                    )
            );
        }
    }

    @Override
    protected void onCleared() {
        super.onCleared();
        disposables.clear();
    }
}
