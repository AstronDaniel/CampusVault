package com.example.campusvault.ui.main.bookmarks;

import android.view.LayoutInflater;
import android.view.ViewGroup;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.DiffUtil;
import androidx.recyclerview.widget.ListAdapter;
import androidx.recyclerview.widget.RecyclerView;
import com.example.campusvault.R;
import com.example.campusvault.data.models.Resource;
import com.example.campusvault.databinding.ItemBookmarkCardBinding;
import java.util.Locale;

public class BookmarkAdapter extends ListAdapter<Resource, BookmarkAdapter.BookmarkViewHolder> {
    private final OnBookmarkClickListener clickListener;
    private final OnRemoveBookmarkListener removeListener;

    public BookmarkAdapter(OnBookmarkClickListener clickListener, OnRemoveBookmarkListener removeListener) {
        super(DIFF_CALLBACK);
        this.clickListener = clickListener;
        this.removeListener = removeListener;
    }

    @NonNull
    @Override
    public BookmarkViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        ItemBookmarkCardBinding binding = ItemBookmarkCardBinding.inflate(
                LayoutInflater.from(parent.getContext()), parent, false);
        return new BookmarkViewHolder(binding);
    }

    @Override
    public void onBindViewHolder(@NonNull BookmarkViewHolder holder, int position) {
        Resource resource = getItem(position);
        holder.bind(resource, clickListener, removeListener);
    }

    static class BookmarkViewHolder extends RecyclerView.ViewHolder {
        private final ItemBookmarkCardBinding binding;

        BookmarkViewHolder(ItemBookmarkCardBinding binding) {
            super(binding.getRoot());
            this.binding = binding;
        }

        void bind(Resource resource, OnBookmarkClickListener clickListener, OnRemoveBookmarkListener removeListener) {
            // Title
            binding.tvTitle.setText(resource.getTitle());

            // Course Unit with code
            if (resource.getCourseUnit() != null && resource.getCourseUnit().getName() != null) {
                String code = resource.getCourseUnit().getCode();
                String name = resource.getCourseUnit().getName();
                if (code != null && !code.isEmpty()) {
                    binding.tvCourseUnit.setText(code + " • " + name);
                } else {
                    binding.tvCourseUnit.setText(name);
                }
            } else {
                binding.tvCourseUnit.setText(resource.getFileType() != null ? resource.getFileType().toUpperCase() : "Document");
            }

            // Resource Type with icon and color
            String resourceType = resource.getResourceType();
            if ("notes".equals(resourceType)) {
                binding.chipResourceType.setText("Notes");
                binding.cardTypeBadge.setCardBackgroundColor(itemView.getContext().getColor(R.color.info));
                binding.ivTypeIcon.setImageResource(R.drawable.ic_file);
            } else if ("past_paper".equals(resourceType)) {
                binding.chipResourceType.setText("Past Paper");
                binding.cardTypeBadge.setCardBackgroundColor(itemView.getContext().getColor(R.color.secondary));
                binding.ivTypeIcon.setImageResource(R.drawable.ic_history);
            } else {
                binding.chipResourceType.setText(resourceType != null ? formatResourceType(resourceType) : "Resource");
                binding.cardTypeBadge.setCardBackgroundColor(itemView.getContext().getColor(R.color.primary));
                binding.ivTypeIcon.setImageResource(R.drawable.ic_file);
            }

            // Rating
            binding.tvRating.setText(String.format(Locale.getDefault(), "%.1f", resource.getAverageRating()));

            // Downloads
            binding.tvDownloads.setText(formatDownloadCount(resource.getDownloadCount()));

            // File Size
            binding.tvFileSize.setText(formatFileSize(resource.getFileSize()));

            // Click listeners
            itemView.setOnClickListener(v -> {
                if (clickListener != null) {
                    clickListener.onBookmarkClick(resource);
                }
            });

            binding.btnRemoveBookmark.setOnClickListener(v -> {
                if (removeListener != null) {
                    removeListener.onRemoveBookmark(resource);
                }
            });
        }

        private String formatResourceType(String type) {
            if (type == null) return "Resource";
            return type.substring(0, 1).toUpperCase() + type.substring(1).replace("_", " ");
        }

        private String formatDownloadCount(int count) {
            if (count >= 1000) {
                return String.format(Locale.getDefault(), "%.1fk", count / 1000.0);
            }
            return String.valueOf(count);
        }

        private String formatFileSize(long bytes) {
            if (bytes <= 0) return "—";
            if (bytes < 1024) return bytes + " B";
            if (bytes < 1024 * 1024) return String.format(Locale.getDefault(), "%.1f KB", bytes / 1024.0);
            if (bytes < 1024 * 1024 * 1024) return String.format(Locale.getDefault(), "%.1f MB", bytes / (1024.0 * 1024));
            return String.format(Locale.getDefault(), "%.1f GB", bytes / (1024.0 * 1024 * 1024));
        }
    }

    public interface OnBookmarkClickListener {
        void onBookmarkClick(Resource resource);
    }

    public interface OnRemoveBookmarkListener {
        void onRemoveBookmark(Resource resource);
    }

    private static final DiffUtil.ItemCallback<Resource> DIFF_CALLBACK = new DiffUtil.ItemCallback<Resource>() {
        @Override
        public boolean areItemsTheSame(@NonNull Resource oldItem, @NonNull Resource newItem) {
            return oldItem.getId() == newItem.getId();
        }

        @Override
        public boolean areContentsTheSame(@NonNull Resource oldItem, @NonNull Resource newItem) {
            return oldItem.getId() == newItem.getId() &&
                    java.util.Objects.equals(oldItem.getTitle(), newItem.getTitle()) &&
                    oldItem.getAverageRating() == newItem.getAverageRating() &&
                    oldItem.getDownloadCount() == newItem.getDownloadCount();
        }
    };
}
