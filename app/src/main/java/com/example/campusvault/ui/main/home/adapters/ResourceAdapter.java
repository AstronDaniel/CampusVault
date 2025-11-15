package com.example.campusvault.ui.main.home.adapters;

import android.view.LayoutInflater;
import android.view.ViewGroup;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.DiffUtil;
import androidx.recyclerview.widget.ListAdapter;
import androidx.recyclerview.widget.RecyclerView;
import com.example.campusvault.data.models.Resource;
import com.example.campusvault.databinding.ItemResourceCardBinding;

public class ResourceAdapter extends ListAdapter<Resource, ResourceAdapter.VH> {

    private final OnResourceClickListener listener;

    public interface OnResourceClickListener {
        void onResourceClicked(Resource resource);
    }

    public ResourceAdapter() {
        this(null);
    }

    public ResourceAdapter(OnResourceClickListener listener) {
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
            return oldItem.getTitle().equals(newItem.getTitle()) &&
                   oldItem.getDownloadCount() == newItem.getDownloadCount();
        }
    };

    @NonNull
    @Override
    public VH onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        return new VH(ItemResourceCardBinding.inflate(LayoutInflater.from(parent.getContext()), parent, false));
    }

    @Override
    public void onBindViewHolder(@NonNull VH holder, int position) {
        Resource resource = getItem(position);
        holder.bind(resource);
        if (listener != null) {
            holder.itemView.setOnClickListener(v -> listener.onResourceClicked(resource));
        }
    }

    static class VH extends RecyclerView.ViewHolder {
        private final ItemResourceCardBinding b;
        VH(ItemResourceCardBinding b) {
            super(b.getRoot());
            this.b = b;
        }
        void bind(Resource r) {
            b.tvTitle.setText(r.getTitle());
            b.tvSubtitle.setText(r.getDescription());
            b.tvDownloads.setText(String.valueOf(r.getDownloadCount()));
            b.tvRating.setText(String.format("%.1f", r.getAverageRating()));
        }
    }
}
