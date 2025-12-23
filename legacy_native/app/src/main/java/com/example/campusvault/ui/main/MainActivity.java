package com.example.campusvault.ui.main;

import android.content.SharedPreferences;
import android.os.Bundle;
import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.fragment.app.Fragment;
import androidx.preference.PreferenceManager;
import com.example.campusvault.R;
import com.example.campusvault.databinding.ActivityMainBinding;
import com.example.campusvault.ui.dialogs.UpdateDialog;
import com.example.campusvault.ui.main.home.HomeFragment;
import com.example.campusvault.utils.UpdateChecker;
import com.google.android.material.navigation.NavigationBarView;

public class MainActivity extends AppCompatActivity {

    private ActivityMainBinding binding;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        binding = ActivityMainBinding.inflate(getLayoutInflater());
        setContentView(binding.getRoot());

        setupBottomNav();
        if (savedInstanceState == null) {
            switchTo(new HomeFragment());
            // Check for updates on first launch
            checkForUpdates();
        }
    }
    
    private void checkForUpdates() {
        // Check if we should auto-check (only once per day)
        SharedPreferences prefs = PreferenceManager.getDefaultSharedPreferences(this);
        long lastCheck = prefs.getLong("last_update_check", 0);
        long now = System.currentTimeMillis();
        long oneDay = 24 * 60 * 60 * 1000; // 24 hours
        
        if (now - lastCheck < oneDay) {
            return; // Already checked today
        }
        
        // Save check time
        prefs.edit().putLong("last_update_check", now).apply();
        
        UpdateChecker checker = new UpdateChecker(this);
        checker.setCallback(new UpdateChecker.UpdateCallback() {
            @Override
            public void onUpdateAvailable(UpdateChecker.ReleaseInfo release) {
                runOnUiThread(() -> {
                    UpdateDialog dialog = UpdateDialog.newInstance(release);
                    dialog.show(getSupportFragmentManager(), "update_dialog");
                });
            }
            
            @Override
            public void onNoUpdate() {
                // Silently ignore - no update needed
            }
            
            @Override
            public void onError(String error) {
                // Silently ignore - don't bother user with errors on auto-check
            }
            
            @Override
            public void onDownloadStarted() {}
            
            @Override
            public void onDownloadComplete(java.io.File apkFile) {}
            
            @Override
            public void onDownloadFailed(String error) {}
        });
        
        checker.checkForUpdates();
    }

    private void setupBottomNav() {
        binding.bottomNav.setOnItemSelectedListener(new NavigationBarView.OnItemSelectedListener() {
            @Override
            public boolean onNavigationItemSelected(@NonNull android.view.MenuItem item) {
                int id = item.getItemId();
                Fragment fragment = null;
                if (id == R.id.menu_home) {
                    fragment = new HomeFragment();
                } else if (id == R.id.menu_explore) {
                    fragment = new com.example.campusvault.ui.main.explore.ExploreFragment();
                } else if (id == R.id.menu_upload) {
                    fragment = new com.example.campusvault.ui.main.upload.UploadFragment();
                } else if (id == R.id.menu_bookmarks) {
                    fragment = new com.example.campusvault.ui.main.bookmarks.BookmarkFragment();
                } else if (id == R.id.menu_profile) {
                    fragment = new com.example.campusvault.ui.main.profile.ProfileFragment();
                }
                if (fragment != null) {
                    switchTo(fragment);
                    return true;
                }
                return false;
            }
        });
    }

    private void switchTo(Fragment fragment) {
        getSupportFragmentManager()
            .beginTransaction()
            .setCustomAnimations(android.R.anim.fade_in, android.R.anim.fade_out)
            .replace(R.id.fragmentContainer, fragment)
            .commit();
    }
}
