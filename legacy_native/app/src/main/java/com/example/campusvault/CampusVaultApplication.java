package com.example.campusvault;

import android.app.Application;
import androidx.appcompat.app.AppCompatDelegate;
import androidx.preference.PreferenceManager;
import com.example.campusvault.data.sync.NetworkMonitor;
import com.example.campusvault.data.sync.SyncManager;
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
        initializeOfflineSync();
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

    /**
     * Initialize offline-first sync infrastructure.
     * Sets up network monitoring and schedules periodic background sync.
     */
    private void initializeOfflineSync() {
        // Initialize network monitor
        NetworkMonitor.getInstance(this);
        
        // Schedule periodic background sync
        SyncManager syncManager = SyncManager.getInstance(this);
        syncManager.schedulePeriodicSync();
        
        // Request immediate sync if online
        syncManager.requestImmediateSync();
    }
}
