package com.example.campusvault.ui.main.profile.resources;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import android.widget.PopupMenu;
import android.widget.Toast;

import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;

import com.example.campusvault.R;
import com.example.campusvault.data.api.ApiClient;
import com.example.campusvault.data.api.ApiService;
import com.example.campusvault.data.local.SharedPreferencesManager;
import com.example.campusvault.data.models.Resource;
import com.example.campusvault.databinding.ActivityMyResourcesBinding;
import com.example.campusvault.ui.main.MainActivity;
import com.google.android.material.dialog.MaterialAlertDialogBuilder;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

import io.reactivex.rxjava3.android.schedulers.AndroidSchedulers;
import io.reactivex.rxjava3.disposables.CompositeDisposable;
import io.reactivex.rxjava3.schedulers.Schedulers;

public class MyResourcesActivity extends AppCompatActivity implements MyResourcesAdapter.OnResourceActionListener {

    private ActivityMyResourcesBinding binding;
    private MyResourcesAdapter adapter;
    private final CompositeDisposable disposables = new CompositeDisposable();
    private ApiService api;
    private List<Resource> allResources = new ArrayList<>();
    private String currentFilter = "all";

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        binding = ActivityMyResourcesBinding.inflate(getLayoutInflater());
        setContentView(binding.getRoot());

        SharedPreferencesManager prefs = new SharedPreferencesManager(this);
        api = ApiClient.getInstance(prefs).getApiService();

        setupToolbar();
        setupRecyclerView();
        setupChipFilters();
        setupFab();
        
        loadResources();
    }

    private void setupToolbar() {
        binding.toolbar.setNavigationOnClickListener(v -> onBackPressed());
    }

    private void setupRecyclerView() {
        adapter = new MyResourcesAdapter(this);
        binding.rvResources.setLayoutManager(new LinearLayoutManager(this));
        binding.rvResources.setAdapter(adapter);
    }

    private void setupChipFilters() {
        binding.chipGroupFilter.setOnCheckedStateChangeListener((group, checkedIds) -> {
            if (checkedIds.isEmpty()) return;
            
            int checkedId = checkedIds.get(0);
            if (checkedId == R.id.chip_all) {
                currentFilter = "all";
            } else if (checkedId == R.id.chip_notes) {
                currentFilter = "notes";
            } else if (checkedId == R.id.chip_past_papers) {
                currentFilter = "past_paper";
            } else if (checkedId == R.id.chip_slides) {
                currentFilter = "slides";
            }
            applyFilter();
        });
    }

    private void setupFab() {
        binding.fabUpload.setOnClickListener(v -> {
            // Navigate to MainActivity and switch to upload tab
            Intent intent = new Intent(this, MainActivity.class);
            intent.putExtra("navigate_to", "upload");
            startActivity(intent);
        });
        
        binding.btnUploadFirst.setOnClickListener(v -> {
            Intent intent = new Intent(this, MainActivity.class);
            intent.putExtra("navigate_to", "upload");
            startActivity(intent);
        });
    }

    private void loadResources() {
        binding.loadingState.setVisibility(View.VISIBLE);
        binding.emptyState.setVisibility(View.GONE);

        disposables.add(api.getMyResources()
                .subscribeOn(Schedulers.io())
                .observeOn(AndroidSchedulers.mainThread())
                .subscribe(
                    resources -> {
                        binding.loadingState.setVisibility(View.GONE);
                        allResources = resources != null ? resources : new ArrayList<>();
                        updateStats();
                        applyFilter();
                    },
                    error -> {
                        binding.loadingState.setVisibility(View.GONE);
                        Toast.makeText(this, "Failed to load resources: " + error.getMessage(), Toast.LENGTH_LONG).show();
                        updateEmptyState(true);
                    }
                ));
    }

    private void updateStats() {
        int totalUploads = allResources.size();
        int totalDownloads = 0;
        float totalRating = 0;
        int resourcesWithRating = 0;

        for (Resource r : allResources) {
            totalDownloads += r.getDownloadCount();
            if (r.getAverageRating() > 0) {
                totalRating += r.getAverageRating();
                resourcesWithRating++;
            }
        }

        float avgRating = resourcesWithRating > 0 ? totalRating / resourcesWithRating : 0;

        binding.tvTotalUploads.setText(String.valueOf(totalUploads));
        binding.tvTotalDownloads.setText(String.valueOf(totalDownloads));
        binding.tvAvgRating.setText(String.format("%.1f", avgRating));
    }

    private void applyFilter() {
        List<Resource> filtered;
        if ("all".equals(currentFilter)) {
            filtered = allResources;
        } else {
            filtered = allResources.stream()
                    .filter(r -> r.getResourceType() != null && 
                            r.getResourceType().toLowerCase().contains(currentFilter.toLowerCase()))
                    .collect(Collectors.toList());
        }

        adapter.submitList(filtered);
        updateEmptyState(filtered.isEmpty());
    }

    private void updateEmptyState(boolean isEmpty) {
        binding.emptyState.setVisibility(isEmpty ? View.VISIBLE : View.GONE);
        binding.rvResources.setVisibility(isEmpty ? View.GONE : View.VISIBLE);
    }

    @Override
    public void onResourceClick(Resource resource) {
        // Open resource detail
        Toast.makeText(this, "Open: " + resource.getTitle(), Toast.LENGTH_SHORT).show();
    }

    @Override
    public void onMoreClick(Resource resource, View anchor) {
        PopupMenu popup = new PopupMenu(this, anchor);
        popup.getMenuInflater().inflate(R.menu.menu_my_resource, popup.getMenu());
        popup.setOnMenuItemClickListener(item -> {
            int itemId = item.getItemId();
            if (itemId == R.id.action_edit) {
                editResource(resource);
                return true;
            } else if (itemId == R.id.action_delete) {
                confirmDeleteResource(resource);
                return true;
            }
            return false;
        });
        popup.show();
    }

    private void editResource(Resource resource) {
        // TODO: Navigate to edit screen
        Toast.makeText(this, "Edit resource - Coming soon", Toast.LENGTH_SHORT).show();
    }

    private void confirmDeleteResource(Resource resource) {
        new MaterialAlertDialogBuilder(this)
                .setTitle("Delete Resource")
                .setMessage("Are you sure you want to delete \"" + resource.getTitle() + "\"? This action cannot be undone.")
                .setPositiveButton("Delete", (dialog, which) -> deleteResource(resource))
                .setNegativeButton("Cancel", null)
                .show();
    }

    private void deleteResource(Resource resource) {
        binding.loadingState.setVisibility(View.VISIBLE);
        
        disposables.add(api.deleteResource(resource.getId())
                .subscribeOn(Schedulers.io())
                .observeOn(AndroidSchedulers.mainThread())
                .subscribe(
                    () -> {
                        binding.loadingState.setVisibility(View.GONE);
                        Toast.makeText(this, "Resource deleted", Toast.LENGTH_SHORT).show();
                        allResources.remove(resource);
                        updateStats();
                        applyFilter();
                    },
                    error -> {
                        binding.loadingState.setVisibility(View.GONE);
                        Toast.makeText(this, "Failed to delete: " + error.getMessage(), Toast.LENGTH_LONG).show();
                    }
                ));
    }

    @Override
    protected void onResume() {
        super.onResume();
        loadResources();
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        disposables.clear();
    }
}
