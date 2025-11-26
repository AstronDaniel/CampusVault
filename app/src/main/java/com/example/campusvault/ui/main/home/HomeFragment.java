package com.example.campusvault.ui.main.home;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.lifecycle.ViewModelProvider;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.GridLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import com.example.campusvault.databinding.FragmentHomeBinding;
import com.example.campusvault.ui.base.BaseFragment;
import com.example.campusvault.ui.main.home.adapters.ResourceAdapter;
import com.example.campusvault.ui.main.home.adapters.CourseUnitAdapter;
import com.example.campusvault.data.local.SharedPreferencesManager;
import android.content.Intent;
import com.example.campusvault.ui.main.resources.CourseUnitDetailActivity;
import com.example.campusvault.ui.main.home.adapters.TrendingAdapter;

public class HomeFragment extends BaseFragment<FragmentHomeBinding> {

    private DashboardViewModel viewModel;
    private TrendingAdapter trendingAdapter;
    private ResourceAdapter recentAdapter;
    private CourseUnitAdapter courseUnitAdapter;
    private int selectedYear = 2;
    private int selectedSemester = 1;

    @Override
    protected FragmentHomeBinding getViewBinding(@NonNull LayoutInflater inflater, @Nullable ViewGroup container) {
        return FragmentHomeBinding.inflate(inflater, container, false);
    }

    @Override
    protected void setupUI() {
        setLoadingIndicator(binding.progressBar);

        DashboardViewModelFactory factory = new DashboardViewModelFactory(requireContext());
        viewModel = new ViewModelProvider(this, factory).get(DashboardViewModel.class);

        // Course units grid
        courseUnitAdapter = new CourseUnitAdapter(cu -> {
            Intent i = new Intent(requireContext(), CourseUnitDetailActivity.class);
            i.putExtra(CourseUnitDetailActivity.EXTRA_COURSE_UNIT_ID, cu.getId());
            i.putExtra(CourseUnitDetailActivity.EXTRA_COURSE_UNIT_NAME, cu.getName());
            startActivity(i);
        });
        binding.rvCourseUnits.setLayoutManager(new GridLayoutManager(getContext(), 2));
        binding.rvCourseUnits.setAdapter(courseUnitAdapter);

        // Year chips
        binding.chipYear1.setOnClickListener(v -> { selectedYear = 1; reloadCourseUnits(); });
        binding.chipYear2.setOnClickListener(v -> { selectedYear = 2; reloadCourseUnits(); });
        binding.chipYear3.setOnClickListener(v -> { selectedYear = 3; reloadCourseUnits(); });
        binding.chipYear4.setOnClickListener(v -> { selectedYear = 4; reloadCourseUnits(); });

        // Semester chips
        binding.chipSem1.setOnClickListener(v -> { selectedSemester = 1; reloadCourseUnits(); });
        binding.chipSem2.setOnClickListener(v -> { selectedSemester = 2; reloadCourseUnits(); });

        // Load user info
        loadUserInfo();
    }

    private void loadUserInfo() {
        SharedPreferencesManager prefs = new SharedPreferencesManager(requireContext());
        
        // Set default values first from SharedPreferences
        String storedUsername = prefs.getUserName();
        if (storedUsername != null && !storedUsername.isEmpty()) {
            binding.tvGreeting.setText("Welcome back, " + storedUsername);
        }
        
        // Set loading state
        binding.tvProgram.setText("Loading...");
        binding.tvFaculty.setText("Loading...");
        
        // Get program duration and configure year chips
        int programDuration = prefs.getUserProgramDuration();
        configureYearChips(programDuration);
        
        // Fetch current user from backend
        viewModel.loadCurrentUser(user -> {
            if (user != null) {
                // Update greeting with username from backend
                String username = user.getUsername();
                if (username != null && !username.isEmpty()) {
                    binding.tvGreeting.setText("Welcome back, " + username);
                    prefs.saveUserName(username);
                }
                
                // Get program and faculty IDs
                int programId = user.getProgramId();
                int facultyId = user.getFacultyId();
                
                // Save IDs to preferences
                if (programId > 0) {
                    prefs.saveUserProgramId(programId);
                }
                if (facultyId > 0) {
                    prefs.saveUserFacultyId(facultyId);
                }
                
                // Load program and faculty names
                loadProgramAndFaculty(programId, facultyId);
            } else {
                // Fallback to stored data if backend fails
                int programId = prefs.getUserProgramId();
                int facultyId = prefs.getUserFacultyId();
                
                if (programId > 0 || facultyId > 0) {
                    loadProgramAndFaculty(programId, facultyId);
                } else {
                    binding.tvProgram.setText("Computer Science");
                    binding.tvFaculty.setText("Faculty of Science");
                }
            }
        });
    }
    
    private void loadProgramAndFaculty(int programId, int facultyId) {
        SharedPreferencesManager prefs = new SharedPreferencesManager(requireContext());
        
        if (programId > 0) {
            viewModel.loadProgram(programId, program -> {
                if (program != null) {
                    binding.tvProgram.setText(program.getName());
                    // Save program duration and reconfigure year chips
                    int duration = program.getDurationYears();
                    prefs.saveUserProgramDuration(duration);
                    configureYearChips(duration);
                } else {
                    binding.tvProgram.setText("Computer Science");
                }
            });
        } else {
            binding.tvProgram.setText("No Program");
        }
        
        if (facultyId > 0) {
            viewModel.loadFaculty(facultyId, faculty -> {
                if (faculty != null) {
                    binding.tvFaculty.setText(faculty.getName());
                } else {
                    binding.tvFaculty.setText("Faculty of Science");
                }
            });
        } else {
            binding.tvFaculty.setText("No Faculty");
        }
    }

    @Override
    protected void observeData() {
        viewModel.courseUnits.observe(getViewLifecycleOwner(), list -> {
            if (list != null && !list.isEmpty()) {
                courseUnitAdapter.submitList(list);
                binding.rvCourseUnits.setVisibility(View.VISIBLE);
                binding.shimmerCourseUnits.stopShimmer();
                binding.shimmerCourseUnits.setVisibility(View.GONE);
            } else {
                // Show empty list instead of dummy data
                courseUnitAdapter.submitList(new java.util.ArrayList<>());
                binding.rvCourseUnits.setVisibility(View.VISIBLE);
                binding.shimmerCourseUnits.stopShimmer();
                binding.shimmerCourseUnits.setVisibility(View.GONE);
            }
        });

        viewModel.isLoading.observe(getViewLifecycleOwner(), isLoading -> {
            boolean hasData = viewModel.courseUnits.getValue() != null && !viewModel.courseUnits.getValue().isEmpty();
            
            if (isLoading && !hasData) {
                binding.shimmerCourseUnits.setVisibility(View.VISIBLE);
                binding.shimmerCourseUnits.startShimmer();
                binding.rvCourseUnits.setVisibility(View.GONE);
                binding.progressBar.setVisibility(View.GONE);
            } else {
                binding.shimmerCourseUnits.stopShimmer();
                binding.shimmerCourseUnits.setVisibility(View.GONE);
                binding.progressBar.setVisibility(View.GONE);
            }
        });
    }

    @Override
    public void onResume() {
        super.onResume();
        // Load course units
        reloadCourseUnits();
    }

    /**
     * Configure year chips based on program duration
     */
    private void configureYearChips(int programDuration) {
        // Default to 4 years if not set
        if (programDuration <= 0) {
            programDuration = 4;
        }
        
        // Show/hide year chips based on program duration
        binding.chipYear1.setVisibility(programDuration >= 1 ? View.VISIBLE : View.GONE);
        binding.chipYear2.setVisibility(programDuration >= 2 ? View.VISIBLE : View.GONE);
        binding.chipYear3.setVisibility(programDuration >= 3 ? View.VISIBLE : View.GONE);
        binding.chipYear4.setVisibility(programDuration >= 4 ? View.VISIBLE : View.GONE);
        
        // Set default selected year to 1 if current selection exceeds duration
        if (selectedYear > programDuration) {
            selectedYear = 1;
            binding.chipYear1.setChecked(true);
        }
    }
    
    private void reloadCourseUnits() {
        SharedPreferencesManager prefs = new SharedPreferencesManager(requireContext());
        int programId = prefs.getUserProgramId();
        if (programId > 0) {
            viewModel.loadCourseUnits(programId, selectedYear, selectedSemester);
        } else {
            // fallback: load by year/semester without program (backend supports null)
            viewModel.loadCourseUnits(null, selectedYear, selectedSemester);
        }
    }
}
