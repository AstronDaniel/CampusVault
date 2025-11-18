package com.example.campusvault.ui.main.profile;

import android.app.AlertDialog;
import android.content.Intent;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Toast;

import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.lifecycle.ViewModelProvider;

import com.bumptech.glide.Glide;
import com.example.campusvault.R;
import com.example.campusvault.data.local.SharedPreferencesManager;
import com.example.campusvault.databinding.FragmentProfileBinding;
import com.example.campusvault.ui.auth.AuthActivity;

public class ProfileFragment extends Fragment {
    private FragmentProfileBinding binding;
    private ProfileViewModel vm;

    private final ActivityResultLauncher<String> imagePicker = registerForActivityResult(
            new ActivityResultContracts.GetContent(),
            uri -> {
                if (uri != null) {
                    binding.ivAvatar.setImageURI(uri);
                    // TODO: Upload avatar to server
                    Toast.makeText(requireContext(), "Avatar upload coming soon", Toast.LENGTH_SHORT).show();
                }
            }
    );

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        binding = FragmentProfileBinding.inflate(inflater, container, false);
        return binding.getRoot();
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);

        SharedPreferencesManager spm = new SharedPreferencesManager(requireContext());
        vm = new ViewModelProvider(this, new ProfileViewModelFactory(spm)).get(ProfileViewModel.class);

        setupClickListeners();
        observeData();
        vm.loadProfile();
    }

    private void setupClickListeners() {
        binding.btnEditProfile.setOnClickListener(v -> showEditProfileDialog());
        binding.btnSettings.setOnClickListener(v -> Toast.makeText(requireContext(), "Settings coming soon", Toast.LENGTH_SHORT).show());
        binding.btnLogout.setOnClickListener(v -> showLogoutDialog());
        binding.ivAvatar.setOnClickListener(v -> imagePicker.launch("image/*"));
        binding.fabCamera.setOnClickListener(v -> imagePicker.launch("image/*"));
    }

    private void observeData() {
        vm.user.observe(getViewLifecycleOwner(), user -> {
            if (user != null) {
                binding.tvUsername.setText(user.getUsername());
                binding.tvEmail.setText(user.getEmail());
                
                if (user.getAvatarUrl() != null && !user.getAvatarUrl().isEmpty()) {
                    Glide.with(this)
                            .load(user.getAvatarUrl())
                            .placeholder(R.drawable.ic_person)
                            .circleCrop()
                            .into(binding.ivAvatar);
                }

                binding.badgeVerified.setVisibility(user.isVerified() ? View.VISIBLE : View.GONE);
            }
        });

        vm.stats.observe(getViewLifecycleOwner(), stats -> {
            if (stats != null) {
                animateCounter(binding.tvUploadCount, 0, stats.totalUploads);
                animateCounter(binding.tvDownloadCount, 0, stats.totalDownloads);
                animateCounter(binding.tvBookmarkCount, 0, stats.totalBookmarks);
                binding.tvRatingValue.setText(String.format("%.1f", stats.averageRating));
                animateCounter(binding.tvContributionScore, 0, stats.contributionScore);
            }
        });

        vm.loading.observe(getViewLifecycleOwner(), isLoading -> {
            binding.progressBar.setVisibility(isLoading ? View.VISIBLE : View.GONE);
        });
    }

    private void animateCounter(android.widget.TextView textView, int start, int end) {
        android.animation.ValueAnimator animator = android.animation.ValueAnimator.ofInt(start, end);
        animator.setDuration(1000);
        animator.addUpdateListener(animation -> textView.setText(String.valueOf(animation.getAnimatedValue())));
        animator.start();
    }

    private void showEditProfileDialog() {
        View dialogView = getLayoutInflater().inflate(R.layout.dialog_edit_profile, null);
        com.google.android.material.textfield.TextInputEditText etUsername = dialogView.findViewById(R.id.etUsername);
        com.google.android.material.textfield.TextInputEditText etEmail = dialogView.findViewById(R.id.etEmail);

        if (vm.user.getValue() != null) {
            etUsername.setText(vm.user.getValue().getUsername());
            etEmail.setText(vm.user.getValue().getEmail());
        }

        new AlertDialog.Builder(requireContext())
                .setTitle("Edit Profile")
                .setView(dialogView)
                .setPositiveButton("Save", (dialog, which) -> {
                    String username = etUsername.getText() != null ? etUsername.getText().toString() : "";
                    String email = etEmail.getText() != null ? etEmail.getText().toString() : "";
                    vm.updateProfile(username, email);
                    Toast.makeText(requireContext(), "Profile updated", Toast.LENGTH_SHORT).show();
                })
                .setNegativeButton("Cancel", null)
                .show();
    }

    private void showLogoutDialog() {
        new AlertDialog.Builder(requireContext())
                .setTitle("Logout")
                .setMessage("Are you sure you want to logout?")
                .setPositiveButton("Logout", (dialog, which) -> {
                    vm.logout();
                    Intent intent = new Intent(requireContext(), AuthActivity.class);
                    intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
                    startActivity(intent);
                    requireActivity().finish();
                })
                .setNegativeButton("Cancel", null)
                .show();
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        binding = null;
    }
}

