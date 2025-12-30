package com.example.campusvault.ui.main.explore.adapters;

import android.view.LayoutInflater;
import android.view.ViewGroup;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.DiffUtil;
import androidx.recyclerview.widget.ListAdapter;
import androidx.recyclerview.widget.RecyclerView;
import com.example.campusvault.R;
import com.example.campusvault.data.models.Resource;
import com.example.campusvault.databinding.ItemResourceCardBinding;
import java.util.Locale;

public class ResourceAdapter extends ListAdapter<Resource, ResourceAdapter.ResourceViewHolder> {
    private final OnResourceClickListener resourceClickListener;
    private final OnBookmarkClickListener bookmarkClickListener;

    public ResourceAdapter(OnResourceClickListener listener) {
        this(listener, null);
    }

    public ResourceAdapter(OnResourceClickListener resourceClickListener,
                           OnBookmarkClickListener bookmarkClickListener) {
        super(DIFF_CALLBACK);
        this.resourceClickListener = resourceClickListener;
        this.bookmarkClickListener = bookmarkClickListener;
    }

    @NonNull
    @Override
    public ResourceViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        ItemResourceCardBinding binding = ItemResourceCardBinding.inflate(LayoutInflater.from(parent.getContext()), parent, false);
        return new ResourceViewHolder(binding);
    }

    @Override
    public void onBindViewHolder(@NonNull ResourceViewHolder holder, int position) {
        Resource resource = getItem(position);
        holder.bind(resource, resourceClickListener, bookmarkClickListener);
    }

    static class ResourceViewHolder extends RecyclerView.ViewHolder {
        private final ItemResourceCardBinding binding;

        ResourceViewHolder(ItemResourceCardBinding binding) {
            super(binding.getRoot());
            this.binding = binding;
        }

        void bind(Resource resource,
                  OnResourceClickListener resourceListener,
                  OnBookmarkClickListener bookmarkListener) {
            binding.tvTitle.setText(resource.getTitle());
            binding.tvSubtitle.setText(resource.getCourseUnit() != null
                    ? resource.getCourseUnit().getName()
                    : resource.getFileType());
            binding.tvDownloads.setText(String.valueOf(resource.getDownloadCount()));
            binding.tvRating.setText(String.format(Locale.getDefault(), "%.1f", resource.getAverageRating()));

            itemView.setOnClickListener(v -> {
                if (resourceListener != null) {
                    resourceListener.onResourceClick(resource);
                }
            });

            if (binding.btnBookmark != null) {
                binding.btnBookmark.setImageResource(resource.isBookmarked()
                        ? R.drawable.ic_bookmark
                        : R.drawable.ic_bookmark_empty);
                binding.btnBookmark.setOnClickListener(v -> {
                    if (bookmarkListener != null) {
                        bookmarkListener.onBookmarkClick(resource);
                    }
                });
            }
        }
    }

    public interface OnResourceClickListener {
        void onResourceClick(Resource resource);
    }

    public interface OnBookmarkClickListener {
        void onBookmarkClick(Resource resource);
    }

    private static final DiffUtil.ItemCallback<Resource> DIFF_CALLBACK = new DiffUtil.ItemCallback<Resource>() {
        @Override
        public boolean areItemsTheSame(@NonNull Resource oldItem, @NonNull Resource newItem) {
            return oldItem.getId() == newItem.getId();
        }

        @Override
        public boolean areContentsTheSame(@NonNull Resource oldItem, @NonNull Resource newItem) {
            return oldItem.equals(newItem);
        }
    };
}
