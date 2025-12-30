package com.example.campusvault.ui.base;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ProgressBar;
import android.widget.Toast;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.viewbinding.ViewBinding;
import com.google.android.material.snackbar.Snackbar;

/**
 * Base Fragment class providing common functionality for all fragments
 * Handles loading states, error handling, and common UI operations
 */
public abstract class BaseFragment<VB extends ViewBinding> extends Fragment {

    protected VB binding;
    private ProgressBar loadingIndicator;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container,
                             @Nullable Bundle savedInstanceState) {
        binding = getViewBinding(inflater, container);
        return binding.getRoot();
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);
        setupUI();
        observeData();
    }

    /**
     * Provide the ViewBinding instance for this fragment
     */
    protected abstract VB getViewBinding(@NonNull LayoutInflater inflater, @Nullable ViewGroup container);

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
        if (getView() != null) {
            Snackbar.make(getView(), message, Snackbar.LENGTH_LONG)
                    .setAction("Dismiss", v -> {})
                    .show();
        }
    }

    /**
     * Show error message with retry action
     */
    protected void showErrorWithRetry(String message, View.OnClickListener retryAction) {
        if (getView() != null) {
            Snackbar.make(getView(), message, Snackbar.LENGTH_INDEFINITE)
                    .setAction("Retry", retryAction)
                    .show();
        }
    }

    /**
     * Show success message using Snackbar
     */
    protected void showSuccess(String message) {
        if (getView() != null) {
            Snackbar.make(getView(), message, Snackbar.LENGTH_SHORT).show();
        }
    }

    /**
     * Show toast message
     */
    protected void showToast(String message) {
        if (getContext() != null) {
            Toast.makeText(getContext(), message, Toast.LENGTH_SHORT).show();
        }
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        binding = null;
    }
}
