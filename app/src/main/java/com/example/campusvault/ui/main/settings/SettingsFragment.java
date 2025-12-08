package com.example.campusvault.ui.main.settings;

import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.os.Bundle;
import android.os.Environment;
import android.widget.Toast;

import androidx.appcompat.app.AppCompatDelegate;
import androidx.preference.ListPreference;
import androidx.preference.Preference;
import androidx.preference.PreferenceFragmentCompat;
import androidx.preference.PreferenceManager;

import com.example.campusvault.R;
import com.example.campusvault.ui.dialogs.UpdateDialog;
import com.example.campusvault.utils.UpdateChecker;
import com.google.android.material.dialog.MaterialAlertDialogBuilder;

import java.io.File;
import java.text.DecimalFormat;

public class SettingsFragment extends PreferenceFragmentCompat implements SharedPreferences.OnSharedPreferenceChangeListener {

    @Override
    public void onCreatePreferences(Bundle savedInstanceState, String rootKey) {
        setPreferencesFromResource(R.xml.preferences, rootKey);
        setupPreferences();
        setupClickListeners();
        updateStorageUsage();
        updateDownloadQualitySummary();
    }

    @Override
    public void onResume() {
        super.onResume();
        PreferenceManager.getDefaultSharedPreferences(requireContext())
                .registerOnSharedPreferenceChangeListener(this);
    }

    @Override
    public void onPause() {
        super.onPause();
        PreferenceManager.getDefaultSharedPreferences(requireContext())
                .unregisterOnSharedPreferenceChangeListener(this);
    }

    @Override
    public void onSharedPreferenceChanged(SharedPreferences sharedPreferences, String key) {
        if ("theme".equals(key)) {
            applyTheme(sharedPreferences.getString(key, "system"));
        } else if ("download_quality".equals(key)) {
            updateDownloadQualitySummary();
        }
    }

    private void setupPreferences() {
        // Set current theme summary and listener
        ListPreference themePreference = findPreference("theme");
        if (themePreference != null) {
            themePreference.setSummaryProvider(ListPreference.SimpleSummaryProvider.getInstance());
            themePreference.setOnPreferenceChangeListener((preference, newValue) -> {
                String theme = (String) newValue;
                applyTheme(theme);
                // Recreate activity for immediate effect
                if (getActivity() != null) {
                    getActivity().recreate();
                }
                return true;
            });
        }

        // Set download location summary
        Preference downloadLocation = findPreference("download_location");
        if (downloadLocation != null) {
            File downloadDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
            downloadLocation.setSummary(downloadDir.getAbsolutePath() + "/CampusVault");
        }

        // Set version in about
        Preference about = findPreference("about");
        if (about != null) {
            about.setSummary("Version 1.0.0");
        }
    }

    private void updateDownloadQualitySummary() {
        ListPreference downloadQuality = findPreference("download_quality");
        if (downloadQuality != null) {
            downloadQuality.setSummaryProvider(ListPreference.SimpleSummaryProvider.getInstance());
        }
    }

    private void applyTheme(String theme) {
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

    private void setupClickListeners() {
        // Storage Usage
        Preference storageUsage = findPreference("storage_usage");
        if (storageUsage != null) {
            storageUsage.setOnPreferenceClickListener(preference -> {
                showStorageDetails();
                return true;
            });
        }

        // Clear Cache
        Preference clearCache = findPreference("clear_cache");
        if (clearCache != null) {
            clearCache.setOnPreferenceClickListener(preference -> {
                confirmClearCache();
                return true;
            });
        }

        // Clear Downloads
        Preference clearDownloads = findPreference("clear_downloads");
        if (clearDownloads != null) {
            clearDownloads.setOnPreferenceClickListener(preference -> {
                confirmClearDownloads();
                return true;
            });
        }

        // Check Updates
        Preference checkUpdates = findPreference("check_updates");
        if (checkUpdates != null) {
            checkUpdates.setOnPreferenceClickListener(preference -> {
                checkForUpdates();
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
                showHelpOptions();
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

        // Download Location
        Preference downloadLocation = findPreference("download_location");
        if (downloadLocation != null) {
            downloadLocation.setOnPreferenceClickListener(preference -> {
                Toast.makeText(requireContext(), "Download location cannot be changed", Toast.LENGTH_SHORT).show();
                return true;
            });
        }
    }

    private void updateStorageUsage() {
        Preference storageUsage = findPreference("storage_usage");
        if (storageUsage != null) {
            long cacheSize = getDirSize(requireContext().getCacheDir());
            long downloadSize = getDirSize(new File(
                    Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS),
                    "CampusVault"));
            long totalSize = cacheSize + downloadSize;
            storageUsage.setSummary("Using " + formatFileSize(totalSize));
        }
    }

    private void showStorageDetails() {
        long cacheSize = getDirSize(requireContext().getCacheDir());
        File downloadDir = new File(
                Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS),
                "CampusVault");
        long downloadSize = getDirSize(downloadDir);

        String message = String.format(
                "Cache: %s\nDownloads: %s\nTotal: %s",
                formatFileSize(cacheSize),
                formatFileSize(downloadSize),
                formatFileSize(cacheSize + downloadSize)
        );

        new MaterialAlertDialogBuilder(requireContext())
                .setTitle("Storage Usage")
                .setMessage(message)
                .setPositiveButton("OK", null)
                .show();
    }

    private void confirmClearCache() {
        new MaterialAlertDialogBuilder(requireContext())
                .setTitle("Clear Cache")
                .setMessage("This will clear all cached data. You may need to re-download some content.")
                .setPositiveButton("Clear", (dialog, which) -> clearAppCache())
                .setNegativeButton("Cancel", null)
                .show();
    }

    private void clearAppCache() {
        try {
            File cacheDir = requireContext().getCacheDir();
            if (cacheDir != null && cacheDir.isDirectory()) {
                deleteDir(cacheDir);
            }
            Toast.makeText(requireContext(), "Cache cleared successfully", Toast.LENGTH_SHORT).show();
            updateStorageUsage();
        } catch (Exception e) {
            Toast.makeText(requireContext(), "Failed to clear cache", Toast.LENGTH_SHORT).show();
        }
    }

    private void confirmClearDownloads() {
        new MaterialAlertDialogBuilder(requireContext())
                .setTitle("Clear Downloads")
                .setMessage("This will permanently delete all downloaded resources. This action cannot be undone.")
                .setPositiveButton("Delete All", (dialog, which) -> clearDownloads())
                .setNegativeButton("Cancel", null)
                .show();
    }

    private void clearDownloads() {
        try {
            File downloadDir = new File(
                    Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS),
                    "CampusVault");
            if (downloadDir.exists() && downloadDir.isDirectory()) {
                deleteDir(downloadDir);
                downloadDir.mkdirs(); // Recreate empty directory
            }
            Toast.makeText(requireContext(), "Downloads cleared successfully", Toast.LENGTH_SHORT).show();
            updateStorageUsage();
        } catch (Exception e) {
            Toast.makeText(requireContext(), "Failed to clear downloads", Toast.LENGTH_SHORT).show();
        }
    }

    private void checkForUpdates() {
        Preference checkUpdates = findPreference("check_updates");
        if (checkUpdates != null) {
            checkUpdates.setSummary("Checking...");
        }

        UpdateChecker updateChecker = new UpdateChecker(requireContext());
        updateChecker.setCallback(new UpdateChecker.UpdateCallback() {
            @Override
            public void onUpdateAvailable(UpdateChecker.ReleaseInfo release) {
                if (!isAdded()) return;
                requireActivity().runOnUiThread(() -> {
                    if (checkUpdates != null) {
                        checkUpdates.setSummary("Update available: v" + release.getVersionName());
                    }
                    // Show update dialog
                    UpdateDialog dialog = UpdateDialog.newInstance(release);
                    dialog.show(getParentFragmentManager(), "update_dialog");
                });
            }

            @Override
            public void onNoUpdate() {
                if (!isAdded()) return;
                requireActivity().runOnUiThread(() -> {
                    if (checkUpdates != null) {
                        checkUpdates.setSummary("You're on the latest version");
                    }
                    Toast.makeText(requireContext(), "You're running the latest version", Toast.LENGTH_SHORT).show();
                });
            }

            @Override
            public void onError(String error) {
                if (!isAdded()) return;
                requireActivity().runOnUiThread(() -> {
                    if (checkUpdates != null) {
                        checkUpdates.setSummary("Failed to check for updates");
                    }
                    Toast.makeText(requireContext(), "Failed to check for updates", Toast.LENGTH_SHORT).show();
                });
            }

            @Override
            public void onDownloadStarted() {}

            @Override
            public void onDownloadComplete(java.io.File apkFile) {}

            @Override
            public void onDownloadFailed(String error) {}
        });
        
        updateChecker.checkForUpdates();
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

    private long getDirSize(File dir) {
        long size = 0;
        if (dir != null && dir.exists()) {
            if (dir.isDirectory()) {
                File[] files = dir.listFiles();
                if (files != null) {
                    for (File file : files) {
                        size += getDirSize(file);
                    }
                }
            } else {
                size = dir.length();
            }
        }
        return size;
    }

    private String formatFileSize(long size) {
        if (size <= 0) return "0 B";
        final String[] units = new String[]{"B", "KB", "MB", "GB"};
        int digitGroups = (int) (Math.log10(size) / Math.log10(1024));
        digitGroups = Math.min(digitGroups, units.length - 1);
        return new DecimalFormat("#,##0.#").format(size / Math.pow(1024, digitGroups)) + " " + units[digitGroups];
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

    private void showHelpOptions() {
        String[] options = {"Send Feedback", "Report a Bug", "FAQs", "Contact Support"};
        
        new MaterialAlertDialogBuilder(requireContext())
                .setTitle("Help & Support")
                .setItems(options, (dialog, which) -> {
                    switch (which) {
                        case 0: // Send Feedback
                            sendEmail("CampusVault Feedback", "");
                            break;
                        case 1: // Report a Bug
                            sendEmail("Bug Report - CampusVault", 
                                    "Device: " + android.os.Build.MODEL + "\n" +
                                    "Android Version: " + android.os.Build.VERSION.RELEASE + "\n" +
                                    "App Version: 1.0.0\n\n" +
                                    "Please describe the issue:\n\n");
                            break;
                        case 2: // FAQs
                            openUrl("https://campusvault.com/faq");
                            break;
                        case 3: // Contact Support
                            sendEmail("CampusVault Support Request", "");
                            break;
                    }
                })
                .show();
    }

    private void sendEmail(String subject, String body) {
        try {
            Intent intent = new Intent(Intent.ACTION_SENDTO);
            intent.setData(Uri.parse("mailto:support@campusvault.com"));
            intent.putExtra(Intent.EXTRA_SUBJECT, subject);
            intent.putExtra(Intent.EXTRA_TEXT, body);
            startActivity(Intent.createChooser(intent, "Send Email"));
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
