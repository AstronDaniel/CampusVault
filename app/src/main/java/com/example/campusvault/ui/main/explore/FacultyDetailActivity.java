package com.example.campusvault.ui.main.explore;

import android.content.Intent;
import android.os.Bundle;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.View;
import android.widget.ArrayAdapter;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.lifecycle.ViewModelProvider;
import androidx.recyclerview.widget.GridLayoutManager;
import androidx.recyclerview.widget.LinearLayoutManager;
import com.example.campusvault.R;
import com.example.campusvault.data.local.SharedPreferencesManager;
import com.example.campusvault.data.models.CourseUnit;
import com.example.campusvault.data.models.ProgramResponse;
import com.example.campusvault.databinding.ActivityFacultyDetailBinding;
import com.example.campusvault.ui.main.explore.adapters.ProgramAdapter;
import com.example.campusvault.ui.main.home.adapters.CourseUnitAdapter;
import com.example.campusvault.ui.main.resources.CourseUnitDetailActivity;
import java.util.ArrayList;
import java.util.List;

public class FacultyDetailActivity extends AppCompatActivity {
    public static final String EXTRA_FACULTY_ID = "extra_faculty_id";
    public static final String EXTRA_FACULTY_NAME = "extra_faculty_name";
    public static final String EXTRA_FACULTY_CODE = "extra_faculty_code";

    private ActivityFacultyDetailBinding binding;
    private FacultyDetailViewModel vm;
    private ProgramAdapter programAdapter;
    private CourseUnitAdapter courseUnitAdapter;
    
    private List<ProgramResponse> allPrograms = new ArrayList<>();
    private List<CourseUnit> allCourseUnits = new ArrayList<>();
    private ArrayAdapter<String> searchAdapter;

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        binding = ActivityFacultyDetailBinding.inflate(getLayoutInflater());
        setContentView(binding.getRoot());

        int facultyId = getIntent().getIntExtra(EXTRA_FACULTY_ID, -1);
        String facultyName = getIntent().getStringExtra(EXTRA_FACULTY_NAME);
        String facultyCode = getIntent().getStringExtra(EXTRA_FACULTY_CODE);

        // Set header info
        binding.tvFacultyName.setText(facultyName != null ? facultyName : "Faculty");
        binding.tvFacultyCode.setText(facultyCode != null ? facultyCode : "");
        
        // Back button
        binding.btnBack.setOnClickListener(v -> onBackPressed());

        // Setup ViewModel
        SharedPreferencesManager spm = new SharedPreferencesManager(this);
        vm = new ViewModelProvider(this, new FacultyDetailViewModelFactory(getApplication(), spm))
                .get(FacultyDetailViewModel.class);

        setupRecyclerViews();
        setupSearch();
        setupChipFilters();
        setupObservers();

        // Load data
        if (facultyId != -1) {
            vm.loadPrograms(facultyId);
            vm.loadAllCourseUnitsForFaculty(facultyId);
        }
    }

    private void setupRecyclerViews() {
        // Programs RecyclerView
        programAdapter = new ProgramAdapter(program -> {
            // On program click - could expand or navigate
            vm.loadCourseUnitsForProgram(program.getId());
        });
        binding.rvPrograms.setLayoutManager(new LinearLayoutManager(this));
        binding.rvPrograms.setAdapter(programAdapter);

        // Course Units RecyclerView
        courseUnitAdapter = new CourseUnitAdapter(courseUnit -> {
            Intent intent = new Intent(this, CourseUnitDetailActivity.class);
            intent.putExtra(CourseUnitDetailActivity.EXTRA_COURSE_UNIT_ID, courseUnit.getId());
            intent.putExtra(CourseUnitDetailActivity.EXTRA_COURSE_UNIT_NAME, courseUnit.getName());
            startActivity(intent);
        });
        binding.rvCourseUnits.setLayoutManager(new GridLayoutManager(this, 2));
        binding.rvCourseUnits.setAdapter(courseUnitAdapter);
    }

    private void setupSearch() {
        searchAdapter = new ArrayAdapter<>(this, android.R.layout.simple_dropdown_item_1line, new ArrayList<>());
        binding.searchView.setAdapter(searchAdapter);
        binding.searchView.setThreshold(1);

        binding.searchView.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {}

            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {
                filterContent(s.toString());
            }

            @Override
            public void afterTextChanged(Editable s) {}
        });

        binding.searchView.setOnItemClickListener((parent, view, position, id) -> {
            String selected = searchAdapter.getItem(position);
            if (selected != null) {
                // Find matching course unit
                for (CourseUnit cu : allCourseUnits) {
                    String display = cu.getCode() + " - " + cu.getName();
                    if (display.equals(selected)) {
                        Intent intent = new Intent(this, CourseUnitDetailActivity.class);
                        intent.putExtra(CourseUnitDetailActivity.EXTRA_COURSE_UNIT_ID, cu.getId());
                        intent.putExtra(CourseUnitDetailActivity.EXTRA_COURSE_UNIT_NAME, cu.getName());
                        startActivity(intent);
                        break;
                    }
                }
            }
        });
    }

    private void filterContent(String query) {
        if (query.isEmpty()) {
            programAdapter.submitList(allPrograms);
            courseUnitAdapter.submitList(allCourseUnits);
            updateSearchSuggestions();
            return;
        }

        String lowerQuery = query.toLowerCase();

        // Filter programs
        List<ProgramResponse> filteredPrograms = new ArrayList<>();
        for (ProgramResponse p : allPrograms) {
            if (p.getName().toLowerCase().contains(lowerQuery) ||
                (p.getCode() != null && p.getCode().toLowerCase().contains(lowerQuery))) {
                filteredPrograms.add(p);
            }
        }
        programAdapter.submitList(filteredPrograms);

        // Filter course units
        List<CourseUnit> filteredCUs = new ArrayList<>();
        for (CourseUnit cu : allCourseUnits) {
            if (cu.getName().toLowerCase().contains(lowerQuery) ||
                (cu.getCode() != null && cu.getCode().toLowerCase().contains(lowerQuery))) {
                filteredCUs.add(cu);
            }
        }
        courseUnitAdapter.submitList(filteredCUs);
    }

    private void updateSearchSuggestions() {
        List<String> suggestions = new ArrayList<>();
        for (ProgramResponse p : allPrograms) {
            suggestions.add(p.getCode() + " - " + p.getName());
        }
        for (CourseUnit cu : allCourseUnits) {
            suggestions.add(cu.getCode() + " - " + cu.getName());
        }
        searchAdapter.clear();
        searchAdapter.addAll(suggestions);
    }

    private void setupChipFilters() {
        binding.chipGroupFilters.setOnCheckedStateChangeListener((group, checkedIds) -> {
            if (checkedIds.contains(R.id.chipAll)) {
                binding.programsSection.setVisibility(View.VISIBLE);
                binding.courseUnitsSection.setVisibility(View.VISIBLE);
            } else if (checkedIds.contains(R.id.chipPrograms)) {
                binding.programsSection.setVisibility(View.VISIBLE);
                binding.courseUnitsSection.setVisibility(View.GONE);
            } else if (checkedIds.contains(R.id.chipCourseUnits)) {
                binding.programsSection.setVisibility(View.GONE);
                binding.courseUnitsSection.setVisibility(View.VISIBLE);
            }
        });
    }

    private void setupObservers() {
        vm.programs.observe(this, programs -> {
            if (programs != null && !programs.isEmpty()) {
                allPrograms = new ArrayList<>(programs);
                programAdapter.submitList(programs);
                binding.programsSection.setVisibility(View.VISIBLE);
                binding.tvProgramsHeader.setText("Programs (" + programs.size() + ")");
                updateSearchSuggestions();
            } else {
                binding.programsSection.setVisibility(View.GONE);
            }
        });

        vm.courseUnits.observe(this, courseUnits -> {
            if (courseUnits != null && !courseUnits.isEmpty()) {
                allCourseUnits = new ArrayList<>(courseUnits);
                courseUnitAdapter.submitList(courseUnits);
                binding.courseUnitsSection.setVisibility(View.VISIBLE);
                binding.tvCourseUnitsHeader.setText("Course Units (" + courseUnits.size() + ")");
                updateSearchSuggestions();
            } else {
                binding.courseUnitsSection.setVisibility(View.GONE);
            }
        });

        vm.loading.observe(this, isLoading -> {
            if (isLoading) {
                binding.shimmerPrograms.setVisibility(View.VISIBLE);
                binding.shimmerPrograms.startShimmer();
                binding.shimmerCourseUnits.setVisibility(View.VISIBLE);
                binding.shimmerCourseUnits.startShimmer();
            } else {
                binding.shimmerPrograms.stopShimmer();
                binding.shimmerPrograms.setVisibility(View.GONE);
                binding.shimmerCourseUnits.stopShimmer();
                binding.shimmerCourseUnits.setVisibility(View.GONE);
            }
        });

        // Show empty state when both are empty
        vm.programs.observe(this, programs -> updateEmptyState());
        vm.courseUnits.observe(this, courseUnits -> updateEmptyState());
    }

    private void updateEmptyState() {
        Boolean loading = vm.loading.getValue();
        List<ProgramResponse> programs = vm.programs.getValue();
        List<CourseUnit> courseUnits = vm.courseUnits.getValue();
        
        boolean noData = (programs == null || programs.isEmpty()) && 
                         (courseUnits == null || courseUnits.isEmpty());
        boolean notLoading = loading == null || !loading;
        
        binding.layoutEmptyState.setVisibility(noData && notLoading ? View.VISIBLE : View.GONE);
    }
}
