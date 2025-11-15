package com.example.campusvault;

import android.app.Application;
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
        // Application initialization code will go here
    }
}
