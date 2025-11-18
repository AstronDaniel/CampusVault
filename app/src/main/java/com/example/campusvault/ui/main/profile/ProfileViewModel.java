package com.example.campusvault.ui.main.profile;

import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;
import androidx.lifecycle.ViewModel;
import com.example.campusvault.data.api.ApiService;
import com.example.campusvault.data.local.SharedPreferencesManager;
import com.example.campusvault.data.models.Resource;
import com.example.campusvault.data.models.User;
import com.example.campusvault.data.models.UserStats;
import java.util.List;
import io.reactivex.rxjava3.android.schedulers.AndroidSchedulers;
import io.reactivex.rxjava3.disposables.CompositeDisposable;
import io.reactivex.rxjava3.schedulers.Schedulers;

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

    public ProfileViewModel(ApiService api, SharedPreferencesManager spm) {
        this.api = api;
        this.spm = spm;
    }

    public void loadProfile() {
        cd.add(api.getProfile()
                .subscribeOn(Schedulers.io())
                .observeOn(AndroidSchedulers.mainThread())
                .subscribe(_user::setValue, err -> {}));

        cd.add(api.getUserStats()
                .subscribeOn(Schedulers.io())
                .observeOn(AndroidSchedulers.mainThread())
                .subscribe(_stats::setValue, err -> {}));

        cd.add(api.getMyResources()
                .subscribeOn(Schedulers.io())
                .observeOn(AndroidSchedulers.mainThread())
                .subscribe(_myResources::setValue, err -> {}));
    }

    public void updateProfile(String firstName, String lastName, String email) {
        User currentUser = _user.getValue();
        if (currentUser == null) return;

        currentUser.setFirstName(firstName);
        currentUser.setLastName(lastName);
        currentUser.setEmail(email);

        cd.add(api.updateProfile(currentUser)
                .subscribeOn(Schedulers.io())
                .observeOn(AndroidSchedulers.mainThread())
                .subscribe(_user::setValue, err -> {}));
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
