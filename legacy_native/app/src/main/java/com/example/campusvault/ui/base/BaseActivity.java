package com.example.campusvault.ui.base;

import android.os.Bundle;
import android.view.View;
import android.widget.ProgressBar;
import android.widget.Toast;
import androidx.annotation.LayoutRes;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.viewbinding.ViewBinding;
import com.google.android.material.snackbar.Snackbar;

/**
 * Base Activity class providing common functionality for all activities
 * Handles loading states, error handling, and common UI operations
 */
public abstract class BaseActivity<VB extends ViewBinding> extends AppCompatActivity {

    protected VB binding;
    private ProgressBar loadingIndicator;

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        binding = getViewBinding();
        setContentView(binding.getRoot());
        setupUI();
        observeData();
    }

    /**
     * Provide the ViewBinding instance for this activity
     */
    protected abstract VB getViewBinding();

    /**
     * Setup UI components and listeners
     */
    protected abstract void setupUI();

    /**
     * Observe ViewModel data and update UI accordingly
     */
    protected abstract void observeData();

    /**
     * Show loading indicator
     */
    protected void showLoading() {
        if (loadingIndicator != null) {
            loadingIndicator.setVisibility(View.VISIBLE);
        }
    }

    /**
     * Hide loading indicator
     */
    protected void hideLoading() {
        if (loadingIndicator != null) {
            loadingIndicator.setVisibility(View.GONE);
        }
    }

    /**
     * Set the loading indicator view
     */
    protected void setLoadingIndicator(ProgressBar progressBar) {
        this.loadingIndicator = progressBar;
    }

    /**
     * Show error message using Snackbar
     */
    protected void showError(String message) {
        Snackbar.make(binding.getRoot(), message, Snackbar.LENGTH_LONG)
                .setAction("Dismiss", v -> {})
                .show();
    }

    /**
     * Show error message with retry action
     */
    protected void showErrorWithRetry(String message, View.OnClickListener retryAction) {
        Snackbar.make(binding.getRoot(), message, Snackbar.LENGTH_INDEFINITE)
                .setAction("Retry", retryAction)
                .show();
    }

    /**
     * Show success message using Snackbar
     */
    protected void showSuccess(String message) {
        Snackbar.make(binding.getRoot(), message, Snackbar.LENGTH_SHORT).show();
    }

    /**
     * Show toast message
     */
    protected void showToast(String message) {
        Toast.makeText(this, message, Toast.LENGTH_SHORT).show();
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        binding = null;
    }
}
