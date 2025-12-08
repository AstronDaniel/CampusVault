package com.example.campusvault.data.repository;

import com.example.campusvault.data.Result;
import com.example.campusvault.data.api.ApiClient;
import com.example.campusvault.data.api.ApiService;
import com.example.campusvault.data.local.EncryptedPreferencesManager;
import com.example.campusvault.data.local.SharedPreferencesManager;
import com.example.campusvault.data.local.database.AppDatabase;
import com.example.campusvault.data.local.database.dao.UserDao;
import com.example.campusvault.data.mappers.UserMapper;
import com.example.campusvault.data.models.AuthResponse;
import com.example.campusvault.data.models.LoginRequest;
import com.example.campusvault.data.models.RegisterRequest;
import io.reactivex.rxjava3.android.schedulers.AndroidSchedulers;
import io.reactivex.rxjava3.core.Single;
import io.reactivex.rxjava3.schedulers.Schedulers;

/**
 * Repository for authentication operations
 */
public class AuthRepository {

    private final ApiService apiService;
    private final SharedPreferencesManager preferencesManager;
    private final EncryptedPreferencesManager encryptedPreferencesManager;
    private final UserDao userDao;

    public AuthRepository(
        ApiService apiService,
        SharedPreferencesManager preferencesManager,
        EncryptedPreferencesManager encryptedPreferencesManager,
        UserDao userDao
    ) {
        this.apiService = apiService;
        this.preferencesManager = preferencesManager;
        this.encryptedPreferencesManager = encryptedPreferencesManager;
        this.userDao = userDao;
    }

    /**
     * Login with email and password
     */
    public Single<Result<AuthResponse>> login(String email, String password) {
        LoginRequest request = new LoginRequest(email, password);
        
        return apiService.login(request)
            .subscribeOn(Schedulers.io())
            .observeOn(AndroidSchedulers.mainThread())
            .map(response -> {
                // Save auth token securely (encrypted)
                encryptedPreferencesManager.saveAuthToken(response.getAccessToken());
                
                // Also save to regular preferences for AuthInterceptor access
                preferencesManager.saveAuthToken(response.getAccessToken());
                
                // Save refresh token for automatic token refresh
                if (response.getRefreshToken() != null) {
                    encryptedPreferencesManager.saveRefreshToken(response.getRefreshToken());
                    preferencesManager.saveRefreshToken(response.getRefreshToken());
                    android.util.Log.d("AuthRepository", "Refresh token saved");
                }
                
                // Save user info
                if (response.getUser() != null) {
                    preferencesManager.saveUserId(response.getUser().getId());
                    preferencesManager.saveUserEmail(response.getUser().getEmail());
                    preferencesManager.saveUserName(response.getUser().getName());
                    preferencesManager.saveUserProgramId(response.getUser().getProgramId());
                    preferencesManager.saveUserFacultyId(response.getUser().getFacultyId());
                    
                    // Cache user in database
                    userDao.insert(UserMapper.toEntity(response.getUser()))
                        .subscribeOn(Schedulers.io())
                        .subscribe();
                }
                
                return Result.success(response);
            })
            .onErrorReturn(throwable -> 
                Result.error(getErrorMessage(throwable))
            );
    }

    /**
     * Register new user
     * Note: Backend returns User object (not AuthResponse with tokens)
     * User needs to login after registration to get tokens
     */
    public Single<Result<AuthResponse>> register(String email, String username, Integer facultyId, Integer programId, String password) {
        RegisterRequest request = new RegisterRequest(email, username, facultyId, programId, password);

        // First register, then auto-login using the provided credentials
        return apiService.register(request)
            .subscribeOn(Schedulers.io())
            .observeOn(AndroidSchedulers.mainThread())
            .flatMap(user -> {
                // Optionally store basic info
                preferencesManager.saveUserEmail(user.getEmail());
                preferencesManager.saveUserName(user.getUsername());
                // Reuse existing login flow to save tokens and cache user
                return login(email, password);
            })
            .onErrorReturn(throwable -> Result.error(getErrorMessage(throwable)));
    }

    /**
     * Logout user
     */
    public void logout() {
        // Clear tokens from encrypted storage
        encryptedPreferencesManager.clearAll();
        
        // Clear tokens from regular storage
        preferencesManager.clearAuthToken();
        preferencesManager.clearRefreshToken();
        
        // Clear user data
        preferencesManager.clearUserData();
        
        // Reset ApiClient singleton so it's recreated on next login
        com.example.campusvault.data.api.ApiClient.resetInstance();
        
        // Clear cached data
        userDao.deleteAll()
            .subscribeOn(Schedulers.io())
            .subscribe();
    }

    /**
     * Check if user is authenticated
     */
    public boolean isAuthenticated() {
        return encryptedPreferencesManager.isAuthenticated();
    }

    /**
     * Get user-friendly error message from throwable
     */
    private String getErrorMessage(Throwable throwable) {
        if (throwable instanceof java.net.UnknownHostException) {
            return "No internet connection";
        } else if (throwable instanceof java.net.SocketTimeoutException) {
            return "Request timed out. Please try again";
        } else if (throwable.getMessage() != null && throwable.getMessage().contains("401")) {
            return "Invalid email or password";
        } else if (throwable.getMessage() != null && throwable.getMessage().contains("409")) {
            return "Email already registered";
        } else if (throwable.getMessage() != null) {
            return throwable.getMessage();
        }
        return "An error occurred. Please try again";
    }
}
