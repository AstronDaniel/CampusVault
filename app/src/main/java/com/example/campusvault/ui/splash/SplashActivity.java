package com.example.campusvault.ui.splash;

import android.animation.Animator;
import android.animation.AnimatorListenerAdapter;
import android.content.Intent;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.View;
import androidx.appcompat.app.AppCompatActivity;
import com.example.campusvault.databinding.ActivitySplashBinding;
import com.example.campusvault.data.local.SharedPreferencesManager;
import com.example.campusvault.data.local.EncryptedPreferencesManager;

/**
 * Splash screen activity with animations
 * Routes to onboarding, auth, or main screen based on app state
 */
public class SplashActivity extends AppCompatActivity {

    private ActivitySplashBinding binding;
    private SharedPreferencesManager preferencesManager;
    private EncryptedPreferencesManager encryptedPreferencesManager;
    
    private static final long MIN_SPLASH_DURATION = 1500; // 1.5 seconds
    private static final long MAX_SPLASH_DURATION = 3000; // 3 seconds
    private static final long ANIMATION_DURATION = 800;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        binding = ActivitySplashBinding.inflate(getLayoutInflater());
        setContentView(binding.getRoot());

        // Initialize preferences managers
        preferencesManager = new SharedPreferencesManager(this);
        encryptedPreferencesManager = new EncryptedPreferencesManager(this);
        
        // One-time migration: Copy token from encrypted to regular preferences
        migrateTokenIfNeeded();

        // Start animations
        startAnimations();

        // Navigate after delay
        new Handler(Looper.getMainLooper()).postDelayed(
            this::navigateToNextScreen,
            MIN_SPLASH_DURATION
        );
    }

    /**
     * Start splash screen animations
     */
    private void startAnimations() {
        // Scale and fade animation for logo
        binding.ivLogo.setAlpha(0f);
        binding.ivLogo.setScaleX(0.8f);
        binding.ivLogo.setScaleY(0.8f);
        binding.ivLogo.animate()
            .alpha(1f)
            .scaleX(1f)
            .scaleY(1f)
            .setDuration(ANIMATION_DURATION)
            .setInterpolator(new android.view.animation.DecelerateInterpolator())
            .setListener(new AnimatorListenerAdapter() {
                @Override
                public void onAnimationEnd(Animator animation) {
                    // Fade in app name after logo animation
                    animateAppName();
                }
            })
            .start();
    }

    /**
     * Animate app name fade in
     */
    private void animateAppName() {
        binding.tvAppName.animate()
            .alpha(1f)
            .setDuration(ANIMATION_DURATION / 2)
            .setListener(new AnimatorListenerAdapter() {
                @Override
                public void onAnimationEnd(Animator animation) {
                    // Fade in tagline after app name
                    animateTagline();
                }
            })
            .start();
    }

    /**
     * Animate tagline fade in
     */
    private void animateTagline() {
        binding.tvTagline.animate()
            .alpha(1f)
            .setDuration(ANIMATION_DURATION / 2)
            .start();
    }

    /**
     * Determine next screen and navigate
     */
    private void navigateToNextScreen() {
        // Check if first launch
        boolean isFirstLaunch = preferencesManager.isFirstLaunch();
        
        // Check if onboarding completed
        boolean onboardingCompleted = preferencesManager.isOnboardingCompleted();
        
        // Check if user is authenticated
        boolean isAuthenticated = encryptedPreferencesManager.isAuthenticated();

        Intent intent;
        
        if (!onboardingCompleted) {
            // Navigate to onboarding
            intent = new Intent(this, com.example.campusvault.ui.onboarding.OnboardingActivity.class);
        } else if (!isAuthenticated) {
            // Navigate to authentication
            intent = new Intent(this, com.example.campusvault.ui.auth.AuthActivity.class);
        } else {
            // Navigate to main screen
            intent = new Intent(this, com.example.campusvault.ui.main.MainActivity.class);
        }

        startActivity(intent);
        finish();
        
        // Add transition animation
        overridePendingTransition(android.R.anim.fade_in, android.R.anim.fade_out);
    }

    /**
     * One-time migration to copy token from encrypted to regular preferences
     * This ensures AuthInterceptor can access the token
     */
    private void migrateTokenIfNeeded() {
        // Check if token exists in encrypted preferences but not in regular preferences
        String encryptedToken = encryptedPreferencesManager.getAuthToken();
        String regularToken = preferencesManager.getAuthToken();
        
        if (encryptedToken != null && !encryptedToken.isEmpty() && 
            (regularToken == null || regularToken.isEmpty())) {
            // Copy token to regular preferences
            preferencesManager.saveAuthToken(encryptedToken);
            android.util.Log.d("SplashActivity", "Migrated auth token to SharedPreferences");
        }
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        binding = null;
    }
}
