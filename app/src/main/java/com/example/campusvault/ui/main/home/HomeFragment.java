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
    private int selectedYear = 1;
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
        if (programId > 0) {
            viewModel.loadProgram(programId, program -> {
                if (program != null) {
                    binding.tvProgram.setText(program.getName());
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
            } else {
                // Load dummy data if no real data
                courseUnitAdapter.submitList(createDummyCourseUnits());
            }
        });
    }

    @Override
    public void onResume() {
        super.onResume();
        // Load course units
        reloadCourseUnits();
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

    private java.util.List<com.example.campusvault.data.models.CourseUnit> createDummyCourseUnits() {
        java.util.List<com.example.campusvault.data.models.CourseUnit> list = new java.util.ArrayList<>();
        
        // Generate different courses based on selected year and semester
        if (selectedYear == 1 && selectedSemester == 1) {
            addCourse(list, 1, "CSC101", "Introduction to Programming");
            addCourse(list, 2, "MAT101", "Calculus I");
            addCourse(list, 3, "PHY101", "Physics I");
            addCourse(list, 4, "ENG101", "English Composition");
            addCourse(list, 5, "CHM101", "General Chemistry");
            addCourse(list, 6, "BIO101", "Biology Fundamentals");
        } else if (selectedYear == 1 && selectedSemester == 2) {
            addCourse(list, 7, "CSC102", "Data Structures");
            addCourse(list, 8, "MAT102", "Calculus II");
            addCourse(list, 9, "PHY102", "Physics II");
            addCourse(list, 10, "ENG102", "Technical Writing");
            addCourse(list, 11, "CHM102", "Organic Chemistry");
            addCourse(list, 12, "STA101", "Statistics");
        } else if (selectedYear == 2 && selectedSemester == 1) {
            addCourse(list, 13, "CSC201", "Algorithms");
            addCourse(list, 14, "CSC202", "Computer Architecture");
            addCourse(list, 15, "MAT201", "Linear Algebra");
            addCourse(list, 16, "CSC203", "Database Systems");
            addCourse(list, 17, "CSC204", "Operating Systems");
            addCourse(list, 18, "MAT202", "Discrete Mathematics");
        } else if (selectedYear == 2 && selectedSemester == 2) {
            addCourse(list, 19, "CSC205", "Software Engineering");
            addCourse(list, 20, "CSC206", "Web Development");
            addCourse(list, 21, "CSC207", "Computer Networks");
            addCourse(list, 22, "CSC208", "Object-Oriented Programming");
            addCourse(list, 23, "MAT203", "Probability Theory");
            addCourse(list, 24, "CSC209", "Mobile App Development");
        } else if (selectedYear == 3 && selectedSemester == 1) {
            addCourse(list, 25, "CSC301", "Artificial Intelligence");
            addCourse(list, 26, "CSC302", "Machine Learning");
            addCourse(list, 27, "CSC303", "Computer Graphics");
            addCourse(list, 28, "CSC304", "Cybersecurity");
            addCourse(list, 29, "CSC305", "Cloud Computing");
            addCourse(list, 30, "CSC306", "Data Mining");
        } else if (selectedYear == 3 && selectedSemester == 2) {
            addCourse(list, 31, "CSC307", "Distributed Systems");
            addCourse(list, 32, "CSC308", "Compiler Design");
            addCourse(list, 33, "CSC309", "Human-Computer Interaction");
            addCourse(list, 34, "CSC310", "Software Testing");
            addCourse(list, 35, "CSC311", "Big Data Analytics");
            addCourse(list, 36, "CSC312", "Blockchain Technology");
        } else if (selectedYear == 4 && selectedSemester == 1) {
            addCourse(list, 37, "CSC401", "Advanced AI");
            addCourse(list, 38, "CSC402", "Deep Learning");
            addCourse(list, 39, "CSC403", "IoT Systems");
            addCourse(list, 40, "CSC404", "Research Methods");
            addCourse(list, 41, "CSC405", "Project Management");
            addCourse(list, 42, "CSC406", "Ethics in Computing");
        } else if (selectedYear == 4 && selectedSemester == 2) {
            addCourse(list, 43, "CSC407", "Final Year Project I");
            addCourse(list, 44, "CSC408", "Final Year Project II");
            addCourse(list, 45, "CSC409", "Entrepreneurship");
            addCourse(list, 46, "CSC410", "Industry Internship");
        }
        
        return list;
    }
    
    private void addCourse(java.util.List<com.example.campusvault.data.models.CourseUnit> list, 
                          int id, String code, String name) {
        com.example.campusvault.data.models.CourseUnit cu = new com.example.campusvault.data.models.CourseUnit();
        cu.setId(id);
        cu.setCode(code);
        cu.setName(name);
        cu.setYear(selectedYear);
        cu.setSemester(selectedSemester);
        list.add(cu);
    }
}
