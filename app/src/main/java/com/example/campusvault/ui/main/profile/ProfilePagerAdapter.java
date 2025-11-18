package com.example.campusvault.ui.main.profile;

import androidx.annotation.NonNull;
import androidx.fragment.app.Fragment;
import androidx.viewpager2.adapter.FragmentStateAdapter;
import com.example.campusvault.ui.main.profile.resources.MyResourcesFragment;

public class ProfilePagerAdapter extends FragmentStateAdapter {

    public ProfilePagerAdapter(@NonNull Fragment fragment) {
        super(fragment);
    }

    @NonNull
    @Override
    public Fragment createFragment(int position) {
        if (position == 0) {
            return new MyResourcesFragment();
        }
        // Add more fragments for other tabs here
        return new MyResourcesFragment(); // Default
    }

    @Override
    public int getItemCount() {
        return 1; // Number of tabs
    }
}
