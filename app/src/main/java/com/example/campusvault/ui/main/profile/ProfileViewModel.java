package com.example.campusvault.ui.main.profile;

import android.net.Uri;
import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;
import androidx.lifecycle.ViewModel;
import com.example.campusvault.data.api.ApiService;
import com.example.campusvault.data.local.SharedPreferencesManager;
import com.example.campusvault.data.models.PasswordChangeRequest;
import com.example.campusvault.data.models.Resource;
import com.example.campusvault.data.models.User;
import com.example.campusvault.data.models.UserStats;
import java.io.File;
import java.util.List;
import io.reactivex.rxjava3.android.schedulers.AndroidSchedulers;
import io.reactivex.rxjava3.disposables.CompositeDisposable;
import io.reactivex.rxjava3.schedulers.Schedulers;
import okhttp3.MediaType;
import okhttp3.MultipartBody;
import okhttp3.RequestBody;

public class ProfileViewModel extends ViewModel {
    private final ApiService api;
    private final SharedPreferencesManager spm;
    private final CompositeDisposable cd = new CompositeDisposable();

    private final MutableLiveData<User> _user = new MutableLiveData<>();
    public LiveData<User> user = _user;

    private final MutableLiveData<UserStats> _stats = new MutableLiveData<>();
    public LiveData<UserStats> stats = _stats;

    private final MutableLiveData<List<Resource>> _myResources = new MutableLiveData<>();
    public LiveData<List<Resource>> myResources = _myResources;

    private final MutableLiveData<Boolean> _isLoading = new MutableLiveData<>(false);
    public LiveData<Boolean> isLoading = _isLoading;

    private final MutableLiveData<String> _error = new MutableLiveData<>();
    public LiveData<String> error = _error;

    private final MutableLiveData<String> _successMessage = new MutableLiveData<>();
    public LiveData<String> successMessage = _successMessage;

    private final MutableLiveData<Boolean> _passwordChanged = new MutableLiveData<>();
    public LiveData<Boolean> passwordChanged = _passwordChanged;

    public ProfileViewModel(ApiService api, SharedPreferencesManager spm) {
        this.api = api;
        this.spm = spm;
    }

    public void loadProfile() {
        _isLoading.setValue(true);
        
        cd.add(api.getProfile()
                .subscribeOn(Schedulers.io())
                .observeOn(AndroidSchedulers.mainThread())
                .subscribe(
                    user -> {
                        _user.setValue(user);
                        _isLoading.setValue(false);
                    }, 
                    err -> {
                        _error.setValue("Failed to load profile");
                        _isLoading.setValue(false);
                    }));

        cd.add(api.getUserStats()
                .subscribeOn(Schedulers.io())
                .observeOn(AndroidSchedulers.mainThread())
                .subscribe(_stats::setValue, err -> {}));

        cd.add(api.getMyResources()
                .subscribeOn(Schedulers.io())
                .observeOn(AndroidSchedulers.mainThread())
                .subscribe(_myResources::setValue, err -> {}));
    }

    public void updateProfile(String firstName, String lastName, String username, String email) {
        User currentUser = _user.getValue();
        if (currentUser == null) return;

        _isLoading.setValue(true);
        
        User updatedUser = new User();
        updatedUser.setFirstName(firstName);
        updatedUser.setLastName(lastName);
        updatedUser.setUsername(username);
        updatedUser.setEmail(email);

        cd.add(api.updateProfile(updatedUser)
                .subscribeOn(Schedulers.io())
                .observeOn(AndroidSchedulers.mainThread())
                .subscribe(
                    user -> {
                        _user.setValue(user);
                        _successMessage.setValue("Profile updated successfully");
                        _isLoading.setValue(false);
                    },
                    err -> {
                        _error.setValue("Failed to update profile: " + err.getMessage());
                        _isLoading.setValue(false);
                    }));
    }

    public void changePassword(String oldPassword, String newPassword) {
        _isLoading.setValue(true);
        
        PasswordChangeRequest request = new PasswordChangeRequest(oldPassword, newPassword);
        
        cd.add(api.changePassword(request)
                .subscribeOn(Schedulers.io())
                .observeOn(AndroidSchedulers.mainThread())
                .subscribe(
                    () -> {
                        _passwordChanged.setValue(true);
                        _successMessage.setValue("Password changed successfully");
                        _isLoading.setValue(false);
                    },
                    err -> {
                        _error.setValue("Failed to change password. Please check your current password.");
                        _isLoading.setValue(false);
                    }));
    }

    public void uploadAvatar(File imageFile) {
        _isLoading.setValue(true);
        
        RequestBody requestFile = RequestBody.create(imageFile, MediaType.parse("image/*"));
        MultipartBody.Part filePart = MultipartBody.Part.createFormData("file", imageFile.getName(), requestFile);
        
        cd.add(api.uploadAvatar(filePart)
                .subscribeOn(Schedulers.io())
                .observeOn(AndroidSchedulers.mainThread())
                .subscribe(
                    user -> {
                        _user.setValue(user);
                        _successMessage.setValue("Avatar updated successfully");
                        _isLoading.setValue(false);
                    },
                    err -> {
                        _error.setValue("Failed to upload avatar: " + err.getMessage());
                        _isLoading.setValue(false);
                    }));
    }

    public void clearError() {
        _error.setValue(null);
    }

    public void clearSuccessMessage() {
        _successMessage.setValue(null);
    }

    public void logout() {
        spm.clearAll();
    }

    @Override
    protected void onCleared() {
        cd.clear();
        super.onCleared();
    }
}
