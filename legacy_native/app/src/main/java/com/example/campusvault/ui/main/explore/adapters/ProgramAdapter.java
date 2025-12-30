package com.example.campusvault.ui.main.explore.adapters;

import android.view.LayoutInflater;
import android.view.ViewGroup;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.DiffUtil;
import androidx.recyclerview.widget.ListAdapter;
import androidx.recyclerview.widget.RecyclerView;
import com.example.campusvault.data.models.ProgramResponse;
import com.example.campusvault.databinding.ItemProgramCardBinding;

public class ProgramAdapter extends ListAdapter<ProgramResponse, ProgramAdapter.ProgramViewHolder> {
    private final OnProgramClickListener listener;

    public ProgramAdapter(OnProgramClickListener listener) {
        super(DIFF_CALLBACK);
        this.listener = listener;
    }

    @NonNull
    @Override
    public ProgramViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        ItemProgramCardBinding binding = ItemProgramCardBinding.inflate(
                LayoutInflater.from(parent.getContext()), parent, false);
        return new ProgramViewHolder(binding);
    }

    @Override
    public void onBindViewHolder(@NonNull ProgramViewHolder holder, int position) {
        ProgramResponse program = getItem(position);
        holder.bind(program, listener);
    }

    static class ProgramViewHolder extends RecyclerView.ViewHolder {
        private final ItemProgramCardBinding binding;

        ProgramViewHolder(ItemProgramCardBinding binding) {
            super(binding.getRoot());
            this.binding = binding;
        }

        void bind(ProgramResponse program, OnProgramClickListener listener) {
            binding.tvProgramName.setText(program.getName());
            binding.tvProgramCode.setText(program.getCode() != null ? program.getCode() : "");
            binding.tvCourseUnitCount.setText(program.getDurationYears() + " year program");
            
            itemView.setOnClickListener(v -> {
                if (listener != null) {
                    listener.onProgramClick(program);
                }
            });
        }
    }

    public interface OnProgramClickListener {
        void onProgramClick(ProgramResponse program);
    }

    private static final DiffUtil.ItemCallback<ProgramResponse> DIFF_CALLBACK = 
            new DiffUtil.ItemCallback<ProgramResponse>() {
        @Override
        public boolean areItemsTheSame(@NonNull ProgramResponse oldItem, @NonNull ProgramResponse newItem) {
            return oldItem.getId() == newItem.getId();
        }

        @Override
        public boolean areContentsTheSame(@NonNull ProgramResponse oldItem, @NonNull ProgramResponse newItem) {
            return oldItem.getName().equals(newItem.getName());
        }
    };
}
