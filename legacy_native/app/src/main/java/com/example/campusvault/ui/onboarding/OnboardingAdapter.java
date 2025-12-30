package com.example.campusvault.ui.onboarding;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;
import com.example.campusvault.databinding.ItemOnboardingPageBinding;
import java.util.List;

/**
 * Adapter for ViewPager2 onboarding pages
 */
public class OnboardingAdapter extends RecyclerView.Adapter<OnboardingAdapter.OnboardingViewHolder> {

    private final List<OnboardingPage> pages;

    public OnboardingAdapter(List<OnboardingPage> pages) {
        this.pages = pages;
    }

    @NonNull
    @Override
    public OnboardingViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        ItemOnboardingPageBinding binding = ItemOnboardingPageBinding.inflate(
            LayoutInflater.from(parent.getContext()), parent, false
        );
        return new OnboardingViewHolder(binding);
    }

    @Override
    public void onBindViewHolder(@NonNull OnboardingViewHolder holder, int position) {
        holder.bind(pages.get(position));
    }

    @Override
    public int getItemCount() {
        return pages.size();
    }

    static class OnboardingViewHolder extends RecyclerView.ViewHolder {
        private final ItemOnboardingPageBinding binding;

        public OnboardingViewHolder(ItemOnboardingPageBinding binding) {
            super(binding.getRoot());
            this.binding = binding;
        }

        public void bind(OnboardingPage page) {
            binding.tvTitle.setText(page.getTitle());
            binding.tvDescription.setText(page.getDescription());

            // Set static illustration (replaces Lottie animation)
            if (page.getAnimationRes() != 0) {
                binding.lottieAnimation.setImageResource(page.getAnimationRes());
                binding.lottieAnimation.setAlpha(0f);
                binding.lottieAnimation.animate().alpha(1f).setDuration(350).start();
            }
        }
    }
}
