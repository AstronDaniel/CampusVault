package com.example.campusvault.data.local;

import android.content.Context;
import android.content.SharedPreferences;

/**
 * Manager class for SharedPreferences operations
 * Handles non-sensitive app settings and preferences
 */
public class SharedPreferencesManager {

    private static final String PREF_NAME = "CampusVaultPrefs";
    
    // Keys
    private static final String KEY_AUTH_TOKEN = "auth_token";
    private static final String KEY_USER_ID = "user_id";
    private static final String KEY_USER_EMAIL = "user_email";
    private static final String KEY_USER_NAME = "user_name";
    private static final String KEY_USER_PROGRAM_ID = "user_program_id";
    private static final String KEY_USER_FACULTY_ID = "user_faculty_id";
    private static final String KEY_ONBOARDING_COMPLETED = "onboarding_completed";
    private static final String KEY_THEME_MODE = "theme_mode";
    private static final String KEY_FIRST_LAUNCH = "first_launch";

    private final SharedPreferences sharedPreferences;

    public SharedPreferencesManager(Context context) {
        this.sharedPreferences = context.getSharedPreferences(PREF_NAME, Context.MODE_PRIVATE);
    }

    // Auth token
    public void saveAuthToken(String token) {
        sharedPreferences.edit().putString(KEY_AUTH_TOKEN, token).apply();
    }

    public String getAuthToken() {
        return sharedPreferences.getString(KEY_AUTH_TOKEN, null);
    }

    public void clearAuthToken() {
        sharedPreferences.edit().remove(KEY_AUTH_TOKEN).apply();
    }

    // User info
    public void saveUserId(int userId) {
        sharedPreferences.edit().putInt(KEY_USER_ID, userId).apply();
    }

    public int getUserId() {
        return sharedPreferences.getInt(KEY_USER_ID, -1);
    }

    public void saveUserEmail(String email) {
        sharedPreferences.edit().putString(KEY_USER_EMAIL, email).apply();
    }

    public String getUserEmail() {
        return sharedPreferences.getString(KEY_USER_EMAIL, null);
    }

    public void saveUserName(String name) {
        sharedPreferences.edit().putString(KEY_USER_NAME, name).apply();
    }

    public String getUserName() {
        return sharedPreferences.getString(KEY_USER_NAME, null);
    }

    public void saveUserProgramId(int programId) {
        sharedPreferences.edit().putInt(KEY_USER_PROGRAM_ID, programId).apply();
    }

    public int getUserProgramId() {
        return sharedPreferences.getInt(KEY_USER_PROGRAM_ID, -1);
    }

    public void saveUserFacultyId(int facultyId) {
        sharedPreferences.edit().putInt(KEY_USER_FACULTY_ID, facultyId).apply();
    }

    public int getUserFacultyId() {
        return sharedPreferences.getInt(KEY_USER_FACULTY_ID, -1);
    }

    // Onboarding
    public void setOnboardingCompleted(boolean completed) {
        sharedPreferences.edit().putBoolean(KEY_ONBOARDING_COMPLETED, completed).apply();
    }

    public boolean isOnboardingCompleted() {
        return sharedPreferences.getBoolean(KEY_ONBOARDING_COMPLETED, false);
    }

    // First launch
    public boolean isFirstLaunch() {
        boolean isFirst = sharedPreferences.getBoolean(KEY_FIRST_LAUNCH, true);
        if (isFirst) {
            sharedPreferences.edit().putBoolean(KEY_FIRST_LAUNCH, false).apply();
        }
        return isFirst;
    }

    // Theme
    public void setThemeMode(String mode) {
        sharedPreferences.edit().putString(KEY_THEME_MODE, mode).apply();
    }

    public String getThemeMode() {
        return sharedPreferences.getString(KEY_THEME_MODE, "system");
    }

    // Clear all data (logout)
    public void clearAll() {
        sharedPreferences.edit().clear().apply();
    }

    // Clear user data but keep app settings
    public void clearUserData() {
        sharedPreferences.edit()
            .remove(KEY_AUTH_TOKEN)
            .remove(KEY_USER_ID)
            .remove(KEY_USER_EMAIL)
            .remove(KEY_USER_NAME)
            .remove(KEY_USER_PROGRAM_ID)
            .remove(KEY_USER_FACULTY_ID)
            .apply();
    }
}
