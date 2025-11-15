package com.example.campusvault.ui.onboarding;

import android.content.Intent;
import android.os.Bundle;
import android.view.View;
import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.viewpager2.widget.ViewPager2;
import com.example.campusvault.R;
import com.example.campusvault.databinding.ActivityOnboardingBinding;
import com.example.campusvault.data.local.SharedPreferencesManager;
import com.example.campusvault.ui.splash.SplashActivity;
import com.google.android.material.tabs.TabLayoutMediator;
import java.util.ArrayList;
import java.util.List;

/**
 * Onboarding activity with ViewPager2 and animations
 */
public class OnboardingActivity extends AppCompatActivity {

    private ActivityOnboardingBinding binding;
    private OnboardingAdapter adapter;
    private List<OnboardingPage> pages;
    private SharedPreferencesManager preferencesManager;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        binding = ActivityOnboardingBinding.inflate(getLayoutInflater());
        setContentView(binding.getRoot());

        preferencesManager = new SharedPreferencesManager(this);

        setupOnboardingPages();
        setupViewPager();
        setupListeners();
    }

    /**
     * Create onboarding pages with content
     */
    private void setupOnboardingPages() {
        pages = new ArrayList<>();
        
        pages.add(new OnboardingPage(
            getString(R.string.onboarding_title_1),
            getString(R.string.onboarding_desc_1),
            R.drawable.ic_app_logo // Replaced Lottie with static drawable
        ));
        
        pages.add(new OnboardingPage(
            getString(R.string.onboarding_title_2),
            getString(R.string.onboarding_desc_2),
            R.drawable.ic_app_logo
        ));
        
        pages.add(new OnboardingPage(
            getString(R.string.onboarding_title_3),
            getString(R.string.onboarding_desc_3),
            R.drawable.ic_app_logo
        ));
        
        pages.add(new OnboardingPage(
            getString(R.string.onboarding_title_4),
            getString(R.string.onboarding_desc_4),
            R.drawable.ic_app_logo
        ));
    }

    /**
     * Setup ViewPager2 with adapter and page transformer
     */
    private void setupViewPager() {
        adapter = new OnboardingAdapter(pages);
        binding.viewPager.setAdapter(adapter);

        // Add parallax page transformer
        binding.viewPager.setPageTransformer(new ParallaxPageTransformer());

        // Connect TabLayout with ViewPager2
        new TabLayoutMediator(binding.tabLayout, binding.viewPager,
            (tab, position) -> {
                // Tab configuration is handled by tab_selector drawable
            }
        ).attach();

        // Listen for page changes
        binding.viewPager.registerOnPageChangeCallback(new ViewPager2.OnPageChangeCallback() {
            @Override
            public void onPageSelected(int position) {
                super.onPageSelected(position);
                updateButtonText(position);
            }
        });
    }

    /**
     * Setup click listeners
     */
    private void setupListeners() {
        binding.tvSkip.setOnClickListener(v -> finishOnboarding());
        
        binding.btnNext.setOnClickListener(v -> {
            int currentItem = binding.viewPager.getCurrentItem();
            if (currentItem < pages.size() - 1) {
                // Go to next page
                binding.viewPager.setCurrentItem(currentItem + 1, true);
            } else {
                // Last page - finish onboarding
                finishOnboarding();
            }
        });
    }

    /**
     * Update button text based on current page
     */
    private void updateButtonText(int position) {
        if (position == pages.size() - 1) {
            binding.btnNext.setText(R.string.get_started);
            binding.tvSkip.setVisibility(View.GONE);
        } else {
            binding.btnNext.setText(R.string.next);
            binding.tvSkip.setVisibility(View.VISIBLE);
        }
    }

    /**
     * Complete onboarding and navigate to auth screen
     */
    private void finishOnboarding() {
        // Save onboarding completion status
        preferencesManager.setOnboardingCompleted(true);

        // Navigate to auth screen
        Intent intent = new Intent(this, com.example.campusvault.ui.auth.AuthActivity.class);
        startActivity(intent);
        finish();

        // Add transition animation
        overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out);
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        binding = null;
    }

    /**
     * Custom page transformer for parallax effect
     */
    private static class ParallaxPageTransformer implements ViewPager2.PageTransformer {
        @Override
        public void transformPage(@NonNull View page, float position) {
            int pageWidth = page.getWidth();

            if (position < -1) {
                // Page is way off-screen to the left
                page.setAlpha(0f);
            } else if (position <= 1) {
                // Page is visible or moving
                page.setAlpha(1f);

                // Apply parallax effect to the animation view
                View animationView = page.findViewById(R.id.lottieAnimation);
                if (animationView != null) {
                    animationView.setTranslationX(-position * (pageWidth / 2));
                }

                // Apply fade and scale to text
                View titleView = page.findViewById(R.id.tvTitle);
                View descView = page.findViewById(R.id.tvDescription);
                
                if (titleView != null) {
                    titleView.setAlpha(1 - Math.abs(position));
                    titleView.setTranslationX(-position * pageWidth / 3);
                }
                
                if (descView != null) {
                    descView.setAlpha(1 - Math.abs(position));
                    descView.setTranslationX(-position * pageWidth / 4);
                }
            } else {
                // Page is way off-screen to the right
                page.setAlpha(0f);
            }
        }
    }
}
