package com.example.campusvault.ui.main.home.adapters;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.DiffUtil;
import androidx.recyclerview.widget.ListAdapter;
import androidx.recyclerview.widget.RecyclerView;
import com.example.campusvault.data.models.CourseUnit;
import com.example.campusvault.databinding.ItemCourseUnitBinding;

public class CourseUnitAdapter extends ListAdapter<CourseUnit, CourseUnitAdapter.VH> {

    public interface OnCourseUnitClickListener {
        void onCourseUnitClicked(CourseUnit cu);
    }

    private final OnCourseUnitClickListener listener;

    public CourseUnitAdapter(OnCourseUnitClickListener listener) {
        super(DIFF);
        this.listener = listener;
    }

    private static final DiffUtil.ItemCallback<CourseUnit> DIFF = new DiffUtil.ItemCallback<CourseUnit>() {
        @Override
        public boolean areItemsTheSame(@NonNull CourseUnit oldItem, @NonNull CourseUnit newItem) {
            return oldItem.getId() == newItem.getId();
        }

        @Override
        public boolean areContentsTheSame(@NonNull CourseUnit oldItem, @NonNull CourseUnit newItem) {
            return oldItem.getName().equals(newItem.getName()) &&
                   oldItem.getCode().equals(newItem.getCode()) &&
                   oldItem.getYear() == newItem.getYear() &&
                   oldItem.getSemester() == newItem.getSemester();
        }
    };

    @NonNull @Override
    public VH onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        ItemCourseUnitBinding b = ItemCourseUnitBinding.inflate(LayoutInflater.from(parent.getContext()), parent, false);
        return new VH(b);
    }

    @Override
    public void onBindViewHolder(@NonNull VH holder, int position) {
        CourseUnit cu = getItem(position);
        holder.bind(cu, listener);
    }

    static class VH extends RecyclerView.ViewHolder {
        private final ItemCourseUnitBinding b;
        VH(ItemCourseUnitBinding b) {
            super(b.getRoot());
            this.b = b;
        }
        void bind(CourseUnit cu, OnCourseUnitClickListener listener) {
            b.tvCode.setText(cu.getCode());
            b.tvName.setText(cu.getName());
            b.tvMeta.setText("Year " + cu.getYear() + " • Sem " + cu.getSemester());
            b.getRoot().setOnClickListener(v -> {
                if (listener != null) listener.onCourseUnitClicked(cu);
            });
        }
    }
}
