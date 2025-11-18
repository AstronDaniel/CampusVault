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
    private Integer selectedProgramId = null;

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

        // Observe lists
        vm.faculties.observe(getViewLifecycleOwner(), list -> {
            populateFacultyChips(list);
            if (list != null && !list.isEmpty()) {
                // auto-select first faculty
                selectFirstChip(binding.chipFaculties);
                com.google.android.material.chip.Chip chip = (com.google.android.material.chip.Chip) binding.chipFaculties.getChildAt(0);
                if (chip != null) chip.performClick();
            }
        });

        vm.programs.observe(getViewLifecycleOwner(), list -> {
            populateProgramChips(list);
            if (list != null && !list.isEmpty()) {
                selectFirstChip(binding.chipPrograms);
                com.google.android.material.chip.Chip chip = (com.google.android.material.chip.Chip) binding.chipPrograms.getChildAt(0);
                if (chip != null) chip.performClick();
            }
        });

        vm.resources.observe(getViewLifecycleOwner(), list -> {
            binding.swipe.setRefreshing(false);
            adapter.submitList(list);
        });

        // Initial load
        vm.loadFaculties();
    }


    private void populateFacultyChips(java.util.List<com.example.campusvault.data.models.FacultyResponse> faculties) {
        binding.chipFaculties.removeAllViews();
        if (faculties == null) return;
        for (com.example.campusvault.data.models.FacultyResponse f : faculties) {
            Chip chip = new Chip(requireContext());
            chip.setText(f.getName());
            chip.setCheckable(true);
            chip.setOnClickListener(v -> vm.loadPrograms(f.getId()));
            binding.chipFaculties.addView(chip);
        }
    }

    private void populateProgramChips(java.util.List<com.example.campusvault.data.models.ProgramResponse> programs) {
        binding.chipPrograms.removeAllViews();
        if (programs == null) return;
        for (com.example.campusvault.data.models.ProgramResponse p : programs) {
            Chip chip = new Chip(requireContext());
            chip.setText(p.getName());
            chip.setCheckable(true);
            chip.setOnClickListener(v -> {
                selectedProgramId = p.getId();
                applyFiltersForProgram(p.getId());
            });
            binding.chipPrograms.addView(chip);
        }
    }

    private void applyFilters(SharedPreferencesManager spm) {
        // Use currently selected program chip
        applyFiltersWithProgram(selectedProgramId);
    }

    private void applyFiltersForProgram(Integer programId) {
        applyFiltersWithProgram(programId);
    }

    private void applyFiltersWithProgram(Integer programId) {
        String query = binding.etSearch.getText() != null ? binding.etSearch.getText().toString().trim() : null;
        binding.swipe.setRefreshing(true);
        vm.setProgramAndQuery(programId, TextUtils.isEmpty(query) ? null : query);
    }

    

    private void selectFirstChip(com.google.android.material.chip.ChipGroup group) {
        if (group.getChildCount() > 0 && group.getChildAt(0) instanceof Chip) {
            ((Chip) group.getChildAt(0)).setChecked(true);
        }
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
