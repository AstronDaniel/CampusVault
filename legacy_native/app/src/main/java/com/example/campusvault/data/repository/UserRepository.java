package com.example.campusvault.data.repository;

import android.app.Application;
import android.content.Context;
import android.util.Log;
import com.example.campusvault.data.api.ApiService;
import com.example.campusvault.data.local.SharedPreferencesManager;
import com.example.campusvault.data.local.database.AppDatabase;
import com.example.campusvault.data.local.database.dao.UserDao;
import com.example.campusvault.data.local.database.entity.UserEntity;
import com.example.campusvault.data.models.User;
import com.example.campusvault.data.sync.NetworkMonitor;
import io.reactivex.rxjava3.core.Completable;
import io.reactivex.rxjava3.core.Single;
import io.reactivex.rxjava3.schedulers.Schedulers;
import java.util.Date;

/**
 * Repository for user data with offline-first capability.
 * Stores user info in Room database for fast access and offline support.
 */
public class UserRepository {
    private static final String TAG = "UserRepository";
    
    private final UserDao userDao;
    private final ApiService apiService;
    private final SharedPreferencesManager prefs;
    private final NetworkMonitor networkMonitor;

    public UserRepository(Application application, ApiService apiService, SharedPreferencesManager prefs) {
        AppDatabase db = AppDatabase.getInstance((Context) application);
        this.userDao = db.userDao();
        this.apiService = apiService;
        this.prefs = prefs;
        this.networkMonitor = NetworkMonitor.getInstance(application);
    }

    /**
     * Get current user from local database first, then refresh from API if online.
     */
    public Single<User> getCurrentUser() {
        int userId = prefs.getUserId();
        
        if (userId <= 0) {
            return Single.error(new IllegalStateException("No user logged in"));
        }
        
        // Try local first, then API
        return userDao.getUserById(userId)
            .map(this::mapEntityToModel)
            .subscribeOn(Schedulers.io())
            .onErrorResumeNext(error -> {
                // If local fails and we're online, fetch from API
                if (networkMonitor.isOnline()) {
                    return refreshCurrentUser();
                }
                return Single.error(error);
            });
    }

    /**
     * Fetch user from API and save to local database.
     */
    public Single<User> refreshCurrentUser() {
        return apiService.getProfile()
            .subscribeOn(Schedulers.io())
            .doOnSuccess(user -> {
                // Save to local database
                UserEntity entity = mapModelToEntity(user);
                userDao.insert(entity).blockingAwait();
                Log.d(TAG, "User saved to local database: " + user.getId());
            })
            .doOnError(error -> Log.e(TAG, "Failed to refresh user", error));
    }

    /**
     * Save user to local database.
     */
    public Completable saveUser(User user) {
        return Completable.fromAction(() -> {
            UserEntity entity = mapModelToEntity(user);
            userDao.insert(entity).blockingAwait();
        }).subscribeOn(Schedulers.io());
    }

    /**
     * Update user in local database.
     */
    public Completable updateUser(User user) {
        return Completable.fromAction(() -> {
            UserEntity entity = mapModelToEntity(user);
            userDao.update(entity).blockingAwait();
        }).subscribeOn(Schedulers.io());
    }

    /**
     * Delete user from local database (logout).
     */
    public Completable deleteUser() {
        return userDao.deleteAll().subscribeOn(Schedulers.io());
    }

    /**
     * Check if user data exists in local database.
     */
    public Single<Boolean> hasLocalUser() {
        return userDao.getUserCount()
            .map(count -> count > 0)
            .subscribeOn(Schedulers.io());
    }

    // Mappers
    private User mapEntityToModel(UserEntity entity) {
        User user = new User();
        user.setId(entity.getId());
        user.setEmail(entity.getEmail());
        user.setUsername(entity.getUsername());
        user.setFirstName(entity.getFirstName());
        user.setLastName(entity.getLastName());
        user.setFacultyId(entity.getFacultyId());
        user.setProgramId(entity.getProgramId());
        user.setRole(entity.getRole());
        user.setAvatarUrl(entity.getAvatarUrl());
        user.setBannerUrl(entity.getBannerUrl());
        user.setVerified(entity.isVerified());
        user.setCreatedAt(entity.getCreatedAt());
        return user;
    }

    private UserEntity mapModelToEntity(User model) {
        UserEntity entity = new UserEntity();
        entity.setId(model.getId());
        entity.setEmail(model.getEmail());
        entity.setUsername(model.getUsername());
        entity.setFirstName(model.getFirstName());
        entity.setLastName(model.getLastName());
        entity.setFacultyId(model.getFacultyId());
        entity.setProgramId(model.getProgramId());
        entity.setRole(model.getRole());
        entity.setAvatarUrl(model.getAvatarUrl());
        entity.setBannerUrl(model.getBannerUrl());
        entity.setVerified(model.isVerified());
        entity.setCreatedAt(model.getCreatedAt());
        entity.setCachedAt(new Date());
        return entity;
    }
}
