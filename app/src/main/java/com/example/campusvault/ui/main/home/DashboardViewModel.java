package com.example.campusvault.ui.main.home;

import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;
import com.example.campusvault.data.api.ApiService;
import com.example.campusvault.data.models.CourseUnit;
import com.example.campusvault.data.models.PaginatedResponse;
import com.example.campusvault.data.models.Resource;
import com.example.campusvault.ui.base.BaseViewModel;
import java.util.List;
import io.reactivex.rxjava3.android.schedulers.AndroidSchedulers;
import io.reactivex.rxjava3.disposables.CompositeDisposable;
import io.reactivex.rxjava3.disposables.Disposable;
import io.reactivex.rxjava3.schedulers.Schedulers;

public class DashboardViewModel extends BaseViewModel {

    private final ApiService apiService;
    private final CompositeDisposable disposables = new CompositeDisposable();

    private final MutableLiveData<List<Resource>> _trending = new MutableLiveData<>();
    public final LiveData<List<Resource>> trending = _trending;

    private final MutableLiveData<List<Resource>> _recent = new MutableLiveData<>();
    public final LiveData<List<Resource>> recent = _recent;

    private final MutableLiveData<List<CourseUnit>> _courseUnits = new MutableLiveData<>();
    public final LiveData<List<CourseUnit>> courseUnits = _courseUnits;

    public DashboardViewModel(ApiService apiService) {
        this.apiService = apiService;
    }

    public void loadTrending() {
        setLoading(true);
        Disposable d = apiService.getTrendingResources(1, 10)
            .subscribeOn(Schedulers.io())
            .observeOn(AndroidSchedulers.mainThread())
            .subscribe(
                (PaginatedResponse<Resource> resp) -> {
                    _trending.postValue(resp.getItems());
                    setLoading(false);
                },
                throwable -> {
                    setLoading(false);
                    // Post empty list so dummy data can be loaded
                    _trending.postValue(new java.util.ArrayList<>());
                    handleException(throwable);
                }
            );
        disposables.add(d);
    }

    public void loadRecent() {
        setLoading(true);
        Disposable d = apiService.getRecentResources(1, 12)
            .subscribeOn(Schedulers.io())
            .observeOn(AndroidSchedulers.mainThread())
            .subscribe(
                (PaginatedResponse<Resource> resp) -> {
                    _recent.postValue(resp.getItems());
                    setLoading(false);
                },
                throwable -> {
                    setLoading(false);
                    // Post empty list so dummy data can be loaded
                    _recent.postValue(new java.util.ArrayList<>());
                    handleException(throwable);
                }
            );
        disposables.add(d);
    }

    public void loadCourseUnits(Integer programId, Integer year, Integer semester) {
        setLoading(true);
        Disposable d = apiService.getCourseUnits(programId, year, semester)
            .subscribeOn(Schedulers.io())
            .observeOn(AndroidSchedulers.mainThread())
            .subscribe(
                list -> {
                    _courseUnits.postValue(list);
                    setLoading(false);
                },
                throwable -> {
                    setLoading(false);
                    // Post empty list so dummy data can be loaded
                    _courseUnits.postValue(new java.util.ArrayList<>());
                    handleException(throwable);
                }
            );
        disposables.add(d);
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
