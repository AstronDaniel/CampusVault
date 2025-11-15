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
                // Load dummy data if no real data
                adapter.submitList(createDummyResources());
            }
        });
    }

    private java.util.List<com.example.campusvault.data.models.Resource> createDummyResources() {
        java.util.List<com.example.campusvault.data.models.Resource> list = new java.util.ArrayList<>();
        
        if ("notes".equals(kind)) {
            // Dummy notes
            com.example.campusvault.data.models.Resource r1 = new com.example.campusvault.data.models.Resource();
            r1.setId(1);
            r1.setTitle("Lecture Notes - Week 1");
            r1.setDescription("Introduction and fundamentals");
            r1.setFileType("PDF");
            r1.setResourceType("notes");
            r1.setDownloadCount(145);
            r1.setAverageRating(4.5f);
            list.add(r1);
            
            com.example.campusvault.data.models.Resource r2 = new com.example.campusvault.data.models.Resource();
            r2.setId(2);
            r2.setTitle("Lecture Notes - Week 2");
            r2.setDescription("Advanced concepts and examples");
            r2.setFileType("PDF");
            r2.setResourceType("notes");
            r2.setDownloadCount(132);
            r2.setAverageRating(4.3f);
            list.add(r2);
            
            com.example.campusvault.data.models.Resource r3 = new com.example.campusvault.data.models.Resource();
            r3.setId(3);
            r3.setTitle("Study Guide");
            r3.setDescription("Comprehensive study material");
            r3.setFileType("PDF");
            r3.setResourceType("notes");
            r3.setDownloadCount(198);
            r3.setAverageRating(4.7f);
            list.add(r3);
            
            com.example.campusvault.data.models.Resource r4 = new com.example.campusvault.data.models.Resource();
            r4.setId(4);
            r4.setTitle("Practice Problems");
            r4.setDescription("Problems with solutions");
            r4.setFileType("PDF");
            r4.setResourceType("notes");
            r4.setDownloadCount(167);
            r4.setAverageRating(4.6f);
            list.add(r4);
        } else {
            // Dummy past papers
            com.example.campusvault.data.models.Resource r1 = new com.example.campusvault.data.models.Resource();
            r1.setId(5);
            r1.setTitle("2023 Final Exam");
            r1.setDescription("Final examination paper");
            r1.setFileType("PDF");
            r1.setResourceType("past_paper");
            r1.setDownloadCount(234);
            r1.setAverageRating(4.8f);
            list.add(r1);
            
            com.example.campusvault.data.models.Resource r2 = new com.example.campusvault.data.models.Resource();
            r2.setId(6);
            r2.setTitle("2023 Midterm Exam");
            r2.setDescription("Midterm examination paper");
            r2.setFileType("PDF");
            r2.setResourceType("past_paper");
            r2.setDownloadCount(189);
            r2.setAverageRating(4.5f);
            list.add(r2);
            
            com.example.campusvault.data.models.Resource r3 = new com.example.campusvault.data.models.Resource();
            r3.setId(7);
            r3.setTitle("2022 Final Exam");
            r3.setDescription("Previous year final exam");
            r3.setFileType("PDF");
            r3.setResourceType("past_paper");
            r3.setDownloadCount(201);
            r3.setAverageRating(4.6f);
            list.add(r3);
            
            com.example.campusvault.data.models.Resource r4 = new com.example.campusvault.data.models.Resource();
            r4.setId(8);
            r4.setTitle("2022 Midterm Exam");
            r4.setDescription("Previous year midterm exam");
            r4.setFileType("PDF");
            r4.setResourceType("past_paper");
            r4.setDownloadCount(176);
            r4.setAverageRating(4.4f);
            list.add(r4);
        }
        
        return list;
    }

    @Override
    public void onResume() {
        super.onResume();
        viewModel.loadResources(courseUnitId, kind);
    }
}
