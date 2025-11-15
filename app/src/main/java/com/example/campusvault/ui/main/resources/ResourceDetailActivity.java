package com.example.campusvault.ui.main.resources;

import android.app.DownloadManager;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.os.Environment;
import android.view.View;
import android.widget.ImageView;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import com.example.campusvault.R;
import com.example.campusvault.databinding.ActivityResourceDetailBinding;
import com.example.campusvault.data.models.Resource;
import com.example.campusvault.data.models.ResourceComment;
import com.example.campusvault.data.models.CommentRequest;
import com.example.campusvault.data.models.RatingRequest;
import com.example.campusvault.data.api.ApiClient;
import com.example.campusvault.data.api.ApiService;
import com.example.campusvault.data.local.SharedPreferencesManager;
import android.widget.Toast;
import io.reactivex.rxjava3.android.schedulers.AndroidSchedulers;
import io.reactivex.rxjava3.schedulers.Schedulers;
import io.reactivex.rxjava3.disposables.CompositeDisposable;
import java.util.ArrayList;
import java.util.List;

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
    private ApiService apiService;
    private CompositeDisposable disposables;
    private CommentsAdapter commentsAdapter;
    private ImageView[] stars;
    private int currentRating = 0;
    private boolean isBookmarked = false;
    
    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        binding = ActivityResourceDetailBinding.inflate(getLayoutInflater());
        setContentView(binding.getRoot());
        
        // Initialize API and disposables
        SharedPreferencesManager prefsManager = new SharedPreferencesManager(this);
        apiService = ApiClient.getInstance(prefsManager).getApiService();
        disposables = new CompositeDisposable();
        
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
        setupRatingStars();
        setupComments();
        
        // Setup click listeners
        binding.btnBack.setOnClickListener(v -> onBackPressed());
        binding.btnDownload.setOnClickListener(v -> downloadResource());
        binding.btnPreview.setOnClickListener(v -> previewResource());
        binding.btnBookmark.setOnClickListener(v -> toggleBookmark());
        
        // Setup comment send button
        binding.tilComment.setEndIconOnClickListener(v -> addComment());
        
        // Load data from API if we have a valid resource ID
        if (resourceId != -1) {
            loadResourceDetails();
            loadComments();
        }
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
            // Record download event with backend
            if (resourceId != -1) {
                disposables.add(
                    apiService.recordDownload(resourceId)
                        .subscribeOn(Schedulers.io())
                        .observeOn(AndroidSchedulers.mainThread())
                        .subscribe(
                            aVoid -> {
                                // Download recorded successfully
                                loadResourceDetails(); // Refresh to show updated download count
                            },
                            throwable -> {
                                // Continue with download even if recording fails
                            }
                        )
                );
            }
            
            // Start actual download using DownloadManager (no permissions needed for Downloads folder)
            DownloadManager.Request request = new DownloadManager.Request(Uri.parse(resourceUrl));
            request.setTitle(resourceTitle != null ? resourceTitle : "Resource");
            request.setDescription("Downloading resource...");
            request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
            
            // Use setDestinationInExternalFilesDir for Android 10+ (no permission needed)
            // Or setDestinationInExternalPublicDir for older versions
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.Q) {
                // Android 10+ - Download to app-specific directory (no permission needed)
                request.setDestinationInExternalFilesDir(this, Environment.DIRECTORY_DOWNLOADS, resourceTitle);
            } else {
                // Older Android - Download to public Downloads folder
                request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, resourceTitle);
            }
            
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
            // Open in-app PDF preview
            Intent intent = new Intent(this, PdfPreviewActivity.class);
            intent.putExtra(PdfPreviewActivity.EXTRA_PDF_URL, resourceUrl);
            intent.putExtra(PdfPreviewActivity.EXTRA_PDF_TITLE, resourceTitle);
            startActivity(intent);
        } catch (Exception e) {
            Toast.makeText(this, "Cannot preview: " + e.getMessage(), Toast.LENGTH_SHORT).show();
        }
    }
    
    private void setupRatingStars() {
        stars = new ImageView[]{
            binding.star1, binding.star2, binding.star3, binding.star4, binding.star5
        };
        
        for (int i = 0; i < stars.length; i++) {
            final int rating = i + 1;
            stars[i].setOnClickListener(v -> rateResource(rating));
        }
    }
    
    private void setupComments() {
        commentsAdapter = new CommentsAdapter();
        binding.rvComments.setLayoutManager(new LinearLayoutManager(this));
        binding.rvComments.setAdapter(commentsAdapter);
    }
    
    private void loadResourceDetails() {
        binding.progressBar.setVisibility(View.VISIBLE);
        
        disposables.add(
            apiService.getResourceById(resourceId)
                .subscribeOn(Schedulers.io())
                .observeOn(AndroidSchedulers.mainThread())
                .subscribe(
                    resource -> {
                        binding.progressBar.setVisibility(View.GONE);
                        // Update UI with fresh data
                        setupUI(resource.getTitle(), resource.getDescription(), 
                               resource.getFileSize(), resource.getDownloadCount(), 
                               resource.getAverageRating());
                        resourceUrl = resource.getFileUrl();
                        resourceTitle = resource.getTitle();
                        
                        // Update bookmark icon
                        isBookmarked = resource.isBookmarked();
                        if (isBookmarked) {
                            binding.btnBookmark.setColorFilter(getColor(R.color.primary));
                        } else {
                            binding.btnBookmark.setColorFilter(getColor(R.color.icon_inactive));
                        }
                        
                        // Update rating stars if user has rated
                        if (resource.getUserRating() != null && resource.getUserRating() > 0) {
                            currentRating = resource.getUserRating();
                            updateStarDisplay(currentRating);
                            binding.tvYourRating.setText("You rated " + currentRating + " stars");
                        } else {
                            binding.tvYourRating.setText("Tap to rate");
                        }
                    },
                    throwable -> {
                        binding.progressBar.setVisibility(View.GONE);
                        Toast.makeText(this, "Failed to load resource details", Toast.LENGTH_SHORT).show();
                    }
                )
        );
    }
    
    private void loadComments() {
        disposables.add(
            apiService.getComments(resourceId)
                .subscribeOn(Schedulers.io())
                .observeOn(AndroidSchedulers.mainThread())
                .subscribe(
                    comments -> {
                        android.util.Log.d("ResourceDetail", "Comments received: " + (comments != null ? comments.size() : "null"));
                        if (comments != null && !comments.isEmpty()) {
                            // Submit null first to force adapter to recognize the new list
                            commentsAdapter.submitList(null);
                            // Then submit the new list
                            commentsAdapter.submitList(new java.util.ArrayList<>(comments));
                            binding.rvComments.setVisibility(View.VISIBLE);
                            binding.tvNoComments.setVisibility(View.GONE);
                        } else {
                            commentsAdapter.submitList(null);
                            binding.rvComments.setVisibility(View.GONE);
                            binding.tvNoComments.setVisibility(View.VISIBLE);
                        }
                    },
                    throwable -> {
                        android.util.Log.e("ResourceDetail", "Error loading comments", throwable);
                        // Show empty state on error
                        commentsAdapter.submitList(null);
                        binding.rvComments.setVisibility(View.GONE);
                        binding.tvNoComments.setVisibility(View.VISIBLE);
                    }
                )
        );
    }
    
    private void rateResource(int rating) {
        currentRating = rating;
        updateStarDisplay(rating);
        binding.tvYourRating.setText("You rated " + rating + " stars");
        
        disposables.add(
            apiService.rateResource(resourceId, new RatingRequest(rating))
                .subscribeOn(Schedulers.io())
                .observeOn(AndroidSchedulers.mainThread())
                .subscribe(
                    resource -> {
                        Toast.makeText(this, "Rating submitted!", Toast.LENGTH_SHORT).show();
                        // Update UI with the returned resource data
                        setupUI(resource.getTitle(), resource.getDescription(), 
                               resource.getFileSize(), resource.getDownloadCount(), 
                               resource.getAverageRating());
                    },
                    throwable -> {
                        Toast.makeText(this, "Failed to submit rating", Toast.LENGTH_SHORT).show();
                    }
                )
        );
    }
    
    private void updateStarDisplay(int rating) {
        for (int i = 0; i < stars.length; i++) {
            if (i < rating) {
                stars[i].setColorFilter(getColor(R.color.star_filled));
            } else {
                stars[i].setColorFilter(getColor(R.color.star_empty));
            }
        }
    }
    
    private void addComment() {
        String content = binding.etComment.getText().toString().trim();
        if (content.isEmpty()) {
            Toast.makeText(this, "Please enter a comment", Toast.LENGTH_SHORT).show();
            return;
        }
        
        binding.tilComment.setEnabled(false);
        
        disposables.add(
            apiService.addComment(resourceId, new CommentRequest(content))
                .subscribeOn(Schedulers.io())
                .observeOn(AndroidSchedulers.mainThread())
                .subscribe(
                    response -> {
                        binding.etComment.setText("");
                        binding.tilComment.setEnabled(true);
                        Toast.makeText(this, "Comment added!", Toast.LENGTH_SHORT).show();
                        loadComments(); // Refresh comments
                    },
                    throwable -> {
                        binding.tilComment.setEnabled(true);
                        Toast.makeText(this, "Failed to add comment", Toast.LENGTH_SHORT).show();
                    }
                )
        );
    }
    
    private void toggleBookmark() {
        if (isBookmarked) {
            // Remove bookmark
            disposables.add(
                apiService.unbookmarkResource(resourceId)
                    .subscribeOn(Schedulers.io())
                    .observeOn(AndroidSchedulers.mainThread())
                    .subscribe(
                        aVoid -> {
                            isBookmarked = false;
                            binding.btnBookmark.setColorFilter(getColor(R.color.icon_inactive));
                            Toast.makeText(this, "Bookmark removed", Toast.LENGTH_SHORT).show();
                        },
                        throwable -> {
                            Toast.makeText(this, "Failed to remove bookmark", Toast.LENGTH_SHORT).show();
                        }
                    )
            );
        } else {
            // Add bookmark
            disposables.add(
                apiService.bookmarkResource(resourceId)
                    .subscribeOn(Schedulers.io())
                    .observeOn(AndroidSchedulers.mainThread())
                    .subscribe(
                        aVoid -> {
                            isBookmarked = true;
                            binding.btnBookmark.setColorFilter(getColor(R.color.primary));
                            Toast.makeText(this, "Bookmarked!", Toast.LENGTH_SHORT).show();
                        },
                        throwable -> {
                            Toast.makeText(this, "Failed to bookmark", Toast.LENGTH_SHORT).show();
                        }
                    )
            );
        }
    }
    
    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (disposables != null) {
            disposables.clear();
        }
        binding = null;
    }
}
