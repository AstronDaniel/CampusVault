package com.example.campusvault.ui.main.resources;

import android.view.LayoutInflater;
import android.view.ViewGroup;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.DiffUtil;
import androidx.recyclerview.widget.ListAdapter;
import androidx.recyclerview.widget.RecyclerView;
import com.example.campusvault.data.models.ResourceComment;
import com.example.campusvault.databinding.ItemCommentBinding;
import java.text.SimpleDateFormat;
import java.util.Locale;
import java.util.concurrent.TimeUnit;

public class CommentsAdapter extends ListAdapter<ResourceComment, CommentsAdapter.CommentViewHolder> {

    private static final DiffUtil.ItemCallback<ResourceComment> DIFF_CALLBACK = new DiffUtil.ItemCallback<ResourceComment>() {
        @Override
        public boolean areItemsTheSame(@NonNull ResourceComment oldItem, @NonNull ResourceComment newItem) {
            return oldItem.getId() == newItem.getId();
        }

        @Override
        public boolean areContentsTheSame(@NonNull ResourceComment oldItem, @NonNull ResourceComment newItem) {
            return oldItem.getBody().equals(newItem.getBody());
        }
    };

    public CommentsAdapter() {
        super(DIFF_CALLBACK);
    }

    @NonNull
    @Override
    public CommentViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        ItemCommentBinding binding = ItemCommentBinding.inflate(
            LayoutInflater.from(parent.getContext()), parent, false);
        return new CommentViewHolder(binding);
    }

    @Override
    public void onBindViewHolder(@NonNull CommentViewHolder holder, int position) {
        holder.bind(getItem(position));
    }

    static class CommentViewHolder extends RecyclerView.ViewHolder {
        private final ItemCommentBinding binding;

        public CommentViewHolder(ItemCommentBinding binding) {
            super(binding.getRoot());
            this.binding = binding;
        }

        public void bind(ResourceComment comment) {
            binding.tvUsername.setText(comment.getUsername() != null ? comment.getUsername() : "Anonymous");
            binding.tvContent.setText(comment.getBody());
            
            if (comment.getCreatedAt() != null) {
                binding.tvDate.setText(getTimeAgo(comment.getCreatedAt().getTime()));
            } else {
                binding.tvDate.setText("Just now");
            }
        }
        
        private String getTimeAgo(long time) {
            long now = System.currentTimeMillis();
            long diff = now - time;
            
            long seconds = TimeUnit.MILLISECONDS.toSeconds(diff);
            long minutes = TimeUnit.MILLISECONDS.toMinutes(diff);
            long hours = TimeUnit.MILLISECONDS.toHours(diff);
            long days = TimeUnit.MILLISECONDS.toDays(diff);
            
            if (seconds < 60) {
                return "Just now";
            } else if (minutes < 60) {
                return minutes + " min ago";
            } else if (hours < 24) {
                return hours + " hr ago";
            } else if (days < 7) {
                return days + " day" + (days > 1 ? "s" : "") + " ago";
            } else {
                SimpleDateFormat sdf = new SimpleDateFormat("MMM dd, yyyy", Locale.getDefault());
                return sdf.format(time);
            }
        }
    }
}
