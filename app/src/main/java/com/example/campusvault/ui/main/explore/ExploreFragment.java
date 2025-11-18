package com.example.campusvault.ui.main.explore;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ArrayAdapter;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.lifecycle.ViewModelProvider;
import androidx.recyclerview.widget.GridLayoutManager;
import androidx.recyclerview.widget.LinearLayoutManager;
import com.example.campusvault.R;
import com.example.campusvault.data.local.SharedPreferencesManager;
import com.example.campusvault.data.models.Resource;
import com.example.campusvault.databinding.FragmentExploreBinding;
import com.example.campusvault.ui.main.explore.adapters.FacultyAdapter;
import com.example.campusvault.ui.main.explore.adapters.ResourceAdapter;
import com.example.campusvault.ui.main.resources.ResourceDetailActivity;
import com.google.android.material.chip.Chip;
import com.jakewharton.rxbinding4.widget.RxTextView;
import io.reactivex.rxjava3.android.schedulers.AndroidSchedulers;
import java.util.concurrent.TimeUnit;

public class ExploreFragment extends Fragment {
    private FragmentExploreBinding binding;
    private ExploreViewModel vm;
    private ResourceAdapter resourceAdapter;
    private FacultyAdapter facultyAdapter;

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

        setupRecyclerViews();
        setupObservers();
        setupSearch();
        setupFilters();

        vm.loadFaculties();
    }

    private void setupRecyclerViews() {
        // Faculty RecyclerView
        facultyAdapter = new FacultyAdapter(facultyId -> vm.loadPrograms(facultyId));
        binding.rvFaculty.setLayoutManager(new LinearLayoutManager(requireContext(), LinearLayoutManager.HORIZONTAL, false));
        binding.rvFaculty.setAdapter(facultyAdapter);

        // Resource RecyclerView
        resourceAdapter = new ResourceAdapter(this::openDetail);
        binding.rvResources.setLayoutManager(new GridLayoutManager(requireContext(), 2));
        binding.rvResources.setAdapter(resourceAdapter);
    }

    private void setupObservers() {
        vm.faculties.observe(getViewLifecycleOwner(), faculties -> {
            facultyAdapter.submitList(faculties);
            if (faculties != null && !faculties.isEmpty()) {
                vm.loadPrograms(faculties.get(0).getId());
            }
        });

        vm.programs.observe(getViewLifecycleOwner(), programs -> {
            binding.chipPrograms.removeAllViews();
            if (programs == null) return;
            for (com.example.campusvault.data.models.ProgramResponse p : programs) {
                Chip chip = new Chip(requireContext());
                chip.setText(p.getName());
                chip.setCheckable(true);
                chip.setOnClickListener(v -> vm.setProgramAndQuery(p.getId(), null));
                binding.chipPrograms.addView(chip);
            }
            if (binding.chipPrograms.getChildCount() > 0) {
                ((Chip) binding.chipPrograms.getChildAt(0)).setChecked(true);
            }
        });

        vm.resourcesPaged.observe(getViewLifecycleOwner(), resources -> {
            resourceAdapter.submitList(resources);
        });

        vm.loading.observe(getViewLifecycleOwner(), isLoading -> {
            if (isLoading) {
                binding.shimmerViewContainer.startShimmer();
                binding.shimmerViewContainer.setVisibility(View.VISIBLE);
                binding.rvResources.setVisibility(View.GONE);
            } else {
                binding.shimmerViewContainer.stopShimmer();
                binding.shimmerViewContainer.setVisibility(View.GONE);
                binding.rvResources.setVisibility(View.VISIBLE);
            }
        });

        vm.suggestions.observe(getViewLifecycleOwner(), suggestions -> {
            ArrayAdapter<String> adapter = new ArrayAdapter<>(requireContext(), android.R.layout.simple_dropdown_item_1line, suggestions);
            binding.etSearch.setAdapter(adapter);
        });
    }

    private void setupSearch() {
        RxTextView.textChanges(binding.etSearch)
                .debounce(300, TimeUnit.MILLISECONDS)
                .observeOn(AndroidSchedulers.mainThread())
                .subscribe(text -> {
                    if (text.length() > 2) {
                        vm.loadSuggestions(text.toString());
                    }
                    vm.setProgramAndQuery(null, text.toString());
                });
    }

    private void setupFilters() {
        // Resource Type Chips
        binding.chipResourceTypes.setOnCheckedChangeListener((group, checkedId) -> {
            Chip chip = group.findViewById(checkedId);
            if (chip != null) {
                vm.setResourceType(chip.getText().toString());
            }
        });

        // Advanced Filters
        binding.fabFilter.setOnClickListener(v -> {
            // Open bottom sheet for advanced filters
        });
    }

    private void openDetail(Resource resource) {
        android.content.Intent intent = new android.content.Intent(requireContext(), ResourceDetailActivity.class);
        intent.putExtra(ResourceDetailActivity.EXTRA_RESOURCE_ID, resource.getId());
        startActivity(intent);
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        binding = null;
    }
}
