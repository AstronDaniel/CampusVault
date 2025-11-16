package com.example.campusvault.ui.main.explore.adapters;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.DiffUtil;
import androidx.recyclerview.widget.ListAdapter;
import androidx.recyclerview.widget.RecyclerView;

import com.bumptech.glide.Glide;
import com.example.campusvault.R;
import com.example.campusvault.data.models.Resource;

public class ResourceGridAdapter extends ListAdapter<Resource, ResourceGridAdapter.VH> {

    public interface OnItemClickListener {
        void onClick(Resource resource);
    }

    private final OnItemClickListener listener;

    public ResourceGridAdapter(OnItemClickListener listener) {
        super(DIFF);
        this.listener = listener;
    }

    private static final DiffUtil.ItemCallback<Resource> DIFF = new DiffUtil.ItemCallback<Resource>() {
        @Override
        public boolean areItemsTheSame(@NonNull Resource oldItem, @NonNull Resource newItem) {
            return oldItem.getId() == newItem.getId();
        }

        @Override
        public boolean areContentsTheSame(@NonNull Resource oldItem, @NonNull Resource newItem) {
            return oldItem.equals(newItem);
        }
    };

    @NonNull
    @Override
    public VH onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_resource_grid_card, parent, false);
        return new VH(view);
    }

    @Override
    public void onBindViewHolder(@NonNull VH holder, int position) {
        Resource res = getItem(position);
        holder.bind(res, listener);
    }

    static class VH extends RecyclerView.ViewHolder {
        ImageView ivThumb;
        TextView tvTitle;
        TextView tvDownloads;

        VH(@NonNull View itemView) {
            super(itemView);
            ivThumb = itemView.findViewById(R.id.ivThumb);
            tvTitle = itemView.findViewById(R.id.tvTitle);
            tvDownloads = itemView.findViewById(R.id.tvDownloads);
        }

        void bind(Resource r, OnItemClickListener listener) {
            tvTitle.setText(r.getTitle());
            tvDownloads.setText(String.valueOf(r.getDownloadCount()));

            String thumb = r.getThumbnailUrl();
            if (thumb != null && !thumb.isEmpty()) {
                Glide.with(ivThumb.getContext())
                        .load(thumb)
                        .centerCrop()
                        .placeholder(R.drawable.gradient_navy_purple)
                        .into(ivThumb);
            } else {
                ivThumb.setImageResource(R.drawable.gradient_navy_purple);
            }

            itemView.setOnClickListener(v -> listener.onClick(r));
        }
    }
}
