package com.example.campusvault.ui.main.explore.adapters;

import android.view.LayoutInflater;
import android.view.ViewGroup;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.DiffUtil;
import androidx.recyclerview.widget.ListAdapter;
import androidx.recyclerview.widget.RecyclerView;
import com.example.campusvault.data.models.CourseUnit;
import com.example.campusvault.databinding.ItemCourseUnitChipBinding;

public class CourseUnitAdapter extends ListAdapter<CourseUnit, CourseUnitAdapter.CourseUnitViewHolder> {
    private final OnCourseUnitClickListener listener;
    private Integer selectedId = null;

    public CourseUnitAdapter(OnCourseUnitClickListener listener) {
        super(DIFF_CALLBACK);
        this.listener = listener;
    }

    public void setSelectedId(Integer id) {
        this.selectedId = id;
        notifyDataSetChanged();
    }

    @NonNull
    @Override
    public CourseUnitViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        ItemCourseUnitChipBinding binding = ItemCourseUnitChipBinding.inflate(LayoutInflater.from(parent.getContext()), parent, false);
        return new CourseUnitViewHolder(binding);
    }

    @Override
    public void onBindViewHolder(@NonNull CourseUnitViewHolder holder, int position) {
        CourseUnit item = getItem(position);
        holder.bind(item, listener, selectedId != null && selectedId.equals(item.getId()));
    }

    static class CourseUnitViewHolder extends RecyclerView.ViewHolder {
        private final ItemCourseUnitChipBinding binding;

        CourseUnitViewHolder(ItemCourseUnitChipBinding binding) {
            super(binding.getRoot());
            this.binding = binding;
        }

        void bind(CourseUnit item, OnCourseUnitClickListener listener, boolean isSelected) {
            binding.chipCourseUnit.setText(item.getName());
            binding.chipCourseUnit.setChecked(isSelected);
            binding.chipCourseUnit.setOnClickListener(v -> listener.onCourseUnitClick(item));
        }
    }

    public interface OnCourseUnitClickListener {
        void onCourseUnitClick(CourseUnit courseUnit);
    }

    private static final DiffUtil.ItemCallback<CourseUnit> DIFF_CALLBACK = new DiffUtil.ItemCallback<CourseUnit>() {
        @Override
        public boolean areItemsTheSame(@NonNull CourseUnit oldItem, @NonNull CourseUnit newItem) {
            return oldItem.getId() == newItem.getId();
        }

        @Override
        public boolean areContentsTheSame(@NonNull CourseUnit oldItem, @NonNull CourseUnit newItem) {
            return oldItem.getName().equals(newItem.getName());
        }
    };
}
