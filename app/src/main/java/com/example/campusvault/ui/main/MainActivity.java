package com.example.campusvault.ui.main;

import android.os.Bundle;
import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.fragment.app.Fragment;
import com.example.campusvault.R;
import com.example.campusvault.databinding.ActivityMainBinding;
import com.example.campusvault.ui.main.home.HomeFragment;
import com.google.android.material.navigation.NavigationBarView;

public class MainActivity extends AppCompatActivity {

    private ActivityMainBinding binding;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        binding = ActivityMainBinding.inflate(getLayoutInflater());
        setContentView(binding.getRoot());

        setupBottomNav();
        if (savedInstanceState == null) {
            switchTo(new HomeFragment());
        }
    }

    private void setupBottomNav() {
        binding.bottomNav.setOnItemSelectedListener(new NavigationBarView.OnItemSelectedListener() {
            @Override
            public boolean onNavigationItemSelected(@NonNull android.view.MenuItem item) {
                int id = item.getItemId();
                Fragment fragment = null;
                if (id == R.id.menu_home) {
                    fragment = new HomeFragment();
                } else if (id == R.id.menu_explore) {
                    fragment = new com.example.campusvault.ui.main.explore.ExploreFragment();
                } else if (id == R.id.menu_upload) {
                    fragment = PlaceholderFragment.newInstance("Upload coming soon");
                } else if (id == R.id.menu_bookmarks) {
                    fragment = PlaceholderFragment.newInstance("Bookmarks coming soon");
                } else if (id == R.id.menu_profile) {
                    fragment = PlaceholderFragment.newInstance("Profile coming soon");
                }
                if (fragment != null) {
                    switchTo(fragment);
                    return true;
                }
                return false;
            }
        });
    }

    private void switchTo(Fragment fragment) {
        getSupportFragmentManager()
            .beginTransaction()
            .setCustomAnimations(android.R.anim.fade_in, android.R.anim.fade_out)
            .replace(R.id.fragmentContainer, fragment)
            .commit();
    }
}
