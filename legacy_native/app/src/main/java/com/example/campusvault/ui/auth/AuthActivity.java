package com.example.campusvault.ui.auth;

import android.os.Bundle;
import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.fragment.app.Fragment;
import androidx.fragment.app.FragmentActivity;
import androidx.viewpager2.adapter.FragmentStateAdapter;
import com.example.campusvault.R;
import com.example.campusvault.databinding.ActivityAuthBinding;
import com.google.android.material.tabs.TabLayoutMediator;

/**
 * Authentication activity with login and register tabs
 */
public class AuthActivity extends AppCompatActivity {

    private ActivityAuthBinding binding;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        binding = ActivityAuthBinding.inflate(getLayoutInflater());
        setContentView(binding.getRoot());

        setupViewPager();
    }

    /**
     * Setup ViewPager2 with login and register fragments
     */
    private void setupViewPager() {
        AuthPagerAdapter adapter = new AuthPagerAdapter(this);
        binding.viewPager.setAdapter(adapter);
        
        // Start with login page
        binding.viewPager.setCurrentItem(0);
    }

    /**
     * Navigate to login page
     */
    public void navigateToLogin() {
        binding.viewPager.setCurrentItem(0, true);
    }

    /**
     * Navigate to register page
     */
    public void navigateToRegister() {
        binding.viewPager.setCurrentItem(1, true);
    }

    /**
     * Navigate to forgot password page
     */
    public void navigateToForgotPassword() {
        binding.viewPager.setCurrentItem(2, true);
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        binding = null;
    }

    /**
     * ViewPager2 adapter for auth fragments
     */
    private static class AuthPagerAdapter extends FragmentStateAdapter {

        public AuthPagerAdapter(@NonNull FragmentActivity fragmentActivity) {
            super(fragmentActivity);
        }

        @NonNull
        @Override
        public Fragment createFragment(int position) {
            if (position == 0) return new LoginFragment();
            if (position == 1) return new RegisterFragment();
            return new ForgotPasswordFragment();
        }

        @Override
        public int getItemCount() {
            return 3;
        }
    }
}
