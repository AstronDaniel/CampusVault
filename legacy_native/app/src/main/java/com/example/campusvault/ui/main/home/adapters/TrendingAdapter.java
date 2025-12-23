package com.example.campusvault.ui.main.home.adapters;

import android.view.LayoutInflater;
import android.view.ViewGroup;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.DiffUtil;
import androidx.recyclerview.widget.ListAdapter;
import androidx.recyclerview.widget.RecyclerView;
import com.example.campusvault.data.models.Resource;
import com.example.campusvault.databinding.ItemTrendingCardBinding;

public class TrendingAdapter extends ListAdapter<Resource, TrendingAdapter.VH> {

    public TrendingAdapter() {
        super(DIFF);
    }

    private static final DiffUtil.ItemCallback<Resource> DIFF = new DiffUtil.ItemCallback<Resource>() {
        @Override
        public boolean areItemsTheSame(@NonNull Resource oldItem, @NonNull Resource newItem) {
            return oldItem.getId() == newItem.getId();
        }
        @Override
        public boolean areContentsTheSame(@NonNull Resource oldItem, @NonNull Resource newItem) {
            return oldItem.getTitle().equals(newItem.getTitle());
        }
    };

    @NonNull
    @Override
    public VH onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        return new VH(ItemTrendingCardBinding.inflate(LayoutInflater.from(parent.getContext()), parent, false));
    }

    @Override
    public void onBindViewHolder(@NonNull VH holder, int position) {
        holder.bind(getItem(position));
    }

    static class VH extends RecyclerView.ViewHolder {
        private final ItemTrendingCardBinding b;
        VH(ItemTrendingCardBinding b) {
            super(b.getRoot());
            this.b = b;
        }
        void bind(Resource r) {
            b.tvTitle.setText(r.getTitle());
            b.tvRating.setText(String.format("%.1f", r.getAverageRating()));
            b.tvDownloads.setText(String.valueOf(r.getDownloadCount()));
        }
    }
}
