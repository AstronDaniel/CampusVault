package com.example.campusvault.utils;

import android.app.DownloadManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.util.Log;

import androidx.core.content.FileProvider;

import com.google.gson.Gson;
import com.google.gson.annotations.SerializedName;

import java.io.File;
import java.io.IOException;
import java.util.List;

import okhttp3.Call;
import okhttp3.Callback;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.Response;

/**
 * Utility class to check for app updates from GitHub releases
 */
public class UpdateChecker {
    
    private static final String TAG = "UpdateChecker";
    private static final String GITHUB_API_URL = "https://api.github.com/repos/AstronDaniel/CampusVault/releases/latest";
    
    private final Context context;
    private final OkHttpClient client;
    private final Gson gson;
    private UpdateCallback callback;
    private long downloadId = -1;
    
    public interface UpdateCallback {
        void onUpdateAvailable(ReleaseInfo release);
        void onNoUpdate();
        void onError(String error);
        void onDownloadStarted();
        void onDownloadComplete(File apkFile);
        void onDownloadFailed(String error);
    }
    
    public UpdateChecker(Context context) {
        this.context = context.getApplicationContext();
        this.client = new OkHttpClient();
        this.gson = new Gson();
    }
    
    public void setCallback(UpdateCallback callback) {
        this.callback = callback;
    }
    
    /**
     * Check for updates from GitHub releases
     */
    public void checkForUpdates() {
        Request request = new Request.Builder()
                .url(GITHUB_API_URL)
                .header("Accept", "application/vnd.github.v3+json")
                .build();
        
        client.newCall(request).enqueue(new Callback() {
            @Override
            public void onFailure(Call call, IOException e) {
                Log.e(TAG, "Failed to check for updates", e);
                if (callback != null) {
                    callback.onError("Failed to check for updates: " + e.getMessage());
                }
            }
            
            @Override
            public void onResponse(Call call, Response response) throws IOException {
                if (!response.isSuccessful()) {
                    if (response.code() == 404) {
                        // No releases yet - treat as "no update available"
                        if (callback != null) {
                            callback.onNoUpdate();
                        }
                    } else {
                        if (callback != null) {
                            callback.onError("Server error: " + response.code());
                        }
                    }
                    return;
                }
                
                String body = response.body().string();
                ReleaseInfo release = gson.fromJson(body, ReleaseInfo.class);
                
                if (release != null && isNewerVersion(release.tagName)) {
                    if (callback != null) {
                        callback.onUpdateAvailable(release);
                    }
                } else {
                    if (callback != null) {
                        callback.onNoUpdate();
                    }
                }
            }
        });
    }
    
    /**
     * Compare version strings to determine if update is available
     */
    private boolean isNewerVersion(String tagName) {
        try {
            String currentVersion = getCurrentVersion();
            String newVersion = tagName.replace("v", "").replace("V", "");
            
            return compareVersions(newVersion, currentVersion) > 0;
        } catch (Exception e) {
            Log.e(TAG, "Error comparing versions", e);
            return false;
        }
    }
    
    /**
     * Get current app version
     */
    public String getCurrentVersion() {
        try {
            PackageInfo pInfo = context.getPackageManager().getPackageInfo(context.getPackageName(), 0);
            return pInfo.versionName;
        } catch (PackageManager.NameNotFoundException e) {
            return "1.0";
        }
    }
    
    /**
     * Get current app version code
     */
    public int getCurrentVersionCode() {
        try {
            PackageInfo pInfo = context.getPackageManager().getPackageInfo(context.getPackageName(), 0);
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
                return (int) pInfo.getLongVersionCode();
            } else {
                return pInfo.versionCode;
            }
        } catch (PackageManager.NameNotFoundException e) {
            return 1;
        }
    }
    
    /**
     * Compare two version strings
     * Returns positive if v1 > v2, negative if v1 < v2, 0 if equal
     */
    private int compareVersions(String v1, String v2) {
        String[] parts1 = v1.split("\\.");
        String[] parts2 = v2.split("\\.");
        
        int length = Math.max(parts1.length, parts2.length);
        for (int i = 0; i < length; i++) {
            int p1 = i < parts1.length ? parseVersionPart(parts1[i]) : 0;
            int p2 = i < parts2.length ? parseVersionPart(parts2[i]) : 0;
            
            if (p1 != p2) {
                return p1 - p2;
            }
        }
        return 0;
    }
    
    private int parseVersionPart(String part) {
        try {
            // Remove any non-numeric suffix (like "beta", "alpha", etc.)
            String numericPart = part.replaceAll("[^0-9]", "");
            return numericPart.isEmpty() ? 0 : Integer.parseInt(numericPart);
        } catch (NumberFormatException e) {
            return 0;
        }
    }
    
    /**
     * Download the APK from the release
     */
    public void downloadUpdate(ReleaseInfo release) {
        String apkUrl = null;
        
        // Find APK asset in release
        if (release.assets != null) {
            for (Asset asset : release.assets) {
                if (asset.name != null && asset.name.endsWith(".apk")) {
                    apkUrl = asset.browserDownloadUrl;
                    break;
                }
            }
        }
        
        if (apkUrl == null) {
            if (callback != null) {
                callback.onDownloadFailed("No APK found in release");
            }
            return;
        }
        
        // Download using DownloadManager
        DownloadManager.Request request = new DownloadManager.Request(Uri.parse(apkUrl));
        request.setTitle("CampusVault Update");
        request.setDescription("Downloading version " + release.tagName);
        request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
        request.setMimeType("application/vnd.android.package-archive");
        
        // Save to Downloads folder
        String fileName = "CampusVault-" + release.tagName + ".apk";
        request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, fileName);
        
        DownloadManager downloadManager = (DownloadManager) context.getSystemService(Context.DOWNLOAD_SERVICE);
        if (downloadManager != null) {
            downloadId = downloadManager.enqueue(request);
            
            // Register receiver for download complete
            registerDownloadReceiver(fileName);
            
            if (callback != null) {
                callback.onDownloadStarted();
            }
        } else {
            if (callback != null) {
                callback.onDownloadFailed("Download manager not available");
            }
        }
    }
    
    private void registerDownloadReceiver(String fileName) {
        BroadcastReceiver receiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                long id = intent.getLongExtra(DownloadManager.EXTRA_DOWNLOAD_ID, -1);
                if (id == downloadId) {
                    context.unregisterReceiver(this);
                    
                    File apkFile = new File(
                            Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS),
                            fileName);
                    
                    if (apkFile.exists()) {
                        if (callback != null) {
                            callback.onDownloadComplete(apkFile);
                        }
                    } else {
                        if (callback != null) {
                            callback.onDownloadFailed("Downloaded file not found");
                        }
                    }
                }
            }
        };
        
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            context.registerReceiver(receiver, 
                    new IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE),
                    Context.RECEIVER_EXPORTED);
        } else {
            context.registerReceiver(receiver, 
                    new IntentFilter(DownloadManager.ACTION_DOWNLOAD_COMPLETE));
        }
    }
    
    /**
     * Install the downloaded APK
     */
    public void installApk(File apkFile) {
        Intent intent = new Intent(Intent.ACTION_VIEW);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        
        Uri apkUri;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            apkUri = FileProvider.getUriForFile(context, 
                    context.getPackageName() + ".fileprovider", apkFile);
            intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
        } else {
            apkUri = Uri.fromFile(apkFile);
        }
        
        intent.setDataAndType(apkUri, "application/vnd.android.package-archive");
        context.startActivity(intent);
    }
    
    /**
     * GitHub Release model
     */
    public static class ReleaseInfo {
        @SerializedName("tag_name")
        public String tagName;
        
        @SerializedName("name")
        public String name;
        
        @SerializedName("body")
        public String body;
        
        @SerializedName("html_url")
        public String htmlUrl;
        
        @SerializedName("published_at")
        public String publishedAt;
        
        @SerializedName("assets")
        public List<Asset> assets;
        
        public String getVersionName() {
            return tagName != null ? tagName.replace("v", "").replace("V", "") : "Unknown";
        }
    }
    
    public static class Asset {
        @SerializedName("name")
        public String name;
        
        @SerializedName("browser_download_url")
        public String browserDownloadUrl;
        
        @SerializedName("size")
        public long size;
        
        @SerializedName("content_type")
        public String contentType;
    }
}
