package com.example.campusvault.ui.main.home;

import android.app.Application;
import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;
import com.example.campusvault.data.api.ApiService;
import com.example.campusvault.data.models.CourseUnit;
import com.example.campusvault.data.models.PaginatedResponse;
import com.example.campusvault.data.models.Resource;
import com.example.campusvault.data.repository.ResourceRepository;
import com.example.campusvault.data.repository.UniversityRepository;
import com.example.campusvault.data.sync.NetworkMonitor;
import com.example.campusvault.ui.base.BaseViewModel;
import java.util.List;
import io.reactivex.rxjava3.android.schedulers.AndroidSchedulers;
import io.reactivex.rxjava3.disposables.CompositeDisposable;
import io.reactivex.rxjava3.disposables.Disposable;
import io.reactivex.rxjava3.schedulers.Schedulers;

public class DashboardViewModel extends BaseViewModel {

    private final ResourceRepository resourceRepo;
    private final UniversityRepository universityRepo;
    private final ApiService apiService;
    private final NetworkMonitor networkMonitor;
    private final CompositeDisposable disposables = new CompositeDisposable();
    private Disposable courseUnitsDisposable;
    
    // Track if data already loaded this session
    private boolean trendingLoaded = false;
    private boolean recentLoaded = false;

    private final MutableLiveData<List<Resource>> _trending = new MutableLiveData<>();
    public final LiveData<List<Resource>> trending = _trending;

    private final MutableLiveData<List<Resource>> _recent = new MutableLiveData<>();
    public final LiveData<List<Resource>> recent = _recent;

    private final MutableLiveData<List<CourseUnit>> _courseUnits = new MutableLiveData<>();
    public final LiveData<List<CourseUnit>> courseUnits = _courseUnits;

    public DashboardViewModel(ResourceRepository resourceRepo, UniversityRepository universityRepo, ApiService apiService, Application application) {
        this.resourceRepo = resourceRepo;
        this.universityRepo = universityRepo;
        this.apiService = apiService;
        this.networkMonitor = NetworkMonitor.getInstance(application);
    }

    public void loadTrending() {
        // Subscribe to DB - instant local data
        Disposable d = resourceRepo.getTrendingResources()
            .observeOn(AndroidSchedulers.mainThread())
            .subscribe(
                data -> {
                    _trending.postValue(data);
                    if (!data.isEmpty()) {
                        setLoading(false);
                    }
                },
                err -> {}
            );
        disposables.add(d);

        if (_trending.getValue() == null || _trending.getValue().isEmpty()) {
            setLoading(true);
        }
        
        // Always refresh from API in background if online and not already loaded
        if (!trendingLoaded && networkMonitor.isOnline()) {
            trendingLoaded = true;
            d = resourceRepo.refreshTrendingResources()
                .observeOn(AndroidSchedulers.mainThread())
                .subscribe(
                    () -> setLoading(false),
                    throwable -> {
                        setLoading(false);
                        handleException(throwable);
                    }
                );
            disposables.add(d);
        }
    }
    
    /**
     * Force refresh trending (e.g., pull-to-refresh)
     */
    public void forceRefreshTrending() {
        if (networkMonitor.isOnline()) {
            setLoading(true);
            Disposable d = resourceRepo.refreshTrendingResources()
                .observeOn(AndroidSchedulers.mainThread())
                .subscribe(
                    () -> setLoading(false),
                    throwable -> {
                        setLoading(false);
                        handleException(throwable);
                    }
                );
            disposables.add(d);
        }
    }

    public void loadRecent() {
        // Subscribe to DB - instant local data
        Disposable d = resourceRepo.getRecentResources()
            .observeOn(AndroidSchedulers.mainThread())
            .subscribe(
                data -> {
                    _recent.postValue(data);
                    if (!data.isEmpty()) {
                        setLoading(false);
                    }
                },
                err -> {}
            );
        disposables.add(d);

        if (_recent.getValue() == null || _recent.getValue().isEmpty()) {
            setLoading(true);
        }
        
        // Always refresh from API in background if online and not already loaded
        if (!recentLoaded && networkMonitor.isOnline()) {
            recentLoaded = true;
            d = resourceRepo.refreshRecentResources()
                .observeOn(AndroidSchedulers.mainThread())
                .subscribe(
                    () -> setLoading(false),
                    throwable -> {
                        setLoading(false);
                        handleException(throwable);
                    }
                );
            disposables.add(d);
        }
    }
    
    /**
     * Force refresh recent (e.g., pull-to-refresh)
     */
    public void forceRefreshRecent() {
        if (networkMonitor.isOnline()) {
            setLoading(true);
            Disposable d = resourceRepo.refreshRecentResources()
                .observeOn(AndroidSchedulers.mainThread())
                .subscribe(
                    () -> setLoading(false),
                    throwable -> {
                        setLoading(false);
                        handleException(throwable);
                    }
                );
            disposables.add(d);
        }
    }

    public void loadCourseUnits(Integer programId, Integer year, Integer semester) {
        // Cancel previous subscription
        if (courseUnitsDisposable != null && !courseUnitsDisposable.isDisposed()) {
            courseUnitsDisposable.dispose();
            disposables.remove(courseUnitsDisposable);
        }

        // Subscribe to DB - instant local data
        courseUnitsDisposable = universityRepo.getCourseUnits(programId, year, semester)
            .observeOn(AndroidSchedulers.mainThread())
            .subscribe(
                data -> {
                    _courseUnits.postValue(data);
                    if (!data.isEmpty()) {
                        setLoading(false);
                    }
                    
                    // Only refresh from API if data is empty and online
                    if (data.isEmpty() && networkMonitor.isOnline()) {
                        refreshCourseUnitsFromApi(programId, year, semester);
                    }
                },
                err -> {}
            );
        disposables.add(courseUnitsDisposable);

        if (_courseUnits.getValue() == null || _courseUnits.getValue().isEmpty()) {
            setLoading(true);
        }
    }
    
    private void refreshCourseUnitsFromApi(Integer programId, Integer year, Integer semester) {
        Disposable d = universityRepo.refreshCourseUnits(programId, year, semester)
            .observeOn(AndroidSchedulers.mainThread())
            .subscribe(
                () -> setLoading(false),
                throwable -> {
                    setLoading(false);
                    handleException(throwable);
                }
            );
        disposables.add(d);
    }

    public void search(String query) {
        if (query == null || query.trim().isEmpty()) {
            return;
        }

        setLoading(true);

        // Cancel previous subscription
        if (courseUnitsDisposable != null && !courseUnitsDisposable.isDisposed()) {
            courseUnitsDisposable.dispose();
            disposables.remove(courseUnitsDisposable);
        }

        courseUnitsDisposable = universityRepo.searchCourseUnits(query)
            .observeOn(AndroidSchedulers.mainThread())
            .subscribe(
                data -> {
                    _courseUnits.postValue(data);
                    setLoading(false);
                },
                err -> {
                    setLoading(false);
                    handleException(err);
                }
            );
        disposables.add(courseUnitsDisposable);
    }

    public void loadCurrentUser(UserCallback callback) {
        Disposable d = apiService.getProfile()
            .subscribeOn(Schedulers.io())
            .observeOn(AndroidSchedulers.mainThread())
            .subscribe(
                user -> {
                    if (callback != null) callback.onUserLoaded(user);
                },
                throwable -> {
                    handleException(throwable);
                    if (callback != null) callback.onUserLoaded(null);
                }
            );
        disposables.add(d);
    }
    
    public void loadProgram(int programId, ProgramCallback callback) {
        Disposable d = apiService.getProgramById(programId)
            .subscribeOn(Schedulers.io())
            .observeOn(AndroidSchedulers.mainThread())
            .subscribe(
                program -> {
                    if (callback != null) callback.onProgramLoaded(program);
                },
                throwable -> {
                    handleException(throwable);
                    if (callback != null) callback.onProgramLoaded(null);
                }
            );
        disposables.add(d);
    }
    
    public void loadFaculty(int facultyId, FacultyCallback callback) {
        Disposable d = apiService.getFacultyById(facultyId)
            .subscribeOn(Schedulers.io())
            .observeOn(AndroidSchedulers.mainThread())
            .subscribe(
                faculty -> {
                    if (callback != null) callback.onFacultyLoaded(faculty);
                },
                throwable -> {
                    handleException(throwable);
                    if (callback != null) callback.onFacultyLoaded(null);
                }
            );
        disposables.add(d);
    }
    
    // Callback interfaces
    public interface UserCallback {
        void onUserLoaded(com.example.campusvault.data.models.User user);
    }
    
    public interface ProgramCallback {
        void onProgramLoaded(com.example.campusvault.data.models.ProgramResponse program);
    }
    
    public interface FacultyCallback {
        void onFacultyLoaded(com.example.campusvault.data.models.FacultyResponse faculty);
    }

    @Override
    protected void onCleared() {
        super.onCleared();
        disposables.clear();
    }
}
