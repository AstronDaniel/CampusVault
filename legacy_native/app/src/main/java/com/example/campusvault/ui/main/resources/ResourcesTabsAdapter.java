package com.example.campusvault.ui.main.resources;

import androidx.annotation.NonNull;
import androidx.fragment.app.Fragment;
import androidx.fragment.app.FragmentActivity;
import androidx.viewpager2.adapter.FragmentStateAdapter;

public class ResourcesTabsAdapter extends FragmentStateAdapter {
    private final int courseUnitId;

    public ResourcesTabsAdapter(@NonNull FragmentActivity fragmentActivity, int courseUnitId) {
        super(fragmentActivity);
        this.courseUnitId = courseUnitId;
    }

    @NonNull @Override
    public Fragment createFragment(int position) {
        if (position == 0) {
            return ResourcesTabFragment.newInstance(courseUnitId, "notes");
        } else {
            return ResourcesTabFragment.newInstance(courseUnitId, "past");
        }
    }

    @Override
    public int getItemCount() { return 2; }
}
