package com.example.campusvault.ui.main.explore;

import android.content.Intent;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.lifecycle.ViewModelProvider;
import androidx.recyclerview.widget.LinearLayoutManager;
import com.example.campusvault.data.local.SharedPreferencesManager;
import com.example.campusvault.data.models.FacultyResponse;
import com.example.campusvault.databinding.FragmentExploreBinding;
import com.example.campusvault.ui.main.explore.adapters.FacultyAdapter;

public class ExploreFragment extends Fragment {
    private FragmentExploreBinding binding;
    private ExploreViewModel vm;
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
        vm = new ViewModelProvider(this, new ExploreViewModelFactory(requireActivity().getApplication(), spm)).get(ExploreViewModel.class);

        setupRecyclerView();
        setupObservers();

        vm.loadFaculties();
    }

    private void setupRecyclerView() {
        facultyAdapter = new FacultyAdapter(facultyId -> {
            // Find the faculty by ID to get name and code
            if (vm.faculties.getValue() != null) {
                for (FacultyResponse faculty : vm.faculties.getValue()) {
                    if (faculty.getId() == facultyId) {
                        openFacultyDetail(faculty);
                        break;
                    }
                }
            }
        });
        binding.rvFaculties.setLayoutManager(new LinearLayoutManager(requireContext()));
        binding.rvFaculties.setAdapter(facultyAdapter);
    }

    private void openFacultyDetail(FacultyResponse faculty) {
        Intent intent = new Intent(requireContext(), FacultyDetailActivity.class);
        intent.putExtra(FacultyDetailActivity.EXTRA_FACULTY_ID, faculty.getId());
        intent.putExtra(FacultyDetailActivity.EXTRA_FACULTY_NAME, faculty.getName());
        intent.putExtra(FacultyDetailActivity.EXTRA_FACULTY_CODE, faculty.getCode());
        startActivity(intent);
    }

    private void setupObservers() {
        vm.faculties.observe(getViewLifecycleOwner(), faculties -> {
            if (faculties != null && !faculties.isEmpty()) {
                facultyAdapter.submitList(faculties);
                binding.rvFaculties.setVisibility(View.VISIBLE);
                binding.layoutEmptyState.setVisibility(View.GONE);
                binding.tvFacultiesHeader.setText("All Faculties (" + faculties.size() + ")");
            } else {
                binding.rvFaculties.setVisibility(View.GONE);
                binding.layoutEmptyState.setVisibility(View.VISIBLE);
            }
        });

        vm.loading.observe(getViewLifecycleOwner(), isLoading -> {
            // Show skeleton during loading if no data yet
            boolean hasData = vm.faculties.getValue() != null && !vm.faculties.getValue().isEmpty();
            
            if (isLoading && !hasData) {
                binding.shimmerFaculties.setVisibility(View.VISIBLE);
                binding.shimmerFaculties.startShimmer();
                binding.rvFaculties.setVisibility(View.GONE);
                binding.layoutEmptyState.setVisibility(View.GONE);
            } else {
                binding.shimmerFaculties.stopShimmer();
                binding.shimmerFaculties.setVisibility(View.GONE);
            }
        });
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        binding = null;
    }
}
