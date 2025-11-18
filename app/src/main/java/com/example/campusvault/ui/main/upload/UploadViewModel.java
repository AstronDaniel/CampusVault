package com.example.campusvault.ui.main.upload;

import android.app.Application;
import android.net.Uri;
import androidx.annotation.NonNull;
import androidx.lifecycle.AndroidViewModel;
import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;
import com.example.campusvault.data.api.ApiService;
import com.example.campusvault.data.models.CourseUnit;
import com.example.campusvault.data.models.Resource;
import com.example.campusvault.utils.ProgressRequestBody;
import io.reactivex.rxjava3.android.schedulers.AndroidSchedulers;
import io.reactivex.rxjava3.disposables.CompositeDisposable;
import io.reactivex.rxjava3.schedulers.Schedulers;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.util.List;
import okhttp3.MediaType;
import okhttp3.MultipartBody;
import okhttp3.RequestBody;

public class UploadViewModel extends AndroidViewModel {
    private final ApiService api;
    private final CompositeDisposable cd = new CompositeDisposable();

    private final MutableLiveData<List<CourseUnit>> _courseUnits = new MutableLiveData<>();
    public LiveData<List<CourseUnit>> courseUnits = _courseUnits;

    private final MutableLiveData<Resource> _uploaded = new MutableLiveData<>();
    public LiveData<Resource> uploaded = _uploaded;

    private final MutableLiveData<Integer> _uploadProgress = new MutableLiveData<>();
    public LiveData<Integer> uploadProgress = _uploadProgress;

    private final MutableLiveData<Double> _uploadSpeed = new MutableLiveData<>();
    public LiveData<Double> uploadSpeed = _uploadSpeed;

    public UploadViewModel(@NonNull Application application, ApiService api) {
        super(application);
        this.api = api;
    }

    public void loadCourseUnits(Integer programId, Integer year, Integer semester) {
        cd.add(api.getCourseUnits(programId, year, semester)
                .subscribeOn(Schedulers.io())
                .observeOn(AndroidSchedulers.mainThread())
                .subscribe(_courseUnits::setValue, err -> _courseUnits.setValue(java.util.Collections.emptyList())));
    }

    public void uploadFile(Uri fileUri, String title, String description, int courseUnitId) {
        try {
            InputStream inputStream = getApplication().getContentResolver().openInputStream(fileUri);
            File file = new File(getApplication().getCacheDir(), "upload.tmp");
            FileOutputStream outputStream = new FileOutputStream(file);
            byte[] buffer = new byte[1024];
            int read;
            while ((read = inputStream.read(buffer)) != -1) {
                outputStream.write(buffer, 0, read);
            }
            inputStream.close();
            outputStream.close();

            ProgressRequestBody fileBody = new ProgressRequestBody(file, "application/octet-stream", (progress, speed) -> {
                _uploadProgress.postValue(progress);
                _uploadSpeed.postValue(speed);
            });

            MultipartBody.Part filePart = MultipartBody.Part.createFormData("file", file.getName(), fileBody);
            RequestBody titlePart = RequestBody.create(MediaType.parse("text/plain"), title);
            RequestBody descriptionPart = RequestBody.create(MediaType.parse("text/plain"), description);
            RequestBody courseUnitPart = RequestBody.create(MediaType.parse("text/plain"), String.valueOf(courseUnitId));

            cd.add(api.uploadResource(filePart, titlePart, descriptionPart, courseUnitPart, null)
                    .subscribeOn(Schedulers.io())
                    .observeOn(AndroidSchedulers.mainThread())
                    .subscribe(_uploaded::setValue, err -> _uploaded.setValue(null)));
        } catch (Exception e) {
            _uploaded.setValue(null);
        }
    }

    @Override
    protected void onCleared() {
        cd.clear();
        super.onCleared();
    }
}
