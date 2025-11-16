package com.example.campusvault.ui.main.explore;

import android.os.Bundle;
import android.text.TextUtils;
import android.view.KeyEvent;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.view.inputmethod.EditorInfo;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.lifecycle.ViewModelProvider;
import androidx.recyclerview.widget.GridLayoutManager;
import androidx.recyclerview.widget.RecyclerView;

import com.example.campusvault.R;
import com.example.campusvault.data.local.SharedPreferencesManager;
import com.example.campusvault.data.models.Resource;
import com.example.campusvault.databinding.FragmentExploreBinding;
import com.example.campusvault.ui.main.explore.adapters.ResourceGridAdapter;
import com.example.campusvault.ui.main.resources.ResourceDetailActivity;
import com.google.android.material.chip.Chip;

public class ExploreFragment extends Fragment {
    private FragmentExploreBinding binding;
    private ExploreViewModel vm;
    private ResourceGridAdapter adapter;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        binding = FragmentExploreBinding.inflate(inflater, container, false);
        return binding.getRoot();
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        SharedPreferencesManager spm = new SharedPreferencesManager(requireContext());
        vm = new ViewModelProvider(this, new ExploreViewModelFactory(spm)).get(ExploreViewModel.class);

        adapter = new ResourceGridAdapter(this::openDetail);
        GridLayoutManager glm = new GridLayoutManager(requireContext(), 2);
        binding.rvExplore.setLayoutManager(glm);
        binding.rvExplore.setAdapter(adapter);

        binding.swipe.setOnRefreshListener(() -> {
            vm.refresh();
        });

        binding.fabScrollTop.setOnClickListener(v -> binding.rvExplore.smoothScrollToPosition(0));

        // Search action
        binding.etSearch.setOnEditorActionListener((TextView v1, int actionId, KeyEvent event) -> {
            if (actionId == EditorInfo.IME_ACTION_SEARCH) {
                applyFilters(spm);
                return true;
            }
            return false;
        });

        // Initial load
        applyFilters(spm);

        vm.resources.observe(getViewLifecycleOwner(), list -> {
            binding.swipe.setRefreshing(false);
            adapter.submitList(list);
        });

        // Chips interactions
        setChipListeners(spm);
    }

    private void setChipListeners(SharedPreferencesManager spm) {
        for (int i = 0; i < binding.chipYears.getChildCount(); i++) {
            View child = binding.chipYears.getChildAt(i);
            if (child instanceof Chip) {
                child.setOnClickListener(v -> applyFilters(spm));
            }
        }
        for (int i = 0; i < binding.chipSemester.getChildCount(); i++) {
            View child = binding.chipSemester.getChildAt(i);
            if (child instanceof Chip) {
                child.setOnClickListener(v -> applyFilters(spm));
            }
        }
        for (int i = 0; i < binding.chipTags.getChildCount(); i++) {
            View child = binding.chipTags.getChildAt(i);
            if (child instanceof Chip) {
                child.setOnClickListener(v -> applyFilters(spm));
            }
        }
    }

    private void applyFilters(SharedPreferencesManager spm) {
        Integer programId = spm.getUserProgramId();
        Integer year = getSelectedYear();
        Integer sem = getSelectedSemester();

        String query = binding.etSearch.getText() != null ? binding.etSearch.getText().toString().trim() : null;
        String tagQuery = getSelectedTag();
        String finalQuery;
        if (!TextUtils.isEmpty(tagQuery)) {
            finalQuery = TextUtils.isEmpty(query) ? tagQuery : query + " " + tagQuery;
        } else {
            finalQuery = TextUtils.isEmpty(query) ? null : query;
        }

        binding.swipe.setRefreshing(true);
        vm.setFilters(programId, year, sem, finalQuery);
    }

    private Integer getSelectedYear() {
        for (int i = 0; i < binding.chipYears.getChildCount(); i++) {
            View v = binding.chipYears.getChildAt(i);
            if (v instanceof Chip && ((Chip) v).isChecked()) {
                String text = ((Chip) v).getText().toString();
                try {
                    return Integer.parseInt(text.replace("Y", ""));
                } catch (Exception ignored) {}
            }
        }
        return 1;
    }

    private Integer getSelectedSemester() {
        for (int i = 0; i < binding.chipSemester.getChildCount(); i++) {
            View v = binding.chipSemester.getChildAt(i);
            if (v instanceof Chip && ((Chip) v).isChecked()) {
                String text = ((Chip) v).getText().toString();
                try {
                    return Integer.parseInt(text.replace("S", ""));
                } catch (Exception ignored) {}
            }
        }
        return 1;
    }

    private String getSelectedTag() {
        for (int i = 0; i < binding.chipTags.getChildCount(); i++) {
            View v = binding.chipTags.getChildAt(i);
            if (v instanceof Chip && ((Chip) v).isChecked()) {
                return ((Chip) v).getText().toString();
            }
        }
        return null;
    }

    private void openDetail(Resource resource) {
        android.content.Intent intent = new android.content.Intent(requireContext(), ResourceDetailActivity.class);
        intent.putExtra(ResourceDetailActivity.EXTRA_RESOURCE_ID, resource.getId());
        intent.putExtra(ResourceDetailActivity.EXTRA_RESOURCE_TITLE, resource.getTitle());
        intent.putExtra(ResourceDetailActivity.EXTRA_RESOURCE_URL, resource.getFileUrl());
        intent.putExtra(ResourceDetailActivity.EXTRA_RESOURCE_DESCRIPTION, resource.getDescription());
        intent.putExtra(ResourceDetailActivity.EXTRA_RESOURCE_FILE_SIZE, resource.getFileSize());
        intent.putExtra(ResourceDetailActivity.EXTRA_RESOURCE_DOWNLOADS, resource.getDownloadCount());
        intent.putExtra(ResourceDetailActivity.EXTRA_RESOURCE_RATING, resource.getAverageRating());
        startActivity(intent);
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        binding = null;
    }
}
