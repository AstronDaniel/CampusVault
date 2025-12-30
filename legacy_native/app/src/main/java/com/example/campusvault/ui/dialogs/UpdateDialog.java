package com.example.campusvault.ui.dialogs;

import android.app.Dialog;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AlertDialog;
import androidx.fragment.app.DialogFragment;

import com.example.campusvault.R;
import com.example.campusvault.utils.UpdateChecker;
import com.google.android.material.button.MaterialButton;
import com.google.android.material.dialog.MaterialAlertDialogBuilder;

import java.io.File;

/**
 * Dialog to show update available notification with download option
 */
public class UpdateDialog extends DialogFragment implements UpdateChecker.UpdateCallback {

    private static final String ARG_RELEASE = "release";
    
    private UpdateChecker.ReleaseInfo release;
    private UpdateChecker updateChecker;
    
    private TextView tvVersion;
    private TextView tvReleaseNotes;
    private MaterialButton btnUpdate;
    private MaterialButton btnLater;
    private ProgressBar progressBar;
    private TextView tvProgress;
    
    public static UpdateDialog newInstance(UpdateChecker.ReleaseInfo release) {
        UpdateDialog dialog = new UpdateDialog();
        Bundle args = new Bundle();
        // Store release info in a simple way
        args.putString("tagName", release.tagName);
        args.putString("name", release.name);
        args.putString("body", release.body);
        args.putString("htmlUrl", release.htmlUrl);
        dialog.setArguments(args);
        return dialog;
    }
    
    @Override
    public void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setCancelable(false);
        
        if (getArguments() != null) {
            release = new UpdateChecker.ReleaseInfo();
            release.tagName = getArguments().getString("tagName");
            release.name = getArguments().getString("name");
            release.body = getArguments().getString("body");
            release.htmlUrl = getArguments().getString("htmlUrl");
        }
    }

    @NonNull
    @Override
    public Dialog onCreateDialog(@Nullable Bundle savedInstanceState) {
        Context context = requireContext();
        updateChecker = new UpdateChecker(context);
        updateChecker.setCallback(this);
        
        View view = LayoutInflater.from(context).inflate(R.layout.dialog_update, null);
        
        tvVersion = view.findViewById(R.id.tvVersion);
        tvReleaseNotes = view.findViewById(R.id.tvReleaseNotes);
        btnUpdate = view.findViewById(R.id.btnUpdate);
        btnLater = view.findViewById(R.id.btnLater);
        progressBar = view.findViewById(R.id.progressBar);
        tvProgress = view.findViewById(R.id.tvProgress);
        
        // Set version info
        String currentVersion = updateChecker.getCurrentVersion();
        String newVersion = release != null ? release.getVersionName() : "Unknown";
        tvVersion.setText(String.format("Version %s → %s", currentVersion, newVersion));
        
        // Set release notes
        if (release != null && release.body != null && !release.body.isEmpty()) {
            tvReleaseNotes.setText(release.body);
            tvReleaseNotes.setVisibility(View.VISIBLE);
        } else {
            tvReleaseNotes.setVisibility(View.GONE);
        }
        
        // Hide progress initially
        progressBar.setVisibility(View.GONE);
        tvProgress.setVisibility(View.GONE);
        
        btnUpdate.setOnClickListener(v -> {
            if (release != null) {
                // Re-fetch release to get assets
                fetchAndDownload();
            }
        });
        
        btnLater.setOnClickListener(v -> dismiss());
        
        return new MaterialAlertDialogBuilder(context)
                .setView(view)
                .create();
    }
    
    private void fetchAndDownload() {
        // Show progress
        btnUpdate.setEnabled(false);
        btnLater.setEnabled(false);
        progressBar.setVisibility(View.VISIBLE);
        tvProgress.setVisibility(View.VISIBLE);
        tvProgress.setText("Checking update...");
        
        // Fetch full release info with assets
        new UpdateChecker(requireContext()).checkForUpdates();
    }

    @Override
    public void onUpdateAvailable(UpdateChecker.ReleaseInfo fullRelease) {
        if (!isAdded()) return;
        
        requireActivity().runOnUiThread(() -> {
            tvProgress.setText("Downloading update...");
            // Use the full release with assets
            UpdateChecker checker = new UpdateChecker(requireContext());
            checker.setCallback(this);
            checker.downloadUpdate(fullRelease);
        });
    }

    @Override
    public void onNoUpdate() {
        if (!isAdded()) return;
        
        requireActivity().runOnUiThread(() -> {
            Toast.makeText(requireContext(), "No update available", Toast.LENGTH_SHORT).show();
            dismiss();
        });
    }

    @Override
    public void onError(String error) {
        if (!isAdded()) return;
        
        requireActivity().runOnUiThread(() -> {
            progressBar.setVisibility(View.GONE);
            tvProgress.setVisibility(View.GONE);
            btnUpdate.setEnabled(true);
            btnLater.setEnabled(true);
            
            // Offer to open GitHub page instead
            new MaterialAlertDialogBuilder(requireContext())
                    .setTitle("Download Error")
                    .setMessage("Failed to download automatically. Would you like to download from GitHub?")
                    .setPositiveButton("Open GitHub", (dialog, which) -> {
                        if (release != null && release.htmlUrl != null) {
                            Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(release.htmlUrl));
                            startActivity(intent);
                        }
                        dismiss();
                    })
                    .setNegativeButton("Cancel", (dialog, which) -> dismiss())
                    .show();
        });
    }

    @Override
    public void onDownloadStarted() {
        if (!isAdded()) return;
        
        requireActivity().runOnUiThread(() -> {
            tvProgress.setText("Download started...");
            progressBar.setIndeterminate(true);
        });
    }

    @Override
    public void onDownloadComplete(File apkFile) {
        if (!isAdded()) return;
        
        requireActivity().runOnUiThread(() -> {
            tvProgress.setText("Download complete!");
            progressBar.setVisibility(View.GONE);
            
            Toast.makeText(requireContext(), "Update downloaded. Installing...", Toast.LENGTH_SHORT).show();
            
            UpdateChecker checker = new UpdateChecker(requireContext());
            checker.installApk(apkFile);
            
            dismiss();
        });
    }

    @Override
    public void onDownloadFailed(String error) {
        if (!isAdded()) return;
        
        requireActivity().runOnUiThread(() -> {
            onError(error);
        });
    }
}
