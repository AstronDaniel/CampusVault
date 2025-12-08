package com.example.campusvault.ui.main.profile.resources;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.DiffUtil;
import androidx.recyclerview.widget.ListAdapter;
import androidx.recyclerview.widget.RecyclerView;

import com.example.campusvault.R;
import com.example.campusvault.data.models.Resource;
import com.example.campusvault.databinding.ItemMyResourceBinding;

import java.text.SimpleDateFormat;
import java.util.Locale;
import java.util.concurrent.TimeUnit;

public class MyResourcesAdapter extends ListAdapter<Resource, MyResourcesAdapter.ViewHolder> {

    private final OnResourceActionListener listener;

    public interface OnResourceActionListener {
        void onResourceClick(Resource resource);
        void onMoreClick(Resource resource, View anchor);
    }

    public MyResourcesAdapter(OnResourceActionListener listener) {
        super(DIFF_CALLBACK);
        this.listener = listener;
    }

    private static final DiffUtil.ItemCallback<Resource> DIFF_CALLBACK = new DiffUtil.ItemCallback<Resource>() {
        @Override
        public boolean areItemsTheSame(@NonNull Resource oldItem, @NonNull Resource newItem) {
            return oldItem.getId() == newItem.getId();
        }

        @Override
        public boolean areContentsTheSame(@NonNull Resource oldItem, @NonNull Resource newItem) {
            return oldItem.getTitle().equals(newItem.getTitle()) &&
                   oldItem.getDownloadCount() == newItem.getDownloadCount();
        }
    };

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        ItemMyResourceBinding binding = ItemMyResourceBinding.inflate(
                LayoutInflater.from(parent.getContext()), parent, false);
        return new ViewHolder(binding);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        holder.bind(getItem(position));
    }

    class ViewHolder extends RecyclerView.ViewHolder {
        private final ItemMyResourceBinding binding;

        ViewHolder(ItemMyResourceBinding binding) {
            super(binding.getRoot());
            this.binding = binding;
        }

        void bind(Resource resource) {
            binding.tvTitle.setText(resource.getTitle());
            
            // Course unit
            if (resource.getCourseUnit() != null) {
                binding.tvCourseUnit.setText(resource.getCourseUnit().getName());
                binding.tvCourseUnit.setVisibility(View.VISIBLE);
            } else {
                binding.tvCourseUnit.setVisibility(View.GONE);
            }

            // Resource type badge and icon
            String type = resource.getResourceType();
            if (type != null) {
                binding.tvTypeBadge.setText(formatResourceType(type));
                binding.ivTypeIcon.setImageResource(getTypeIcon(type));
            }

            // Stats
            binding.tvDownloads.setText(String.valueOf(resource.getDownloadCount()));
            
            float avgRating = resource.getAverageRating();
            binding.tvRating.setText(String.format(Locale.US, "%.1f", avgRating));
            binding.tvRatingCount.setVisibility(View.GONE); // Hide rating count since we don't have it

            // Date
            binding.tvDate.setText(getRelativeTime(resource.getUploadedAt()));

            // Click listeners
            binding.cardResource.setOnClickListener(v -> {
                if (listener != null) listener.onResourceClick(resource);
            });

            binding.btnMore.setOnClickListener(v -> {
                if (listener != null) listener.onMoreClick(resource, v);
            });
        }

        private String formatResourceType(String type) {
            if (type == null) return "Other";
            switch (type.toLowerCase()) {
                case "notes": return "Notes";
                case "past_paper": return "Past Paper";
                case "slides": return "Slides";
                case "book": return "Book";
                case "assignment": return "Assignment";
                default: return type;
            }
        }

        private int getTypeIcon(String type) {
            if (type == null) return R.drawable.ic_description;
            switch (type.toLowerCase()) {
                case "notes": return R.drawable.ic_description;
                case "past_paper": return R.drawable.ic_quiz;
                case "slides": return R.drawable.ic_slideshow;
                case "book": return R.drawable.ic_book;
                default: return R.drawable.ic_description;
            }
        }

        private String getRelativeTime(java.util.Date date) {
            if (date == null) return "";
            try {
                long diff = System.currentTimeMillis() - date.getTime();
                long days = TimeUnit.MILLISECONDS.toDays(diff);
                long hours = TimeUnit.MILLISECONDS.toHours(diff);
                long minutes = TimeUnit.MILLISECONDS.toMinutes(diff);

                if (days > 30) {
                    return new SimpleDateFormat("MMM d, yyyy", Locale.US).format(date);
                } else if (days > 0) {
                    return days + (days == 1 ? " day ago" : " days ago");
                } else if (hours > 0) {
                    return hours + (hours == 1 ? " hour ago" : " hours ago");
                } else if (minutes > 0) {
                    return minutes + (minutes == 1 ? " min ago" : " mins ago");
                } else {
                    return "Just now";
                }
            } catch (Exception e) {
                return "";
            }
        }
    }
}
