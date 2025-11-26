package com.example.campusvault.ui.main.resources;

import android.content.Intent;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.lifecycle.ViewModelProvider;
import com.example.campusvault.ui.main.resources.ResourcesViewModelFactory;
import androidx.recyclerview.widget.LinearLayoutManager;
import com.example.campusvault.databinding.FragmentResourcesTabBinding;
import com.example.campusvault.ui.base.BaseFragment;
import com.example.campusvault.ui.main.home.adapters.ResourceAdapter;

public class ResourcesTabFragment extends BaseFragment<FragmentResourcesTabBinding> {
    private static final String ARG_CU_ID = "arg_cu_id";
    private static final String ARG_KIND = "arg_kind";

    private int courseUnitId;
    private String kind;
    private ResourcesViewModel viewModel;
    private ResourceAdapter adapter;

    public static ResourcesTabFragment newInstance(int courseUnitId, String kind) {
        ResourcesTabFragment f = new ResourcesTabFragment();
        Bundle b = new Bundle();
        b.putInt(ARG_CU_ID, courseUnitId);
        b.putString(ARG_KIND, kind);
        f.setArguments(b);
        return f;
    }

    @Override
    protected FragmentResourcesTabBinding getViewBinding(@NonNull LayoutInflater inflater, @Nullable ViewGroup container) {
        return FragmentResourcesTabBinding.inflate(inflater, container, false);
    }

    @Override
    protected void setupUI() {
        Bundle args = getArguments();
        if (args != null) {
            courseUnitId = args.getInt(ARG_CU_ID, -1);
            kind = args.getString(ARG_KIND, "notes");
        }

        setLoadingIndicator(binding.progressBar);
        adapter = new ResourceAdapter(resource -> {
            // Open resource detail activity
            Intent intent = new Intent(requireContext(), ResourceDetailActivity.class);
            intent.putExtra(ResourceDetailActivity.EXTRA_RESOURCE_ID, resource.getId());
            intent.putExtra(ResourceDetailActivity.EXTRA_RESOURCE_TITLE, resource.getTitle());
            intent.putExtra(ResourceDetailActivity.EXTRA_RESOURCE_URL, resource.getFileUrl());
            intent.putExtra(ResourceDetailActivity.EXTRA_RESOURCE_DESCRIPTION, resource.getDescription());
            intent.putExtra(ResourceDetailActivity.EXTRA_RESOURCE_FILE_SIZE, resource.getFileSize());
            intent.putExtra(ResourceDetailActivity.EXTRA_RESOURCE_DOWNLOADS, resource.getDownloadCount());
            intent.putExtra(ResourceDetailActivity.EXTRA_RESOURCE_RATING, resource.getAverageRating());
            startActivity(intent);
        });
        binding.recycler.setLayoutManager(new LinearLayoutManager(getContext()));
        binding.recycler.setAdapter(adapter);

        ResourcesViewModelFactory factory = new ResourcesViewModelFactory(requireContext());
        viewModel = new ViewModelProvider(this, factory).get(ResourcesViewModel.class);
    }

    @Override
    protected void observeData() {
        viewModel.resources.observe(getViewLifecycleOwner(), list -> {
            if (list != null && !list.isEmpty()) {
                adapter.submitList(list);
            } else {
                // Show empty list instead of dummy data
                adapter.submitList(new java.util.ArrayList<>());
            }
        });
    }

    @Override
    public void onResume() {
        super.onResume();
        viewModel.loadResources(courseUnitId, kind);
    }
}
