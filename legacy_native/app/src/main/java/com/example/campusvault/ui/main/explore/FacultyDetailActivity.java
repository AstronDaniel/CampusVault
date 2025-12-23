package com.example.campusvault.ui.main.explore;

import android.content.Intent;
import android.os.Bundle;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.View;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.lifecycle.ViewModelProvider;
import androidx.recyclerview.widget.LinearLayoutManager;
import com.example.campusvault.data.local.SharedPreferencesManager;
import com.example.campusvault.data.models.ProgramResponse;
import com.example.campusvault.databinding.ActivityFacultyDetailBinding;
import com.example.campusvault.ui.main.explore.adapters.ProgramAdapter;
import java.util.ArrayList;
import java.util.List;

public class FacultyDetailActivity extends AppCompatActivity {
    public static final String EXTRA_FACULTY_ID = "extra_faculty_id";
    public static final String EXTRA_FACULTY_NAME = "extra_faculty_name";
    public static final String EXTRA_FACULTY_CODE = "extra_faculty_code";

    private ActivityFacultyDetailBinding binding;
    private FacultyDetailViewModel vm;
    private ProgramAdapter programAdapter;
    
    private List<ProgramResponse> allPrograms = new ArrayList<>();

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

        setupRecyclerView();
        setupSearch();
        setupObservers();

        // Load programs
        if (facultyId != -1) {
            vm.loadPrograms(facultyId);
        }
    }

    private void setupRecyclerView() {
        programAdapter = new ProgramAdapter(program -> {
            // Navigate to ProgramDetailActivity
            Intent intent = new Intent(this, ProgramDetailActivity.class);
            intent.putExtra(ProgramDetailActivity.EXTRA_PROGRAM_ID, program.getId());
            intent.putExtra(ProgramDetailActivity.EXTRA_PROGRAM_NAME, program.getName());
            intent.putExtra(ProgramDetailActivity.EXTRA_PROGRAM_CODE, program.getCode());
            intent.putExtra(ProgramDetailActivity.EXTRA_PROGRAM_DURATION, program.getDurationYears());
            startActivity(intent);
        });
        binding.rvPrograms.setLayoutManager(new LinearLayoutManager(this));
        binding.rvPrograms.setAdapter(programAdapter);
    }

    private void setupSearch() {
        binding.searchView.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {}

            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {
                filterPrograms(s.toString());
            }

            @Override
            public void afterTextChanged(Editable s) {}
        });
    }

    private void filterPrograms(String query) {
        if (query.isEmpty()) {
            programAdapter.submitList(new ArrayList<>(allPrograms));
            return;
        }

        String lowerQuery = query.toLowerCase();
        List<ProgramResponse> filtered = new ArrayList<>();
        for (ProgramResponse p : allPrograms) {
            if (p.getName().toLowerCase().contains(lowerQuery) ||
                (p.getCode() != null && p.getCode().toLowerCase().contains(lowerQuery))) {
                filtered.add(p);
            }
        }
        programAdapter.submitList(filtered);
    }

    private void setupObservers() {
        vm.programs.observe(this, programs -> {
            if (programs != null && !programs.isEmpty()) {
                allPrograms = new ArrayList<>(programs);
                programAdapter.submitList(programs);
                binding.rvPrograms.setVisibility(View.VISIBLE);
                binding.layoutEmptyState.setVisibility(View.GONE);
                binding.tvProgramsHeader.setText("Programs (" + programs.size() + ")");
            } else {
                binding.rvPrograms.setVisibility(View.GONE);
                binding.layoutEmptyState.setVisibility(View.VISIBLE);
            }
        });

        vm.loading.observe(this, isLoading -> {
            if (isLoading) {
                binding.shimmerPrograms.setVisibility(View.VISIBLE);
                binding.shimmerPrograms.startShimmer();
                binding.rvPrograms.setVisibility(View.GONE);
            } else {
                binding.shimmerPrograms.stopShimmer();
                binding.shimmerPrograms.setVisibility(View.GONE);
            }
        });
    }
}
