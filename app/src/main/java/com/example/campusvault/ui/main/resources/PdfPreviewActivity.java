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
import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;

public class PdfPreviewActivity extends AppCompatActivity {
    
    public static final String EXTRA_PDF_URL = "extra_pdf_url";
    public static final String EXTRA_PDF_TITLE = "extra_pdf_title";
    
    private ActivityPdfPreviewBinding binding;
    private String pdfUrl;
    private String pdfTitle;
    
    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        binding = ActivityPdfPreviewBinding.inflate(getLayoutInflater());
        setContentView(binding.getRoot());
        
        // Get data from intent
        pdfUrl = getIntent().getStringExtra(EXTRA_PDF_URL);
        pdfTitle = getIntent().getStringExtra(EXTRA_PDF_TITLE);
        
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
            DownloadManager.Request request = new DownloadManager.Request(Uri.parse(pdfUrl));
            request.setTitle(pdfTitle != null ? pdfTitle : "Document");
            request.setDescription("Downloading PDF...");
            request.setNotificationVisibility(DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
            
            // Use appropriate download location based on Android version
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.Q) {
                request.setDestinationInExternalFilesDir(this, Environment.DIRECTORY_DOWNLOADS, pdfTitle + ".pdf");
            } else {
                request.setDestinationInExternalPublicDir(Environment.DIRECTORY_DOWNLOADS, pdfTitle + ".pdf");
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
