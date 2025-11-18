package com.example.campusvault.ui.main.upload;

import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;
import androidx.lifecycle.ViewModel;

import com.example.campusvault.data.api.ApiService;
import com.example.campusvault.data.models.CourseUnit;
import com.example.campusvault.data.models.Resource;

import java.util.List;

import io.reactivex.rxjava3.android.schedulers.AndroidSchedulers;
import io.reactivex.rxjava3.disposables.CompositeDisposable;
import io.reactivex.rxjava3.schedulers.Schedulers;
import okhttp3.MultipartBody;
import okhttp3.RequestBody;

public class UploadViewModel extends ViewModel {
    private final ApiService api;
    private final CompositeDisposable cd = new CompositeDisposable();

    private final MutableLiveData<List<CourseUnit>> _courseUnits = new MutableLiveData<>();
    public LiveData<List<CourseUnit>> courseUnits = _courseUnits;

    private final MutableLiveData<Resource> _uploaded = new MutableLiveData<>();
    public LiveData<Resource> uploaded = _uploaded;

    public UploadViewModel(ApiService api) { this.api = api; }

    public void loadCourseUnits(Integer programId, Integer year, Integer semester) {
        cd.add(api.getCourseUnits(programId, year, semester)
                .subscribeOn(Schedulers.io())
                .observeOn(AndroidSchedulers.mainThread())
                .subscribe(_courseUnits::setValue, err -> _courseUnits.setValue(java.util.Collections.emptyList())));
    }

    public void upload(MultipartBody.Part filePart, RequestBody title, RequestBody description, RequestBody courseUnitId, RequestBody tags) {
        cd.add(api.uploadResource(filePart, title, description, courseUnitId, tags)
                .subscribeOn(Schedulers.io())
                .observeOn(AndroidSchedulers.mainThread())
                .subscribe(_uploaded::setValue, err -> _uploaded.setValue(null)));
    }

    @Override
    protected void onCleared() {
        cd.clear();
        super.onCleared();
    }
}
