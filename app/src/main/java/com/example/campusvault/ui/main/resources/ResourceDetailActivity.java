package com.example.campusvault.ui.main.resources;

import android.app.DownloadManager;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.os.Environment;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import com.example.campusvault.databinding.ActivityResourceDetailBinding;
import com.example.campusvault.data.models.Resource;
import android.widget.Toast;

public class ResourceDetailActivity extends AppCompatActivity {
    
    public static final String EXTRA_RESOURCE_ID = "extra_resource_id";
    public static final String EXTRA_RESOURCE_TITLE = "extra_resource_title";
    public static final String EXTRA_RESOURCE_URL = "extra_resource_url";
    public static final String EXTRA_RESOURCE_DESCRIPTION = "extra_resource_description";
    public static final String EXTRA_RESOURCE_FILE_SIZE = "extra_resource_file_size";
    public static final String EXTRA_RESOURCE_DOWNLOADS = "extra_resource_downloads";
    public static final String EXTRA_RESOURCE_RATING = "extra_resource_rating";
    
    private ActivityResourceDetailBinding binding;
    private int resourceId;
    private String resourceUrl;
    private String resourceTitle;
    
    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        binding = ActivityResourceDetailBinding.inflate(getLayoutInflater());
        setContentView(binding.getRoot());
        
        // Get resource data from intent
        resourceId = getIntent().getIntExtra(EXTRA_RESOURCE_ID, -1);
        resourceTitle = getIntent().getStringExtra(EXTRA_RESOURCE_TITLE);
        resourceUrl = getIntent().getStringExtra(EXTRA_RESOURCE_URL);
        String description = getIntent().getStringExtra(EXTRA_RESOURCE_DESCRIPTION);
        long fileSize = getIntent().getLongExtra(EXTRA_RESOURCE_FILE_SIZE, 0);
        int downloads = getIntent().getIntExtra(EXTRA_RESOURCE_DOWNLOADS, 0);
        float rating = getIntent().getFloatExtra(EXTRA_RESOURCE_RATING, 0f);
        
        // Setup UI
        setupUI(resourceTitle, description, fileSize, downloads, rating);
        
        // Setup click listeners
        binding.btnBack.setOnClickListener(v -> onBackPressed());
        binding.btnDownload.setOnClickListener(v -> downloadResource());
        binding.btnPreview.setOnClickListener(v -> previewResource());
        binding.btnBookmark.setOnClickListener(v -> toggleBookmark());
    }
    
    private void setupUI(String title, String description, long fileSize, int downloads, float rating) {
        binding.tvTitle.setText(title != null ? title : "Resource");
        binding.tvResourceTitle.setText(title != null ? title : "Untitled Resource");
        binding.tvDescription.setText(description != null && !description.isEmpty() ? description : "No description available");
        binding.tvDownloads.setText(String.valueOf(downloads));
        binding.tvRating.setText(String.format("%.1f", rating));
        binding.tvFileSize.setText(formatFileSize(fileSize));
    }
    
    private String formatFileSize(long bytes) {
        if (bytes < 1024) return bytes + " B";
        int exp = (int) (Math.log(bytes) / Math.log(1024));
        String pre = "KMGTPE".charAt(exp - 1) + "";
        return String.format("%.1f %sB", bytes / Math.pow(1024, exp), pre);
    }
    
    private void downloadResource() {
        if (resourceUrl == null || resourceUrl.isEmpty()) {
            Toast.makeText(this, "Resource URL not available", Toast.LENGTH_SHORT).show();
            return;
        }
        
        try {
            DownloadManager.Request request = new DownloadManager.Request(Uri.parse(resourceUrl));
            request.setTitle(resourceTitle != null ? resourceTitle : "Resource");
            request.setDescription("Downloading resource...");
            request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
            request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, resourceTitle);
            
            DownloadManager downloadManager = (DownloadManager) getSystemService(Context.DOWNLOAD_SERVICE);
            if (downloadManager != null) {
                downloadManager.enqueue(request);
                Toast.makeText(this, "Download started", Toast.LENGTH_SHORT).show();
            }
        } catch (Exception e) {
            Toast.makeText(this, "Download failed: " + e.getMessage(), Toast.LENGTH_SHORT).show();
        }
    }
    
    private void previewResource() {
        if (resourceUrl == null || resourceUrl.isEmpty()) {
            Toast.makeText(this, "Resource URL not available", Toast.LENGTH_SHORT).show();
            return;
        }
        
        try {
            // Open in browser or external app
            Intent intent = new Intent(Intent.ACTION_VIEW);
            intent.setData(Uri.parse(resourceUrl));
            startActivity(intent);
        } catch (Exception e) {
            Toast.makeText(this, "Cannot preview: " + e.getMessage(), Toast.LENGTH_SHORT).show();
        }
    }
    
    private void toggleBookmark() {
        // TODO: Implement bookmark functionality
        Toast.makeText(this, "Bookmark feature coming soon", Toast.LENGTH_SHORT).show();
    }
    
    @Override
    protected void onDestroy() {
        super.onDestroy();
        binding = null;
    }
}
