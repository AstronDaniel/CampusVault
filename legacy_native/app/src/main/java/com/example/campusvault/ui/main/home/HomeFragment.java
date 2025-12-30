package com.example.campusvault.ui.main.home;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.view.inputmethod.EditorInfo;
import android.widget.AdapterView;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.lifecycle.ViewModelProvider;
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.GridLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import com.bumptech.glide.Glide;
import com.bumptech.glide.load.resource.drawable.DrawableTransitionOptions;
import com.example.campusvault.R;
import com.example.campusvault.databinding.FragmentHomeBinding;
import com.example.campusvault.ui.base.BaseFragment;
import com.example.campusvault.ui.main.home.adapters.ResourceAdapter;
import com.example.campusvault.ui.main.home.adapters.CourseUnitAdapter;
import com.example.campusvault.ui.main.home.adapters.SearchSuggestionAdapter;
import com.example.campusvault.data.local.SharedPreferencesManager;
import com.example.campusvault.data.models.CourseUnit;
import android.content.Intent;
import android.text.Editable;
import android.text.TextWatcher;
import com.example.campusvault.ui.main.resources.CourseUnitDetailActivity;
import com.example.campusvault.ui.main.home.adapters.TrendingAdapter;
import java.util.ArrayList;
import java.util.List;

public class HomeFragment extends BaseFragment<FragmentHomeBinding> {

    private DashboardViewModel viewModel;
    private TrendingAdapter trendingAdapter;
    private ResourceAdapter recentAdapter;
    private CourseUnitAdapter courseUnitAdapter;
    private SearchSuggestionAdapter searchAdapter;
    private List<CourseUnit> allCourseUnits = new ArrayList<>();
    private int selectedYear = 2;
    private int selectedSemester = 1;
    private String currentUsername = "Student";
    private String userProfileImageUrl = null;
    private String programCode = "";
    private String facultyCode = "";
    private String programName = "";
    private String facultyName = "";

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

        // Profile Click - show toast with username
        binding.profileContainer.setOnClickListener(v -> {
            android.widget.Toast.makeText(requireContext(), "Logged in as " + currentUsername, android.widget.Toast.LENGTH_SHORT).show();
        });

        // Badge Click - show full program and faculty name
        binding.badgeContainer.setOnClickListener(v -> {
            String message = "";
            if (!programName.isEmpty()) {
                message = programName;
            }
            if (!facultyName.isEmpty()) {
                if (!message.isEmpty()) message += "\n";
                message += facultyName;
            }
            if (!message.isEmpty()) {
                android.widget.Toast.makeText(requireContext(), message, android.widget.Toast.LENGTH_SHORT).show();
            }
        });

        // Setup search autocomplete
        setupSearchAutocomplete();

        // Load user info
        loadUserInfo();
    }

    private void setupSearchAutocomplete() {
        // Initialize search adapter
        searchAdapter = new SearchSuggestionAdapter(requireContext(), new ArrayList<>());
        binding.searchAutoComplete.setAdapter(searchAdapter);

        // Handle item selection from dropdown
        binding.searchAutoComplete.setOnItemClickListener((parent, view, position, id) -> {
            CourseUnit selected = searchAdapter.getItem(position);
            if (selected != null) {
                // Navigate to course unit detail
                Intent i = new Intent(requireContext(), CourseUnitDetailActivity.class);
                i.putExtra(CourseUnitDetailActivity.EXTRA_COURSE_UNIT_ID, selected.getId());
                i.putExtra(CourseUnitDetailActivity.EXTRA_COURSE_UNIT_NAME, selected.getName());
                startActivity(i);
                binding.searchAutoComplete.setText("");
                binding.searchAutoComplete.clearFocus();
            }
        });

        // Handle text changes for search
        binding.searchAutoComplete.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {}

            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {
                String query = s.toString().trim();
                if (query.length() >= 1) {
                    // Search all course units of the program (regardless of year/semester)
                    SharedPreferencesManager prefs = new SharedPreferencesManager(requireContext());
                    int programId = prefs.getUserProgramId();
                    viewModel.searchByProgram(programId > 0 ? programId : null, query);
                } else if (query.isEmpty()) {
                    reloadCourseUnits();
                }
            }

            @Override
            public void afterTextChanged(Editable s) {}
        });

        // Handle keyboard search action
        binding.searchAutoComplete.setOnEditorActionListener((v, actionId, event) -> {
            if (actionId == EditorInfo.IME_ACTION_SEARCH) {
                String query = binding.searchAutoComplete.getText().toString().trim();
                if (!query.isEmpty()) {
                    // Search all course units of the program (regardless of year/semester)
                    SharedPreferencesManager prefs = new SharedPreferencesManager(requireContext());
                    int programId = prefs.getUserProgramId();
                    viewModel.searchByProgram(programId > 0 ? programId : null, query);
                    binding.searchAutoComplete.dismissDropDown();
                }
                binding.searchAutoComplete.clearFocus();
                return true;
            }
            return false;
        });

        // Show dropdown on focus
        binding.searchAutoComplete.setOnFocusChangeListener((v, hasFocus) -> {
            if (hasFocus && !allCourseUnits.isEmpty()) {
                binding.searchAutoComplete.showDropDown();
            }
        });
    }

    private void loadUserInfo() {
        SharedPreferencesManager prefs = new SharedPreferencesManager(requireContext());
        
        // Set default values first from SharedPreferences
        String storedUsername = prefs.getUserName();
        if (storedUsername != null && !storedUsername.isEmpty()) {
            currentUsername = storedUsername;
            updateUsernameLabel();
        }
        
        // Load stored program/faculty codes for immediate display
        String storedProgramCode = prefs.getUserProgramCode();
        String storedFacultyCode = prefs.getUserFacultyCode();
        if (storedProgramCode != null && !storedProgramCode.isEmpty()) {
            programCode = storedProgramCode;
            binding.tvProgramBadge.setText(programCode);
        } else {
            binding.tvProgramBadge.setText("...");
        }
        if (storedFacultyCode != null && !storedFacultyCode.isEmpty()) {
            facultyCode = storedFacultyCode;
            binding.tvFacultyBadge.setText(facultyCode);
        } else {
            binding.tvFacultyBadge.setText("...");
        }
        
        // Get program duration and configure year chips
        int programDuration = prefs.getUserProgramDuration();
        configureYearChips(programDuration);
        
        // Fetch current user from backend
        viewModel.loadCurrentUser(user -> {
            if (user != null) {
                // Update username from backend
                String username = user.getUsername();
                if (username != null && !username.isEmpty()) {
                    currentUsername = username;
                    prefs.saveUserName(username);
                    updateUsernameLabel();
                }
                
                // Load profile image if available
                String avatarUrl = user.getAvatarUrl();
                if (avatarUrl != null && !avatarUrl.isEmpty()) {
                    userProfileImageUrl = avatarUrl;
                    loadProfileImage(avatarUrl);
                } else {
                    // Set default avatar with user's initial
                    setDefaultAvatar();
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
                
                // Load program and faculty names/codes
                loadProgramAndFaculty(programId, facultyId);
            } else {
                // Fallback to stored data if backend fails
                int programId = prefs.getUserProgramId();
                int facultyId = prefs.getUserFacultyId();
                
                setDefaultAvatar();
                
                if (programId > 0 || facultyId > 0) {
                    loadProgramAndFaculty(programId, facultyId);
                }
            }
        });
    }
    
    private void updateUsernameLabel() {
        if (binding != null && binding.tvUsernameLabel != null) {
            // Get first name or use full username
            String displayName = currentUsername;
            if (displayName.contains(" ")) {
                displayName = displayName.split(" ")[0];
            }
            binding.tvUsernameLabel.setText("Hi, " + displayName);
        }
    }
    
    private void loadProfileImage(String imageUrl) {
        if (binding == null || !isAdded()) return;
        
        Glide.with(this)
            .load(imageUrl)
            .placeholder(R.drawable.ic_person)
            .error(R.drawable.ic_person)
            .circleCrop()
            .transition(DrawableTransitionOptions.withCrossFade())
            .into(binding.ivUserProfile);
    }
    
    private void setDefaultAvatar() {
        if (binding == null || !isAdded()) return;
        
        // Use default person icon
        binding.ivUserProfile.setImageResource(R.drawable.ic_person);
        binding.ivUserProfile.setColorFilter(
            requireContext().getColor(R.color.brand_primary),
            android.graphics.PorterDuff.Mode.SRC_IN
        );
        binding.ivUserProfile.setPadding(12, 12, 12, 12);
    }
    
    private void loadProgramAndFaculty(int programId, int facultyId) {
        SharedPreferencesManager prefs = new SharedPreferencesManager(requireContext());
        
        if (programId > 0) {
            viewModel.loadProgram(programId, program -> {
                if (program != null) {
                    // Store full name for tooltip
                    programName = program.getName();
                    
                    // Save program code for badge display
                    String code = program.getCode();
                    if (code != null && !code.isEmpty()) {
                        programCode = code;
                        prefs.saveUserProgramCode(code);
                        binding.tvProgramBadge.setText(code);
                    } else {
                        // Create abbreviation from name
                        programCode = createAbbreviation(program.getName());
                        prefs.saveUserProgramCode(programCode);
                        binding.tvProgramBadge.setText(programCode);
                    }
                    // Save program duration and reconfigure year chips
                    int duration = program.getDurationYears();
                    prefs.saveUserProgramDuration(duration);
                    configureYearChips(duration);
                } else {
                    binding.tvProgramBadge.setText("N/A");
                }
            });
        } else {
            binding.tvProgramBadge.setText("N/A");
        }
        
        if (facultyId > 0) {
            viewModel.loadFaculty(facultyId, faculty -> {
                if (faculty != null) {
                    // Store full name for tooltip
                    facultyName = faculty.getName();
                    
                    // Save faculty code for badge display
                    String code = faculty.getCode();
                    if (code != null && !code.isEmpty()) {
                        facultyCode = code;
                        prefs.saveUserFacultyCode(code);
                        binding.tvFacultyBadge.setText(code);
                    } else {
                        // Create abbreviation from name
                        facultyCode = createAbbreviation(faculty.getName());
                        prefs.saveUserFacultyCode(facultyCode);
                        binding.tvFacultyBadge.setText(facultyCode);
                    }
                } else {
                    binding.tvFacultyBadge.setText("N/A");
                }
            });
        } else {
            binding.tvFacultyBadge.setText("N/A");
        }
    }
    
    /**
     * Create an abbreviation from a name by taking first letter of each word
     */
    private String createAbbreviation(String name) {
        if (name == null || name.isEmpty()) return "N/A";
        
        StringBuilder abbreviation = new StringBuilder();
        String[] words = name.split("\\s+");
        
        for (String word : words) {
            if (!word.isEmpty() && Character.isLetter(word.charAt(0))) {
                // Skip common words like "of", "the", "and"
                String lower = word.toLowerCase();
                if (!lower.equals("of") && !lower.equals("the") && !lower.equals("and") && !lower.equals("in")) {
                    abbreviation.append(Character.toUpperCase(word.charAt(0)));
                }
            }
        }
        
        String result = abbreviation.toString();
        return result.isEmpty() ? name.substring(0, Math.min(3, name.length())).toUpperCase() : result;
    }

    @Override
    protected void observeData() {
        viewModel.courseUnits.observe(getViewLifecycleOwner(), list -> {
            if (list != null && !list.isEmpty()) {
                courseUnitAdapter.submitList(list);
                binding.rvCourseUnits.setVisibility(View.VISIBLE);
                binding.shimmerCourseUnits.stopShimmer();
                binding.shimmerCourseUnits.setVisibility(View.GONE);
                
                // Update autocomplete suggestions with all course units
                allCourseUnits.clear();
                allCourseUnits.addAll(list);
                if (searchAdapter != null) {
                    searchAdapter.updateCourseUnits(list);
                }
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
