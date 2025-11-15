package com.example.campusvault.data.api;

import androidx.annotation.NonNull;
import com.example.campusvault.data.local.SharedPreferencesManager;
import java.io.IOException;
import okhttp3.Interceptor;
import okhttp3.Request;
import okhttp3.Response;

/**
 * OkHttp interceptor for injecting JWT authentication token into requests
 */
public class AuthInterceptor implements Interceptor {

    private final SharedPreferencesManager preferencesManager;
    private final com.example.campusvault.data.local.EncryptedPreferencesManager encryptedPreferencesManager;

    public AuthInterceptor(SharedPreferencesManager preferencesManager) {
        this.preferencesManager = preferencesManager;
        // Note: We can't get Context here, so we'll try SharedPreferences first
        // This is a temporary solution - ideally we should pass EncryptedPreferencesManager
        this.encryptedPreferencesManager = null;
    }
    
    public AuthInterceptor(SharedPreferencesManager preferencesManager, com.example.campusvault.data.local.EncryptedPreferencesManager encryptedPreferencesManager) {
        this.preferencesManager = preferencesManager;
        this.encryptedPreferencesManager = encryptedPreferencesManager;
    }

    @NonNull
    @Override
    public Response intercept(@NonNull Chain chain) throws IOException {
        Request originalRequest = chain.request();
        
        // Skip auth for login, register, and password reset endpoints only
        String path = originalRequest.url().encodedPath();
        if (path.contains("/auth/login") || 
            path.contains("/auth/register") || 
            path.contains("/auth/refresh") ||
            path.contains("/auth/password/reset")) {
            android.util.Log.d("AuthInterceptor", "Skipping auth for: " + path);
            return chain.proceed(originalRequest);
        }

        // Get token from encrypted preferences first, fallback to regular preferences
        String token = null;
        if (encryptedPreferencesManager != null) {
            token = encryptedPreferencesManager.getAuthToken();
        }
        if (token == null || token.isEmpty()) {
            token = preferencesManager.getAuthToken();
        }
        
        android.util.Log.d("AuthInterceptor", "Path: " + path + ", Token exists: " + (token != null && !token.isEmpty()));
        
        // If no token, proceed without authorization
        if (token == null || token.isEmpty()) {
            android.util.Log.w("AuthInterceptor", "No token found for authenticated endpoint: " + path);
            return chain.proceed(originalRequest);
        }

        // Add authorization header
        Request authenticatedRequest = originalRequest.newBuilder()
            .header("Authorization", "Bearer " + token)
            .build();

        android.util.Log.d("AuthInterceptor", "Added Authorization header for: " + path);
        return chain.proceed(authenticatedRequest);
    }
}
