package com.example.campusvault.ui.main.profile.resources;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.lifecycle.ViewModelProvider;
import androidx.recyclerview.widget.LinearLayoutManager;
import com.example.campusvault.databinding.FragmentMyResourcesBinding;
import com.example.campusvault.ui.main.explore.adapters.ResourceAdapter;
import com.example.campusvault.ui.main.profile.ProfileViewModel;

public class MyResourcesFragment extends Fragment {

    private FragmentMyResourcesBinding binding;
    private ProfileViewModel vm;
    private ResourceAdapter adapter;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        binding = FragmentMyResourcesBinding.inflate(inflater, container, false);
        return binding.getRoot();
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);
        vm = new ViewModelProvider(requireParentFragment()).get(ProfileViewModel.class);
        adapter = new ResourceAdapter(null, null);
        binding.rvMyResources.setLayoutManager(new LinearLayoutManager(getContext()));
        binding.rvMyResources.setAdapter(adapter);

        vm.myResources.observe(getViewLifecycleOwner(), resources -> {
            if (resources != null) {
                adapter.submitList(resources);
            }
        });
    }
}
