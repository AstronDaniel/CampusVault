package com.example.campusvault.ui.main.explore;

import android.content.Intent;
import android.graphics.drawable.GradientDrawable;
import android.os.Bundle;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.LayoutInflater;
import android.view.View;
import android.view.animation.Animation;
import android.view.animation.RotateAnimation;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.lifecycle.ViewModelProvider;
import androidx.recyclerview.widget.GridLayoutManager;
import androidx.recyclerview.widget.RecyclerView;
import com.example.campusvault.R;
import com.example.campusvault.data.local.SharedPreferencesManager;
import com.example.campusvault.data.models.CourseUnit;
import com.example.campusvault.databinding.ActivityProgramDetailBinding;
import com.example.campusvault.ui.main.home.adapters.CourseUnitAdapter;
import com.example.campusvault.ui.main.resources.CourseUnitDetailActivity;
import com.google.android.material.card.MaterialCardView;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.TreeMap;

public class ProgramDetailActivity extends AppCompatActivity {
    public static final String EXTRA_PROGRAM_ID = "extra_program_id";
    public static final String EXTRA_PROGRAM_NAME = "extra_program_name";
    public static final String EXTRA_PROGRAM_CODE = "extra_program_code";
    public static final String EXTRA_PROGRAM_DURATION = "extra_program_duration";

    private ActivityProgramDetailBinding binding;
    private ProgramDetailViewModel vm;
    
    private List<CourseUnit> allCourseUnits = new ArrayList<>();
    private Map<String, View> sectionViews = new HashMap<>();
    private Map<String, Boolean> sectionExpanded = new HashMap<>();
    
    // Colorful gradients for each year
    private final int[][] YEAR_COLORS = {
        {0xFF6366F1, 0xFF8B5CF6},  // Year 1 - Indigo to Purple
        {0xFF0EA5E9, 0xFF06B6D4},  // Year 2 - Blue to Cyan
        {0xFF10B981, 0xFF34D399},  // Year 3 - Emerald to Green
        {0xFFF59E0B, 0xFFFBBF24},  // Year 4 - Amber to Yellow
        {0xFFEF4444, 0xFFF97316},  // Year 5 - Red to Orange
        {0xFFEC4899, 0xFFF472B6},  // Year 6 - Pink
    };

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        binding = ActivityProgramDetailBinding.inflate(getLayoutInflater());
        setContentView(binding.getRoot());

        int programId = getIntent().getIntExtra(EXTRA_PROGRAM_ID, -1);
        String programName = getIntent().getStringExtra(EXTRA_PROGRAM_NAME);
        String programCode = getIntent().getStringExtra(EXTRA_PROGRAM_CODE);
        int durationYears = getIntent().getIntExtra(EXTRA_PROGRAM_DURATION, 3);

        // Set header info
        binding.tvProgramName.setText(programName != null ? programName : "Program");
        binding.tvProgramInfo.setText((programCode != null ? programCode + " • " : "") + durationYears + " Years");
        
        // Back button
        binding.btnBack.setOnClickListener(v -> onBackPressed());

        // Setup ViewModel
        SharedPreferencesManager spm = new SharedPreferencesManager(this);
        vm = new ViewModelProvider(this, new ProgramDetailViewModelFactory(getApplication(), spm))
                .get(ProgramDetailViewModel.class);

        setupSearch();
        setupObservers();

        // Load course units
        if (programId != -1) {
            vm.loadCourseUnits(programId);
        }
    }

    private void setupSearch() {
        binding.searchEditText.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {}

            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {
                String query = s.toString();
                binding.btnClearSearch.setVisibility(query.isEmpty() ? View.GONE : View.VISIBLE);
                filterCourseUnits(query);
            }

            @Override
            public void afterTextChanged(Editable s) {}
        });

        binding.btnClearSearch.setOnClickListener(v -> {
            binding.searchEditText.setText("");
        });
    }

    private void filterCourseUnits(String query) {
        if (query.isEmpty()) {
            buildSections(allCourseUnits);
            return;
        }

        String lowerQuery = query.toLowerCase();
        List<CourseUnit> filtered = new ArrayList<>();
        for (CourseUnit cu : allCourseUnits) {
            if (cu.getName().toLowerCase().contains(lowerQuery) ||
                (cu.getCode() != null && cu.getCode().toLowerCase().contains(lowerQuery))) {
                filtered.add(cu);
            }
        }
        buildSections(filtered);
    }

    private void setupObservers() {
        vm.courseUnits.observe(this, courseUnits -> {
            if (courseUnits != null && !courseUnits.isEmpty()) {
                allCourseUnits = new ArrayList<>(courseUnits);
                buildSections(courseUnits);
                binding.scrollContent.setVisibility(View.VISIBLE);
                binding.layoutEmptyState.setVisibility(View.GONE);
            } else {
                binding.scrollContent.setVisibility(View.GONE);
                binding.layoutEmptyState.setVisibility(View.VISIBLE);
            }
        });

        vm.loading.observe(this, isLoading -> {
            if (isLoading) {
                binding.shimmerLoading.setVisibility(View.VISIBLE);
                binding.shimmerLoading.startShimmer();
                binding.scrollContent.setVisibility(View.GONE);
            } else {
                binding.shimmerLoading.stopShimmer();
                binding.shimmerLoading.setVisibility(View.GONE);
            }
        });
    }

    private void buildSections(List<CourseUnit> courseUnits) {
        binding.layoutSections.removeAllViews();
        sectionViews.clear();

        // Group by year and semester using TreeMap for sorting
        Map<Integer, Map<Integer, List<CourseUnit>>> grouped = new TreeMap<>();
        
        for (CourseUnit cu : courseUnits) {
            int year = cu.getYear();
            int semester = cu.getSemester();
            
            grouped.computeIfAbsent(year, k -> new TreeMap<>())
                   .computeIfAbsent(semester, k -> new ArrayList<>())
                   .add(cu);
        }

        // Create sections
        for (Map.Entry<Integer, Map<Integer, List<CourseUnit>>> yearEntry : grouped.entrySet()) {
            int year = yearEntry.getKey();
            
            for (Map.Entry<Integer, List<CourseUnit>> semEntry : yearEntry.getValue().entrySet()) {
                int semester = semEntry.getKey();
                List<CourseUnit> units = semEntry.getValue();
                
                View sectionView = createSectionView(year, semester, units);
                binding.layoutSections.addView(sectionView);
                
                String key = year + "-" + semester;
                sectionViews.put(key, sectionView);
                
                // Default expanded
                if (!sectionExpanded.containsKey(key)) {
                    sectionExpanded.put(key, true);
                }
            }
        }
    }

    private View createSectionView(int year, int semester, List<CourseUnit> courseUnits) {
        LayoutInflater inflater = LayoutInflater.from(this);
        View view = inflater.inflate(R.layout.item_semester_section, binding.layoutSections, false);
        
        LinearLayout bannerBg = view.findViewById(R.id.bannerBackground);
        TextView tvYearNumber = view.findViewById(R.id.tvYearNumber);
        TextView tvSectionTitle = view.findViewById(R.id.tvSectionTitle);
        TextView tvCourseCount = view.findViewById(R.id.tvCourseCount);
        ImageView ivExpandIcon = view.findViewById(R.id.ivExpandIcon);
        RecyclerView rvCourseUnits = view.findViewById(R.id.rvCourseUnits);
        MaterialCardView cardBanner = view.findViewById(R.id.cardBanner);
        
        // Set gradient background based on year
        int colorIndex = (year - 1) % YEAR_COLORS.length;
        GradientDrawable gradient = new GradientDrawable(
            GradientDrawable.Orientation.LEFT_RIGHT,
            new int[]{YEAR_COLORS[colorIndex][0], YEAR_COLORS[colorIndex][1]}
        );
        gradient.setCornerRadius(16 * getResources().getDisplayMetrics().density);
        bannerBg.setBackground(gradient);
        
        // Set text
        tvYearNumber.setText(String.valueOf(year));
        tvSectionTitle.setText("Year " + year + " - Semester " + semester);
        tvCourseCount.setText(courseUnits.size() + " Course Unit" + (courseUnits.size() != 1 ? "s" : ""));
        
        // Setup RecyclerView
        CourseUnitAdapter adapter = new CourseUnitAdapter(courseUnit -> {
            Intent intent = new Intent(this, CourseUnitDetailActivity.class);
            intent.putExtra(CourseUnitDetailActivity.EXTRA_COURSE_UNIT_ID, courseUnit.getId());
            intent.putExtra(CourseUnitDetailActivity.EXTRA_COURSE_UNIT_NAME, courseUnit.getName());
            startActivity(intent);
        });
        rvCourseUnits.setLayoutManager(new GridLayoutManager(this, 2));
        rvCourseUnits.setAdapter(adapter);
        rvCourseUnits.setNestedScrollingEnabled(false);
        adapter.submitList(courseUnits);
        
        // Expand/Collapse logic
        String key = year + "-" + semester;
        boolean isExpanded = sectionExpanded.getOrDefault(key, true);
        rvCourseUnits.setVisibility(isExpanded ? View.VISIBLE : View.GONE);
        ivExpandIcon.setRotation(isExpanded ? 180 : 0);
        
        cardBanner.setOnClickListener(v -> {
            boolean currentExpanded = sectionExpanded.getOrDefault(key, true);
            boolean newExpanded = !currentExpanded;
            sectionExpanded.put(key, newExpanded);
            
            // Animate icon
            RotateAnimation rotate = new RotateAnimation(
                currentExpanded ? 180 : 0,
                newExpanded ? 180 : 0,
                Animation.RELATIVE_TO_SELF, 0.5f,
                Animation.RELATIVE_TO_SELF, 0.5f
            );
            rotate.setDuration(200);
            rotate.setFillAfter(true);
            ivExpandIcon.startAnimation(rotate);
            
            // Toggle visibility
            rvCourseUnits.setVisibility(newExpanded ? View.VISIBLE : View.GONE);
        });
        
        return view;
    }
}
