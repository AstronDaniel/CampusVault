package com.example.campusvault.ui.main.resources;

import android.app.DownloadManager;
import android.content.Context;
import android.net.Uri;
import android.os.Bundle;
import android.os.Environment;
import android.view.View;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import com.example.campusvault.databinding.ActivityPdfPreviewBinding;
import java.io.File;
import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;

public class PdfPreviewActivity extends AppCompatActivity {
    
    public static final String EXTRA_PDF_URL = "extra_pdf_url";
    public static final String EXTRA_PDF_TITLE = "extra_pdf_title";
    public static final String EXTRA_RESOURCE_ID = "extra_resource_id";
    
    private ActivityPdfPreviewBinding binding;
    private String pdfUrl;
    private String pdfTitle;
    private int resourceId = -1;
    private com.example.campusvault.data.api.ApiService apiService;
    private com.example.campusvault.data.local.SharedPreferencesManager prefs;
    
    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        binding = ActivityPdfPreviewBinding.inflate(getLayoutInflater());
        setContentView(binding.getRoot());
        
        // Get data from intent
        pdfUrl = getIntent().getStringExtra(EXTRA_PDF_URL);
        pdfTitle = getIntent().getStringExtra(EXTRA_PDF_TITLE);
        resourceId = getIntent().getIntExtra(EXTRA_RESOURCE_ID, -1);

        // Init API for recording downloads
        prefs = new com.example.campusvault.data.local.SharedPreferencesManager(this);
        apiService = com.example.campusvault.data.api.ApiClient.getInstance(prefs).getApiService();
        
        if (pdfUrl == null || pdfUrl.isEmpty()) {
            showError("Invalid PDF URL");
            return;
        }
        
        // Setup UI
        binding.tvTitle.setText(pdfTitle != null ? pdfTitle : "PDF Preview");
        binding.btnBack.setOnClickListener(v -> onBackPressed());
        binding.btnDownload.setOnClickListener(v -> downloadPdf());
        binding.btnRetry.setOnClickListener(v -> loadPdf());
        
        // Load PDF
        loadPdf();
    }
    
    private void loadPdf() {
        binding.progressBar.setVisibility(View.VISIBLE);
        binding.errorLayout.setVisibility(View.GONE);
        binding.webView.setVisibility(View.VISIBLE);
        
        // Configure WebView
        WebSettings webSettings = binding.webView.getSettings();
        webSettings.setJavaScriptEnabled(true);
        webSettings.setLoadWithOverviewMode(true);
        webSettings.setUseWideViewPort(true);
        webSettings.setBuiltInZoomControls(true);
        webSettings.setDisplayZoomControls(false);
        webSettings.setSupportZoom(true);
        
        // Set WebView clients
        binding.webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageFinished(WebView view, String url) {
                binding.progressBar.setVisibility(View.GONE);
            }
            
            @Override
            public void onReceivedError(WebView view, int errorCode, String description, String failingUrl) {
                showError("Error loading PDF: " + description);
            }
        });
        
        binding.webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView view, int newProgress) {
                // Could add progress bar update here
            }
        });
        
        // Load PDF using Google Docs Viewer
        try {
            String encodedUrl = URLEncoder.encode(pdfUrl, "UTF-8");
            String googleDocsUrl = "https://docs.google.com/gview?embedded=true&url=" + encodedUrl;
            binding.webView.loadUrl(googleDocsUrl);
        } catch (UnsupportedEncodingException e) {
            showError("Error encoding URL: " + e.getMessage());
        }
    }
    
    private void showError(String message) {
        binding.progressBar.setVisibility(View.GONE);
        binding.webView.setVisibility(View.GONE);
        binding.errorLayout.setVisibility(View.VISIBLE);
        binding.tvError.setText(message);
    }
    
    private void downloadPdf() {
        if (pdfUrl == null || pdfUrl.isEmpty()) {
            Toast.makeText(this, "PDF URL not available", Toast.LENGTH_SHORT).show();
            return;
        }
        
        try {
            // Record download in backend (if id provided)
            if (resourceId != -1) {
                apiService.recordDownload(resourceId)
                    .subscribeOn(io.reactivex.rxjava3.schedulers.Schedulers.io())
                    .observeOn(io.reactivex.rxjava3.android.schedulers.AndroidSchedulers.mainThread())
                    .subscribe(
                        resource -> {},
                        throwable -> {}
                    );
            }
            DownloadManager.Request request = new DownloadManager.Request(Uri.parse(pdfUrl));
            String safeName = sanitizeFileName(pdfTitle);
            String ext = guessExtensionFromUrl(pdfUrl);
            String finalName = safeName + (ext.isEmpty() ? "" : ext);
            request.setTitle(pdfTitle != null ? pdfTitle : "Document");
            request.setDescription("Downloading PDF...");
            request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
            
            // Create CampusVault folder in Downloads and download there
            File downloadsDir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS);
            File campusVaultDir = new File(downloadsDir, "CampusVault");
            if (!campusVaultDir.exists()) {
                campusVaultDir.mkdirs();
            }
            request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, "CampusVault/" + finalName);
            
            DownloadManager downloadManager = (DownloadManager) getSystemService(Context.DOWNLOAD_SERVICE);
            if (downloadManager != null) {
                downloadManager.enqueue(request);
                Toast.makeText(this, "Download started", Toast.LENGTH_SHORT).show();
            }
        } catch (Exception e) {
            Toast.makeText(this, "Download failed: " + e.getMessage(), Toast.LENGTH_SHORT).show();
        }
    }

    private String sanitizeFileName(String name) {
        String base = (name == null || name.isEmpty()) ? "document" : name;
        return base.replaceAll("[\\\\/:*?\"<>|]", "_").trim();
    }

    private String guessExtensionFromUrl(String url) {
        try {
            String path = Uri.parse(url).getLastPathSegment();
            if (path != null && path.contains(".")) {
                String ext = path.substring(path.lastIndexOf('.'));
                if (ext.matches("\\.(?i)(pdf|doc|docx|ppt|pptx|xls|xlsx|txt)")) return ext;
            }
        } catch (Exception ignored) {}
        return ".pdf";
    }
    
    @Override
    public void onBackPressed() {
        if (binding.webView.canGoBack()) {
            binding.webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
    
    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (binding.webView != null) {
            binding.webView.destroy();
        }
        binding = null;
    }
}
