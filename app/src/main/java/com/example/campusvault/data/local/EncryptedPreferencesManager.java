package com.example.campusvault.data.local;

import android.content.Context;
import android.content.SharedPreferences;
import androidx.security.crypto.EncryptedSharedPreferences;
import androidx.security.crypto.MasterKey;
import java.io.IOException;
import java.security.GeneralSecurityException;

/**
 * Manager class for encrypted SharedPreferences
 * Handles sensitive data like authentication tokens
 */
public class EncryptedPreferencesManager {

    private static final String ENCRYPTED_PREF_NAME = "CampusVaultSecurePrefs";
    
    // Keys
    private static final String KEY_AUTH_TOKEN = "secure_auth_token";
    private static final String KEY_REFRESH_TOKEN = "secure_refresh_token";

    private final SharedPreferences encryptedPreferences;

    public EncryptedPreferencesManager(Context context) {
        SharedPreferences prefs = null;
        try {
            MasterKey masterKey = new MasterKey.Builder(context)
                .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
                .build();

            prefs = EncryptedSharedPreferences.create(
                context,
                ENCRYPTED_PREF_NAME,
                masterKey,
                EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
                EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
            );
        } catch (GeneralSecurityException | IOException e) {
            e.printStackTrace();
            // Fallback to regular SharedPreferences if encryption fails
            prefs = context.getSharedPreferences(ENCRYPTED_PREF_NAME, Context.MODE_PRIVATE);
        }
        this.encryptedPreferences = prefs;
    }

    /**
     * Save authentication token securely
     */
    public void saveAuthToken(String token) {
        encryptedPreferences.edit().putString(KEY_AUTH_TOKEN, token).apply();
    }

    /**
     * Get authentication token
     */
    public String getAuthToken() {
        return encryptedPreferences.getString(KEY_AUTH_TOKEN, null);
    }

    /**
     * Save refresh token securely
     */
    public void saveRefreshToken(String token) {
        encryptedPreferences.edit().putString(KEY_REFRESH_TOKEN, token).apply();
    }

    /**
     * Get refresh token
     */
    public String getRefreshToken() {
        return encryptedPreferences.getString(KEY_REFRESH_TOKEN, null);
    }

    /**
     * Clear all secure data
     */
    public void clearAll() {
        encryptedPreferences.edit().clear().apply();
    }

    /**
     * Check if user is authenticated
     */
    public boolean isAuthenticated() {
        String token = getAuthToken();
        return token != null && !token.isEmpty();
    }
}
