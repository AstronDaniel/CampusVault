package com.example.campusvault.ui.main.explore;

import android.content.Intent;
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
import com.example.campusvault.data.local.SharedPreferencesManager;
import com.example.campusvault.data.models.FacultyResponse;
import com.example.campusvault.data.models.ProgramResponse;
import com.example.campusvault.databinding.FragmentExploreBinding;
import com.example.campusvault.ui.main.home.adapters.CourseUnitAdapter;
import com.example.campusvault.ui.main.resources.CourseUnitDetailActivity;
import java.util.ArrayList;

public class ExploreFragment extends Fragment {
    private FragmentExploreBinding binding;
    private ExploreViewModel vm;
    private CourseUnitAdapter courseUnitAdapter;
    
    private ArrayAdapter<FacultyResponse> facultyAdapter;
    private ArrayAdapter<ProgramResponse> programAdapter;
    private ArrayAdapter<String> yearAdapter;
    private ArrayAdapter<String> semesterAdapter;

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
        setupDropdowns();
        setupObservers();

        vm.loadFaculties();
    }

    private void setupRecyclerViews() {
        // Course Units RecyclerView
        courseUnitAdapter = new CourseUnitAdapter(courseUnit -> {
            Intent intent = new Intent(requireContext(), CourseUnitDetailActivity.class);
            intent.putExtra(CourseUnitDetailActivity.EXTRA_COURSE_UNIT_ID, courseUnit.getId());
            intent.putExtra(CourseUnitDetailActivity.EXTRA_COURSE_UNIT_NAME, courseUnit.getName());
            startActivity(intent);
        });
        binding.rvCourseUnits.setLayoutManager(new GridLayoutManager(requireContext(), 2));
        binding.rvCourseUnits.setAdapter(courseUnitAdapter);
    }

    private void setupDropdowns() {
        // Faculty
        facultyAdapter = new ArrayAdapter<>(requireContext(), android.R.layout.simple_dropdown_item_1line, new ArrayList<>());
        binding.actvFaculty.setAdapter(facultyAdapter);
        binding.actvFaculty.setOnItemClickListener((parent, view, position, id) -> {
            FacultyResponse faculty = facultyAdapter.getItem(position);
            if (faculty != null) {
                vm.loadPrograms(faculty.getId());
                binding.tilProgram.setEnabled(true);
                binding.actvProgram.setText("");
                binding.actvYear.setText("");
                binding.actvSemester.setText("");
                binding.tilYear.setEnabled(false);
                binding.tilSemester.setEnabled(false);
                hideCourseUnits();
            }
        });

        // Program
        programAdapter = new ArrayAdapter<>(requireContext(), android.R.layout.simple_dropdown_item_1line, new ArrayList<>());
        binding.actvProgram.setAdapter(programAdapter);
        binding.actvProgram.setOnItemClickListener((parent, view, position, id) -> {
            ProgramResponse program = programAdapter.getItem(position);
            if (program != null) {
                vm.setProgram(program.getId());
                binding.tilYear.setEnabled(true);
                binding.tilSemester.setEnabled(true);
                binding.actvYear.setText("");
                binding.actvSemester.setText("");
                hideCourseUnits();
            }
        });

        // Year
        String[] years = new String[]{"1", "2", "3", "4", "5"};
        yearAdapter = new ArrayAdapter<>(requireContext(), android.R.layout.simple_dropdown_item_1line, years);
        binding.actvYear.setAdapter(yearAdapter);
        binding.actvYear.setOnItemClickListener((parent, view, position, id) -> checkYearSemester());

        // Semester
        String[] semesters = new String[]{"1", "2"};
        semesterAdapter = new ArrayAdapter<>(requireContext(), android.R.layout.simple_dropdown_item_1line, semesters);
        binding.actvSemester.setAdapter(semesterAdapter);
        binding.actvSemester.setOnItemClickListener((parent, view, position, id) -> checkYearSemester());
    }

    private void checkYearSemester() {
        String yearStr = binding.actvYear.getText().toString();
        String semStr = binding.actvSemester.getText().toString();

        if (!yearStr.isEmpty() && !semStr.isEmpty()) {
            try {
                int year = Integer.parseInt(yearStr);
                int semester = Integer.parseInt(semStr);
                vm.setYearAndSemester(year, semester);
            } catch (NumberFormatException e) {
                // Ignore
            }
        }
    }

    private void setupObservers() {
        vm.faculties.observe(getViewLifecycleOwner(), faculties -> {
            facultyAdapter.clear();
            if (faculties != null) {
                facultyAdapter.addAll(faculties);
            }
        });

        vm.programs.observe(getViewLifecycleOwner(), programs -> {
            programAdapter.clear();
            if (programs != null) {
                programAdapter.addAll(programs);
            }
        });

        vm.courseUnits.observe(getViewLifecycleOwner(), courseUnits -> {
            if (courseUnits != null && !courseUnits.isEmpty()) {
                binding.tvCourseUnitsHeader.setVisibility(View.VISIBLE);
                binding.rvCourseUnits.setVisibility(View.VISIBLE);
                binding.layoutEmptyState.setVisibility(View.GONE);
                courseUnitAdapter.submitList(courseUnits);
            } else {
                hideCourseUnits();
                // Only show empty state if filters are selected but no units found
                if (binding.actvProgram.getText().length() > 0 && 
                    binding.actvYear.getText().length() > 0 && 
                    binding.actvSemester.getText().length() > 0) {
                    binding.tvEmptyState.setText("No course units found");
                    binding.layoutEmptyState.setVisibility(View.VISIBLE);
                } else {
                    binding.tvEmptyState.setText("Select filters above to\nfind your course units");
                    binding.layoutEmptyState.setVisibility(View.VISIBLE);
                }
            }
        });

        vm.loading.observe(getViewLifecycleOwner(), isLoading -> {
            binding.progressBar.setVisibility(isLoading ? View.VISIBLE : View.GONE);
            if (isLoading) {
                binding.rvCourseUnits.setVisibility(View.GONE);
                binding.layoutEmptyState.setVisibility(View.GONE);
            }
        });
    }

    private void hideCourseUnits() {
        binding.tvCourseUnitsHeader.setVisibility(View.GONE);
        binding.rvCourseUnits.setVisibility(View.GONE);
        courseUnitAdapter.submitList(null);
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        binding = null;
    }
}
