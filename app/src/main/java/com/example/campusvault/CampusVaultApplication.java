package com.example.campusvault;

import android.app.Application;
import androidx.appcompat.app.AppCompatDelegate;
import androidx.preference.PreferenceManager;
import dagger.hilt.android.HiltAndroidApp;

/**
 * Application class for CampusVault
 * Annotated with @HiltAndroidApp to enable Hilt dependency injection
 */
@HiltAndroidApp
public class CampusVaultApplication extends Application {
    
    @Override
    public void onCreate() {
        super.onCreate();
        applyTheme();
    }

    private void applyTheme() {
        String theme = PreferenceManager.getDefaultSharedPreferences(this)
                .getString("theme", "system");
        
        switch (theme) {
            case "light":
                AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_NO);
                break;
            case "dark":
                AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_YES);
                break;
            case "system":
            default:
                AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_FOLLOW_SYSTEM);
                break;
        }
    }
}
