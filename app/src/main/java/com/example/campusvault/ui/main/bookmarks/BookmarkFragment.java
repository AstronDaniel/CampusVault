package com.example.campusvault.ui.main.bookmarks;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Toast;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.lifecycle.ViewModelProvider;
import androidx.recyclerview.widget.GridLayoutManager;
import androidx.recyclerview.widget.ItemTouchHelper;
import androidx.recyclerview.widget.RecyclerView;

import com.example.campusvault.data.local.SharedPreferencesManager;
import com.example.campusvault.data.models.Resource;
import com.example.campusvault.databinding.FragmentBookmarksBinding;
import com.example.campusvault.ui.main.explore.adapters.ResourceGridAdapter;
import com.example.campusvault.ui.main.resources.ResourceDetailActivity;
import com.google.android.material.chip.Chip;
import com.google.android.material.snackbar.Snackbar;

public class BookmarkFragment extends Fragment {
    private FragmentBookmarksBinding binding;
    private BookmarkViewModel vm;
    private ResourceGridAdapter adapter;
    private String selectedSort = "recent";
    private String selectedType = null;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        binding = FragmentBookmarksBinding.inflate(inflater, container, false);
        return binding.getRoot();
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        SharedPreferencesManager spm = new SharedPreferencesManager(requireContext());
        vm = new ViewModelProvider(this, new BookmarkViewModelFactory(spm)).get(BookmarkViewModel.class);

        adapter = new ResourceGridAdapter(this::openDetail);
        GridLayoutManager glm = new GridLayoutManager(requireContext(), 2);
        binding.rvBookmarks.setLayoutManager(glm);
        binding.rvBookmarks.setAdapter(adapter);

        // Swipe to delete
        ItemTouchHelper itemTouchHelper = new ItemTouchHelper(new ItemTouchHelper.SimpleCallback(0, ItemTouchHelper.LEFT | ItemTouchHelper.RIGHT) {
            @Override
            public boolean onMove(@NonNull RecyclerView recyclerView, @NonNull RecyclerView.ViewHolder viewHolder, @NonNull RecyclerView.ViewHolder target) {
                return false;
            }

            @Override
            public void onSwiped(@NonNull RecyclerView.ViewHolder viewHolder, int direction) {
                int position = viewHolder.getAdapterPosition();
                Resource resource = adapter.getCurrentList().get(position);
                vm.unbookmarkResource(resource.getId());
                
                Snackbar.make(binding.getRoot(), "Bookmark removed", Snackbar.LENGTH_LONG)
                    .setAction("UNDO", v -> vm.bookmarkResource(resource.getId()))
                    .show();
            }
        });
        itemTouchHelper.attachToRecyclerView(binding.rvBookmarks);

        binding.swipe.setOnRefreshListener(() -> vm.refresh());

        // Sort chips
        binding.chipSortRecent.setOnClickListener(v -> {
            selectedSort = "recent";
            applyFilters();
        });
        binding.chipSortAlphabetical.setOnClickListener(v -> {
            selectedSort = "alphabetical";
            applyFilters();
        });
        binding.chipSortRating.setOnClickListener(v -> {
            selectedSort = "rating";
            applyFilters();
        });

        // Type filter chips
        binding.chipAll.setOnClickListener(v -> {
            selectedType = null;
            applyFilters();
        });
        binding.chipNotes.setOnClickListener(v -> {
            selectedType = "notes";
            applyFilters();
        });
        binding.chipPastPapers.setOnClickListener(v -> {
            selectedType = "past_paper";
            applyFilters();
        });
        binding.chipSlides.setOnClickListener(v -> {
            selectedType = "slides";
            applyFilters();
        });

        // Search
        binding.etSearch.setOnEditorActionListener((v, actionId, event) -> {
            String query = binding.etSearch.getText() != null ? binding.etSearch.getText().toString().trim() : null;
            vm.setSearchQuery(query.isEmpty() ? null : query);
            return true;
        });

        // Observe data
        vm.bookmarks.observe(getViewLifecycleOwner(), list -> {
            binding.swipe.setRefreshing(false);
            adapter.submitList(list);
            binding.tvBookmarkCount.setText(list != null ? list.size() + " bookmarks" : "0 bookmarks");
            
            if (list == null || list.isEmpty()) {
                binding.groupEmpty.setVisibility(View.VISIBLE);
                binding.rvBookmarks.setVisibility(View.GONE);
            } else {
                binding.groupEmpty.setVisibility(View.GONE);
                binding.rvBookmarks.setVisibility(View.VISIBLE);
            }
        });

        // Initial load
        vm.loadBookmarks();
    }

    private void applyFilters() {
        vm.setSortAndType(selectedSort, selectedType);
    }

    private void openDetail(Resource resource) {
        android.content.Intent intent = new android.content.Intent(requireContext(), ResourceDetailActivity.class);
        intent.putExtra(ResourceDetailActivity.EXTRA_RESOURCE_ID, resource.getId());
        intent.putExtra(ResourceDetailActivity.EXTRA_RESOURCE_TITLE, resource.getTitle());
        intent.putExtra(ResourceDetailActivity.EXTRA_RESOURCE_URL, resource.getFileUrl());
        intent.putExtra(ResourceDetailActivity.EXTRA_RESOURCE_DESCRIPTION, resource.getDescription());
        intent.putExtra(ResourceDetailActivity.EXTRA_RESOURCE_FILE_SIZE, resource.getFileSize());
        intent.putExtra(ResourceDetailActivity.EXTRA_RESOURCE_DOWNLOADS, resource.getDownloadCount());
        intent.putExtra(ResourceDetailActivity.EXTRA_RESOURCE_RATING, resource.getAverageRating());
        startActivity(intent);
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        binding = null;
    }
}

