package com.example.campusvault.data.api;

import android.util.Log;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;

import com.example.campusvault.data.local.EncryptedPreferencesManager;
import com.example.campusvault.data.local.SharedPreferencesManager;
import com.google.gson.Gson;

import java.io.IOException;

import okhttp3.Authenticator;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;
import okhttp3.Route;

/**
 * OkHttp Authenticator that handles 401 responses by refreshing the access token
 */
public class TokenAuthenticator implements Authenticator {

    private static final String TAG = "TokenAuthenticator";
    private static final String BASE_URL = "https://campus-vault-backend.vercel.app/api/v1/";
    
    private final SharedPreferencesManager preferencesManager;
    private final EncryptedPreferencesManager encryptedPreferencesManager;
    private final Object refreshLock = new Object();
    private volatile boolean isRefreshing = false;

    public TokenAuthenticator(SharedPreferencesManager preferencesManager, 
                              EncryptedPreferencesManager encryptedPreferencesManager) {
        this.preferencesManager = preferencesManager;
        this.encryptedPreferencesManager = encryptedPreferencesManager;
    }

    @Nullable
    @Override
    public Request authenticate(@Nullable Route route, @NonNull Response response) throws IOException {
        Log.d(TAG, "Authentication failed with code: " + response.code());
        
        // Don't retry if already tried with a fresh token
        if (responseCount(response) >= 2) {
            Log.e(TAG, "Already retried, giving up");
            return null; // Give up after 2 retries
        }

        // Get the current refresh token
        String refreshToken = null;
        if (encryptedPreferencesManager != null) {
            refreshToken = encryptedPreferencesManager.getRefreshToken();
        }
        if (refreshToken == null || refreshToken.isEmpty()) {
            refreshToken = preferencesManager.getRefreshToken();
        }

        if (refreshToken == null || refreshToken.isEmpty()) {
            Log.e(TAG, "No refresh token available, cannot refresh");
            return null; // Can't refresh without a refresh token
        }

        synchronized (refreshLock) {
            // Double-check: another thread might have already refreshed
            String currentToken = getCurrentToken();
            String originalToken = response.request().header("Authorization");
            
            if (originalToken != null && currentToken != null) {
                String originalBearerToken = originalToken.replace("Bearer ", "");
                if (!originalBearerToken.equals(currentToken)) {
                    // Token was already refreshed by another thread
                    Log.d(TAG, "Token was already refreshed by another thread");
                    return response.request().newBuilder()
                            .header("Authorization", "Bearer " + currentToken)
                            .build();
                }
            }

            if (isRefreshing) {
                Log.d(TAG, "Another thread is refreshing, waiting...");
                try {
                    refreshLock.wait(5000); // Wait up to 5 seconds
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    return null;
                }
                // After waiting, get the new token
                String newToken = getCurrentToken();
                if (newToken != null && !newToken.isEmpty()) {
                    return response.request().newBuilder()
                            .header("Authorization", "Bearer " + newToken)
                            .build();
                }
                return null;
            }

            isRefreshing = true;
        }

        try {
            // Attempt to refresh the token
            String newAccessToken = refreshAccessToken(refreshToken);
            
            if (newAccessToken != null) {
                Log.d(TAG, "Token refreshed successfully");
                
                // Build a new request with the fresh token
                return response.request().newBuilder()
                        .header("Authorization", "Bearer " + newAccessToken)
                        .build();
            } else {
                Log.e(TAG, "Failed to refresh token");
                // Clear tokens - user needs to login again
                clearTokens();
                return null;
            }
        } finally {
            synchronized (refreshLock) {
                isRefreshing = false;
                refreshLock.notifyAll();
            }
        }
    }

    private int responseCount(Response response) {
        int count = 1;
        while ((response = response.priorResponse()) != null) {
            count++;
        }
        return count;
    }

    private String getCurrentToken() {
        String token = null;
        if (encryptedPreferencesManager != null) {
            token = encryptedPreferencesManager.getAuthToken();
        }
        if (token == null || token.isEmpty()) {
            token = preferencesManager.getAuthToken();
        }
        return token;
    }

    private void clearTokens() {
        if (encryptedPreferencesManager != null) {
            encryptedPreferencesManager.clearAuthToken();
        }
        preferencesManager.clearAuthToken();
    }

    private String refreshAccessToken(String refreshToken) {
        OkHttpClient client = new OkHttpClient.Builder().build();
        
        try {
            // Create refresh request
            String json = "{\"refresh_token\":\"" + refreshToken + "\"}";
            RequestBody body = RequestBody.create(
                    json, 
                    MediaType.parse("application/json")
            );
            
            Request request = new Request.Builder()
                    .url(BASE_URL + "auth/refresh")
                    .post(body)
                    .header("Content-Type", "application/json")
                    .build();

            Log.d(TAG, "Attempting to refresh token...");
            
            try (Response refreshResponse = client.newCall(request).execute()) {
                if (refreshResponse.isSuccessful() && refreshResponse.body() != null) {
                    String responseBody = refreshResponse.body().string();
                    Log.d(TAG, "Refresh response: " + refreshResponse.code());
                    
                    // Parse the response to get new tokens
                    Gson gson = new Gson();
                    TokenResponse tokenResponse = gson.fromJson(responseBody, TokenResponse.class);
                    
                    if (tokenResponse != null && tokenResponse.access_token != null) {
                        // Save the new tokens
                        saveTokens(tokenResponse.access_token, tokenResponse.refresh_token);
                        return tokenResponse.access_token;
                    }
                } else {
                    Log.e(TAG, "Refresh failed with code: " + refreshResponse.code());
                    if (refreshResponse.body() != null) {
                        Log.e(TAG, "Error body: " + refreshResponse.body().string());
                    }
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Exception during token refresh", e);
        }
        
        return null;
    }

    private void saveTokens(String accessToken, String refreshToken) {
        if (encryptedPreferencesManager != null) {
            encryptedPreferencesManager.saveAuthToken(accessToken);
            if (refreshToken != null) {
                encryptedPreferencesManager.saveRefreshToken(refreshToken);
            }
        } else {
            preferencesManager.saveAuthToken(accessToken);
            if (refreshToken != null) {
                preferencesManager.saveRefreshToken(refreshToken);
            }
        }
        Log.d(TAG, "Tokens saved successfully");
    }

    // Simple class to parse token response
    private static class TokenResponse {
        String access_token;
        String refresh_token;
        String token_type;
        int expires_in;
    }
}
