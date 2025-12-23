package com.example.campusvault.ui.main.resources;

import android.os.Bundle;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AppCompatActivity;
import androidx.viewpager2.widget.ViewPager2;
import com.example.campusvault.R;
import com.example.campusvault.databinding.ActivityCourseUnitDetailBinding;
import com.google.android.material.tabs.TabLayoutMediator;

public class CourseUnitDetailActivity extends AppCompatActivity {
    public static final String EXTRA_COURSE_UNIT_ID = "extra_course_unit_id";
    public static final String EXTRA_COURSE_UNIT_NAME = "extra_course_unit_name";

    private ActivityCourseUnitDetailBinding binding;

    @Override
    protected void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        binding = ActivityCourseUnitDetailBinding.inflate(getLayoutInflater());
        setContentView(binding.getRoot());

        int cuId = getIntent().getIntExtra(EXTRA_COURSE_UNIT_ID, -1);
        String cuName = getIntent().getStringExtra(EXTRA_COURSE_UNIT_NAME);

        binding.tvTitle.setText(cuName != null ? cuName : getString(R.string.app_name));
        binding.btnBack.setOnClickListener(v -> onBackPressed());

        ResourcesTabsAdapter adapter = new ResourcesTabsAdapter(this, cuId);
        binding.viewPager.setAdapter(adapter);

        new TabLayoutMediator(binding.tabLayout, binding.viewPager, (tab, position) -> {
            if (position == 0) tab.setText("Notes"); else tab.setText("Past Papers");
        }).attach();

        binding.viewPager.setOffscreenPageLimit(2);
        binding.viewPager.setUserInputEnabled(true);
    }
}
