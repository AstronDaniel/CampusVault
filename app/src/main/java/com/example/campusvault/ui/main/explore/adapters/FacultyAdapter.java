package com.example.campusvault.ui.main.explore.adapters;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.DiffUtil;
import androidx.recyclerview.widget.ListAdapter;
import androidx.recyclerview.widget.RecyclerView;
import com.example.campusvault.data.models.FacultyResponse;
import com.example.campusvault.databinding.ItemFacultyCardBinding;

public class FacultyAdapter extends ListAdapter<FacultyResponse, FacultyAdapter.FacultyViewHolder> {
    private final OnFacultyClickListener listener;

    public FacultyAdapter(OnFacultyClickListener listener) {
        super(DIFF_CALLBACK);
        this.listener = listener;
    }

    @NonNull
    @Override
    public FacultyViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        ItemFacultyCardBinding binding = ItemFacultyCardBinding.inflate(LayoutInflater.from(parent.getContext()), parent, false);
        return new FacultyViewHolder(binding);
    }

    @Override
    public void onBindViewHolder(@NonNull FacultyViewHolder holder, int position) {
        FacultyResponse faculty = getItem(position);
        holder.bind(faculty, listener);
    }

    static class FacultyViewHolder extends RecyclerView.ViewHolder {
        private final ItemFacultyCardBinding binding;

        FacultyViewHolder(ItemFacultyCardBinding binding) {
            super(binding.getRoot());
            this.binding = binding;
        }

        void bind(FacultyResponse faculty, OnFacultyClickListener listener) {
            binding.tvFacultyName.setText(faculty.getName());
            binding.tvResourceCount.setText(String.format("%d resources", 0)); // Placeholder
            itemView.setOnClickListener(v -> listener.onFacultyClick(faculty.getId()));
        }
    }

    public interface OnFacultyClickListener {
        void onFacultyClick(int facultyId);
    }

    private static final DiffUtil.ItemCallback<FacultyResponse> DIFF_CALLBACK = new DiffUtil.ItemCallback<FacultyResponse>() {
        @Override
        public boolean areItemsTheSame(@NonNull FacultyResponse oldItem, @NonNull FacultyResponse newItem) {
            return oldItem.getId() == newItem.getId();
        }

        @Override
        public boolean areContentsTheSame(@NonNull FacultyResponse oldItem, @NonNull FacultyResponse newItem) {
            return oldItem.getName().equals(newItem.getName());
        }
    };
}
