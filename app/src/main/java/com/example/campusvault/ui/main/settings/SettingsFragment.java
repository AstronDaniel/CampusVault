package com.example.campusvault.ui.main.settings;

import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.widget.Toast;
import androidx.preference.Preference;
import androidx.preference.PreferenceFragmentCompat;
import com.example.campusvault.R;
import com.google.android.material.dialog.MaterialAlertDialogBuilder;

import java.io.File;

public class SettingsFragment extends PreferenceFragmentCompat {

    @Override
    public void onCreatePreferences(Bundle savedInstanceState, String rootKey) {
        setPreferencesFromResource(R.xml.preferences, rootKey);
        setupClickListeners();
    }

    private void setupClickListeners() {
        // Clear Cache
        Preference clearCache = findPreference("clear_cache");
        if (clearCache != null) {
            clearCache.setOnPreferenceClickListener(preference -> {
                clearAppCache();
                return true;
            });
        }

        // About
        Preference about = findPreference("about");
        if (about != null) {
            about.setOnPreferenceClickListener(preference -> {
                showAboutDialog();
                return true;
            });
        }

        // Help & Support
        Preference helpSupport = findPreference("help_support");
        if (helpSupport != null) {
            helpSupport.setOnPreferenceClickListener(preference -> {
                openEmail();
                return true;
            });
        }

        // Privacy Policy
        Preference privacyPolicy = findPreference("privacy_policy");
        if (privacyPolicy != null) {
            privacyPolicy.setOnPreferenceClickListener(preference -> {
                openUrl("https://campusvault.com/privacy");
                return true;
            });
        }

        // Terms of Service
        Preference termsOfService = findPreference("terms_of_service");
        if (termsOfService != null) {
            termsOfService.setOnPreferenceClickListener(preference -> {
                openUrl("https://campusvault.com/terms");
                return true;
            });
        }
    }

    private void clearAppCache() {
        try {
            File cacheDir = requireContext().getCacheDir();
            if (cacheDir != null && cacheDir.isDirectory()) {
                deleteDir(cacheDir);
            }
            Toast.makeText(requireContext(), "Cache cleared successfully", Toast.LENGTH_SHORT).show();
        } catch (Exception e) {
            Toast.makeText(requireContext(), "Failed to clear cache", Toast.LENGTH_SHORT).show();
        }
    }

    private boolean deleteDir(File dir) {
        if (dir != null && dir.isDirectory()) {
            String[] children = dir.list();
            if (children != null) {
                for (String child : children) {
                    boolean success = deleteDir(new File(dir, child));
                    if (!success) return false;
                }
            }
            return dir.delete();
        } else if (dir != null && dir.isFile()) {
            return dir.delete();
        }
        return false;
    }

    private void showAboutDialog() {
        new MaterialAlertDialogBuilder(requireContext())
                .setTitle("About CampusVault")
                .setMessage("CampusVault v1.0.0\n\n" +
                        "A platform for sharing and accessing academic resources within your university.\n\n" +
                        "Features:\n" +
                        "• Browse and download study materials\n" +
                        "• Upload and share your notes\n" +
                        "• Bookmark resources for later\n" +
                        "• Rate and review resources\n\n" +
                        "© 2024 CampusVault Team")
                .setPositiveButton("OK", null)
                .show();
    }

    private void openEmail() {
        try {
            Intent intent = new Intent(Intent.ACTION_SENDTO);
            intent.setData(Uri.parse("mailto:support@campusvault.com"));
            intent.putExtra(Intent.EXTRA_SUBJECT, "CampusVault Support Request");
            startActivity(Intent.createChooser(intent, "Contact Support"));
        } catch (Exception e) {
            Toast.makeText(requireContext(), "No email app found", Toast.LENGTH_SHORT).show();
        }
    }

    private void openUrl(String url) {
        try {
            Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
            startActivity(intent);
        } catch (Exception e) {
            Toast.makeText(requireContext(), "Unable to open link", Toast.LENGTH_SHORT).show();
        }
    }
}
