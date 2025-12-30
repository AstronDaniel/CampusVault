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
import androidx.recyclerview.widget.LinearLayoutManager;
import androidx.recyclerview.widget.ItemTouchHelper;
import androidx.recyclerview.widget.RecyclerView;
import com.example.campusvault.data.models.Resource;
import com.example.campusvault.databinding.FragmentBookmarksBinding;
import com.example.campusvault.ui.main.resources.ResourceDetailActivity;
import com.google.android.material.snackbar.Snackbar;

public class BookmarkFragment extends Fragment {
    private FragmentBookmarksBinding binding;
    private BookmarkViewModel vm;
    private BookmarkAdapter adapter;
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

        vm = new ViewModelProvider(this, new BookmarkViewModelFactory(requireActivity().getApplication())).get(BookmarkViewModel.class);

        // Use new BookmarkAdapter with dedicated bookmark card layout
        adapter = new BookmarkAdapter(this::openDetail, this::onRemoveBookmark);
        binding.rvBookmarks.setLayoutManager(new LinearLayoutManager(requireContext()));
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

        // Sort chips
        binding.chipSortRecent.setOnClickListener(v -> {
            selectedSort = "recent";
            updateSortChips();
            applyFilters();
        });
        binding.chipSortAlphabetical.setOnClickListener(v -> {
            selectedSort = "alphabetical";
            updateSortChips();
            applyFilters();
        });
        binding.chipSortRating.setOnClickListener(v -> {
            selectedSort = "rating";
            updateSortChips();
            applyFilters();
        });

        // Type filter chips (only All, Notes, Past Papers)
        binding.chipAll.setOnClickListener(v -> {
            selectedType = null;
            updateTypeChips();
            applyFilters();
        });
        binding.chipNotes.setOnClickListener(v -> {
            selectedType = "notes";
            updateTypeChips();
            applyFilters();
        });
        binding.chipPastPapers.setOnClickListener(v -> {
            selectedType = "past_paper";
            updateTypeChips();
            applyFilters();
        });
        
        // Hide slides chip since we only have notes and past_paper
        // (Slides chip removed from layout)

        // Search
        binding.etSearch.setOnEditorActionListener((v, actionId, event) -> {
            String query = binding.etSearch.getText() != null ? binding.etSearch.getText().toString().trim() : null;
            vm.setSearchQuery(query == null || query.isEmpty() ? null : query);
            return true;
        });

        // Pull to refresh
        binding.swipeRefreshLayout.setOnRefreshListener(() -> vm.loadBookmarks());

        // Observe data
        vm.bookmarks.observe(getViewLifecycleOwner(), list -> {
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

        // Observe loading state
        vm.loading.observe(getViewLifecycleOwner(), isLoading -> {
            binding.swipeRefreshLayout.setRefreshing(isLoading);
            if (isLoading && adapter.getCurrentList().isEmpty()) {
                binding.shimmerLoading.setVisibility(View.VISIBLE);
                binding.shimmerLoading.startShimmer();
            } else {
                binding.shimmerLoading.stopShimmer();
                binding.shimmerLoading.setVisibility(View.GONE);
            }
        });

        // Observe errors
        vm.error.observe(getViewLifecycleOwner(), error -> {
            if (error != null && !error.isEmpty()) {
                Toast.makeText(requireContext(), error, Toast.LENGTH_SHORT).show();
            }
        });
    }

    @Override
    public void onResume() {
        super.onResume();
        // Refresh bookmarks when returning to this screen
        vm.loadBookmarks();
    }

    private void updateSortChips() {
        binding.chipSortRecent.setChecked("recent".equals(selectedSort));
        binding.chipSortAlphabetical.setChecked("alphabetical".equals(selectedSort));
        binding.chipSortRating.setChecked("rating".equals(selectedSort));
    }

    private void updateTypeChips() {
        binding.chipAll.setChecked(selectedType == null);
        binding.chipNotes.setChecked("notes".equals(selectedType));
        binding.chipPastPapers.setChecked("past_paper".equals(selectedType));
    }

    private void applyFilters() {
        vm.setSortAndType(selectedSort, selectedType);
    }

    private void openDetail(Resource resource) {
        android.content.Intent intent = new android.content.Intent(requireContext(), ResourceDetailActivity.class);
        intent.putExtra(ResourceDetailActivity.EXTRA_RESOURCE_ID, resource.getId());
        startActivity(intent);
    }

    private void onRemoveBookmark(Resource resource) {
        vm.unbookmarkResource(resource.getId());
        Snackbar.make(binding.getRoot(), "Bookmark removed", Snackbar.LENGTH_LONG)
            .setAction("UNDO", v -> vm.bookmarkResource(resource.getId()))
            .show();
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        binding = null;
    }
}

