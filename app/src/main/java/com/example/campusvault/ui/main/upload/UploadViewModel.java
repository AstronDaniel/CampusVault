package com.example.campusvault.ui.main.upload;

import android.app.Application;
import android.net.Uri;
import androidx.annotation.NonNull;
import androidx.lifecycle.AndroidViewModel;
import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;
import com.example.campusvault.data.api.ApiService;
import com.example.campusvault.data.models.CourseUnit;
import com.example.campusvault.data.models.DuplicateConflictError;
import com.example.campusvault.data.models.DuplicateResourceInfo;
import com.example.campusvault.data.models.LinkResourceRequest;
import com.example.campusvault.data.models.Resource;
import com.example.campusvault.utils.ProgressRequestBody;
import com.google.gson.Gson;
import io.reactivex.rxjava3.android.schedulers.AndroidSchedulers;
import io.reactivex.rxjava3.disposables.CompositeDisposable;
import io.reactivex.rxjava3.disposables.Disposable;
import io.reactivex.rxjava3.schedulers.Schedulers;
import retrofit2.HttpException;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.util.Collections;
import java.util.List;
import okhttp3.MediaType;
import okhttp3.MultipartBody;
import okhttp3.RequestBody;

public class UploadViewModel extends AndroidViewModel {
    
    // Maximum upload size in MB (should match backend setting)
    public static final int MAX_UPLOAD_SIZE_MB = 50;
    
    private final ApiService api;
    private final CompositeDisposable cd = new CompositeDisposable();
    private Disposable currentUploadDisposable;

    // Course units
    private final MutableLiveData<List<CourseUnit>> _courseUnits = new MutableLiveData<>();
    public LiveData<List<CourseUnit>> courseUnits = _courseUnits;

    // Upload result
    private final MutableLiveData<Resource> _uploaded = new MutableLiveData<>();
    public LiveData<Resource> uploaded = _uploaded;

    // Upload progress (0-100)
    private final MutableLiveData<Integer> _uploadProgress = new MutableLiveData<>();
    public LiveData<Integer> uploadProgress = _uploadProgress;

    // Upload speed in KB/s
    private final MutableLiveData<Double> _uploadSpeed = new MutableLiveData<>();
    public LiveData<Double> uploadSpeed = _uploadSpeed;

    // Estimated time remaining in seconds
    private final MutableLiveData<Long> _etaSeconds = new MutableLiveData<>();
    public LiveData<Long> etaSeconds = _etaSeconds;

    // Upload state: idle, uploading, success, error, cancelled, duplicate_found
    private final MutableLiveData<UploadState> _uploadState = new MutableLiveData<>(UploadState.IDLE);
    public LiveData<UploadState> uploadState = _uploadState;

    // Error message
    private final MutableLiveData<String> _errorMessage = new MutableLiveData<>();
    public LiveData<String> errorMessage = _errorMessage;

    // Duplicate detection - when a duplicate is found, this holds the existing resource info
    private final MutableLiveData<DuplicateResourceInfo> _duplicateFound = new MutableLiveData<>();
    public LiveData<DuplicateResourceInfo> duplicateFound = _duplicateFound;

    // File validation error
    private final MutableLiveData<String> _fileValidationError = new MutableLiveData<>();
    public LiveData<String> fileValidationError = _fileValidationError;

    // For tracking upload progress
    private long totalBytes = 0;

    public enum UploadState {
        IDLE,
        UPLOADING,
        SUCCESS,
        ERROR,
        CANCELLED,
        DUPLICATE_FOUND
    }

    public UploadViewModel(@NonNull Application application, ApiService api) {
        super(application);
        this.api = api;
    }

    public void loadCourseUnits(Integer programId, Integer year, Integer semester) {
        cd.add(api.getCourseUnits(programId, year, semester)
                .subscribeOn(Schedulers.io())
                .observeOn(AndroidSchedulers.mainThread())
                .subscribe(
                    _courseUnits::setValue, 
                    err -> _courseUnits.setValue(Collections.emptyList())
                ));
    }

    /**
     * Validates file before upload.
     * @return true if valid, false otherwise (error message set in _fileValidationError)
     */
    public boolean validateFile(long sizeBytes) {
        _fileValidationError.setValue(null);
        
        long maxBytes = MAX_UPLOAD_SIZE_MB * 1024L * 1024L;
        if (sizeBytes > maxBytes) {
            String error = String.format(
                "File too large (%.1f MB). Maximum allowed is %d MB.",
                sizeBytes / (1024.0 * 1024.0),
                MAX_UPLOAD_SIZE_MB
            );
            _fileValidationError.setValue(error);
            return false;
        }
        
        if (sizeBytes == 0) {
            _fileValidationError.setValue("File appears to be empty.");
            return false;
        }
        
        return true;
    }

    /**
     * Main upload method with resource type support
     */
    public void uploadFile(Uri fileUri, String title, String description, int courseUnitId, String resourceType) {
        try {
            _uploadState.setValue(UploadState.UPLOADING);
            _uploadProgress.setValue(0);
            _errorMessage.setValue(null);
            
            InputStream inputStream = getApplication().getContentResolver().openInputStream(fileUri);
            File file = new File(getApplication().getCacheDir(), "upload_" + System.currentTimeMillis() + ".tmp");
            FileOutputStream outputStream = new FileOutputStream(file);
            byte[] buffer = new byte[8192];
            int read;
            while ((read = inputStream.read(buffer)) != -1) {
                outputStream.write(buffer, 0, read);
            }
            inputStream.close();
            outputStream.close();

            totalBytes = file.length();

            // Get original filename from URI
            String fileName = getFileNameFromUri(fileUri);
            
            // Detect content type
            String contentType = getApplication().getContentResolver().getType(fileUri);
            if (contentType == null) contentType = "application/octet-stream";

            ProgressRequestBody fileBody = new ProgressRequestBody(file, contentType, (progress, speed) -> {
                _uploadProgress.postValue(progress);
                _uploadSpeed.postValue(speed);
                
                // Calculate ETA
                if (speed > 0 && progress < 100) {
                    long remainingBytes = totalBytes - (totalBytes * progress / 100);
                    long etaSec = (long) (remainingBytes / (speed * 1024));
                    _etaSeconds.postValue(etaSec);
                } else {
                    _etaSeconds.postValue(0L);
                }
            });

            MultipartBody.Part filePart = MultipartBody.Part.createFormData("file", fileName, fileBody);
            RequestBody titlePart = RequestBody.create(MediaType.parse("text/plain"), title != null ? title : "");
            RequestBody descriptionPart = RequestBody.create(MediaType.parse("text/plain"), description != null ? description : "");
            RequestBody courseUnitPart = RequestBody.create(MediaType.parse("text/plain"), String.valueOf(courseUnitId));
            RequestBody resourceTypePart = RequestBody.create(MediaType.parse("text/plain"), resourceType != null ? resourceType : "notes");

            android.util.Log.d("UploadViewModel", "Starting upload: file=" + fileName + ", courseUnitId=" + courseUnitId + ", type=" + resourceType);

            currentUploadDisposable = api.uploadResource(filePart, titlePart, descriptionPart, courseUnitPart, resourceTypePart)
                    .subscribeOn(Schedulers.io())
                    .observeOn(AndroidSchedulers.mainThread())
                    .doFinally(() -> {
                        // Cleanup temp file
                        if (file.exists()) file.delete();
                    })
                    .subscribe(
                        resource -> {
                            _uploadState.setValue(UploadState.SUCCESS);
                            _uploaded.setValue(resource);
                        },
                        this::handleUploadError
                    );
            
            cd.add(currentUploadDisposable);

        } catch (Exception e) {
            _uploadState.setValue(UploadState.ERROR);
            _errorMessage.setValue("Failed to prepare file: " + e.getMessage());
        }
    }

    /**
     * Cancel the current upload
     */
    public void cancelUpload() {
        if (currentUploadDisposable != null && !currentUploadDisposable.isDisposed()) {
            currentUploadDisposable.dispose();
            _uploadState.setValue(UploadState.CANCELLED);
            _uploadProgress.setValue(0);
            _errorMessage.setValue("Upload cancelled");
        }
    }

    /**
     * Link an existing resource to a different course unit (no re-upload needed)
     */
    public void linkExistingResource(int existingResourceId, int courseUnitId, String title, String description) {
        _uploadState.setValue(UploadState.UPLOADING);
        
        LinkResourceRequest request = new LinkResourceRequest(courseUnitId, title, description);
        
        cd.add(api.linkResource(existingResourceId, request)
                .subscribeOn(Schedulers.io())
                .observeOn(AndroidSchedulers.mainThread())
                .subscribe(
                    resource -> {
                        _uploadState.setValue(UploadState.SUCCESS);
                        _uploaded.setValue(resource);
                    },
                    error -> {
                        _uploadState.setValue(UploadState.ERROR);
                        _errorMessage.setValue("Failed to link resource: " + error.getMessage());
                    }
                ));
    }

    /**
     * Handle upload errors including 409 Conflict (duplicate)
     */
    private void handleUploadError(Throwable error) {
        android.util.Log.e("UploadViewModel", "Upload error: " + error.getClass().getSimpleName() + " - " + error.getMessage());
        
        if (error instanceof HttpException) {
            HttpException httpError = (HttpException) error;
            android.util.Log.e("UploadViewModel", "HTTP Error Code: " + httpError.code());
            
            if (httpError.code() == 409) {
                // Duplicate content detected
                try {
                    String errorBody = httpError.response().errorBody().string();
                    Gson gson = new Gson();
                    // The backend returns {"detail": {"message": "...", "resource": {...}}}
                    // We need to parse the detail field
                    DuplicateConflictError conflictError = gson.fromJson(errorBody, DuplicateConflictError.class);
                    
                    if (conflictError != null && conflictError.getResource() != null) {
                        _duplicateFound.setValue(conflictError.getResource());
                        _uploadState.setValue(UploadState.DUPLICATE_FOUND);
                        _errorMessage.setValue("This file already exists");
                        return;
                    }
                } catch (Exception e) {
                    // Failed to parse duplicate info, try alternative parsing
                    try {
                        String errorBody = httpError.response().errorBody().string();
                        // Try parsing as FastAPI detail format
                        if (errorBody.contains("Duplicate content detected")) {
                            _uploadState.setValue(UploadState.DUPLICATE_FOUND);
                            _errorMessage.setValue("This file already exists in the system");
                            return;
                        }
                    } catch (Exception ignored) {}
                }
            }
            
            // Try to get the actual error message from the server
            String serverMessage = null;
            try {
                if (httpError.response() != null && httpError.response().errorBody() != null) {
                    String errorBody = httpError.response().errorBody().string();
                    android.util.Log.e("UploadViewModel", "Server error body: " + errorBody);
                    // Try to parse FastAPI error format: {"detail": "message"}
                    if (errorBody.contains("detail")) {
                        Gson gson = new Gson();
                        java.util.Map<String, Object> errorMap = gson.fromJson(errorBody, java.util.Map.class);
                        Object detail = errorMap.get("detail");
                        if (detail instanceof String) {
                            serverMessage = (String) detail;
                        }
                    }
                }
            } catch (Exception e) {
                android.util.Log.e("UploadViewModel", "Failed to parse error body", e);
            }
            
            // Handle HTTP errors with server message or fallback
            String message;
            switch (httpError.code()) {
                case 400:
                    message = serverMessage != null ? serverMessage : "Invalid request. Please check your input.";
                    break;
                case 401:
                    message = "Session expired (401). Please login again.";
                    break;
                case 403:
                    message = serverMessage != null ? serverMessage : "Access denied (403). You may not have permission for this action.";
                    break;
                case 413:
                    message = "File too large for server.";
                    break;
                case 500:
                    message = serverMessage != null ? serverMessage : "Server error. Please try again later.";
                    break;
                default:
                    message = serverMessage != null ? serverMessage : "Upload failed (Error " + httpError.code() + ")";
            }
            android.util.Log.e("UploadViewModel", "Upload error: " + httpError.code() + " - " + message);
            _errorMessage.setValue(message);
        } else {
            _errorMessage.setValue("Network error: " + error.getMessage());
        }
        
        _uploadState.setValue(UploadState.ERROR);
    }

    /**
     * Reset upload state for a new upload
     */
    public void resetUploadState() {
        _uploadState.setValue(UploadState.IDLE);
        _uploadProgress.setValue(0);
        _uploadSpeed.setValue(0.0);
        _etaSeconds.setValue(0L);
        _errorMessage.setValue(null);
        _duplicateFound.setValue(null);
        _uploaded.setValue(null);
        _fileValidationError.setValue(null);
    }

    /**
     * Get filename from content URI
     */
    private String getFileNameFromUri(Uri uri) {
        String result = null;
        if ("content".equals(uri.getScheme())) {
            try (android.database.Cursor cursor = getApplication().getContentResolver()
                    .query(uri, null, null, null, null)) {
                if (cursor != null && cursor.moveToFirst()) {
                    int nameIndex = cursor.getColumnIndex(android.provider.OpenableColumns.DISPLAY_NAME);
                    if (nameIndex != -1) {
                        result = cursor.getString(nameIndex);
                    }
                }
            } catch (Exception e) {
                // Ignore
            }
        }
        if (result == null) {
            result = uri.getLastPathSegment();
        }
        return result != null ? result : "upload_file";
    }

    /**
     * Format ETA for display
     */
    public static String formatEta(long seconds) {
        if (seconds <= 0) return "";
        if (seconds < 60) return seconds + "s remaining";
        if (seconds < 3600) return (seconds / 60) + "m " + (seconds % 60) + "s remaining";
        return (seconds / 3600) + "h " + ((seconds % 3600) / 60) + "m remaining";
    }

    @Override
    protected void onCleared() {
        cd.clear();
        super.onCleared();
    }
}
