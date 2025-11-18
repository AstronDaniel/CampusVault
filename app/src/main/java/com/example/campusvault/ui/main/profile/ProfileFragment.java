package com.example.campusvault.ui.main.profile;

import android.app.AlertDialog;
import android.content.Intent;
import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Toast;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.lifecycle.ViewModelProvider;
import com.bumptech.glide.Glide;
import com.example.campusvault.R;
import com.example.campusvault.data.local.SharedPreferencesManager;
import com.example.campusvault.databinding.FragmentProfileBinding;
import com.example.campusvault.ui.auth.AuthActivity;
import com.google.android.material.tabs.TabLayoutMediator;

public class ProfileFragment extends Fragment {
    private FragmentProfileBinding binding;
    private ProfileViewModel vm;

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

        setupViewPager();
        setupClickListeners();
        observeData();
        vm.loadProfile();
    }

    private void setupViewPager() {
        ProfilePagerAdapter adapter = new ProfilePagerAdapter(this);
        binding.viewPager.setAdapter(adapter);

        new TabLayoutMediator(binding.tabLayout, binding.viewPager, (tab, position) -> {
            if (position == 0) {
                tab.setText("My Resources");
            }
        }).attach();
    }

    private void setupClickListeners() {
        binding.btnEditProfile.setOnClickListener(v -> showEditProfileDialog());
        binding.btnSettings.setOnClickListener(v -> {
            Intent intent = new Intent(requireContext(), com.example.campusvault.ui.main.settings.SettingsActivity.class);
            startActivity(intent);
        });
        binding.btnLogout.setOnClickListener(v -> showLogoutDialog());
    }

    private void observeData() {
        vm.user.observe(getViewLifecycleOwner(), user -> {
            if (user != null) {
                binding.tvProfileName.setText(user.getFirstName() + " " + user.getLastName());
                binding.tvProfileEmail.setText(user.getEmail());
                
                if (user.getAvatarUrl() != null && !user.getAvatarUrl().isEmpty()) {
                    Glide.with(this)
                            .load(user.getAvatarUrl())
                            .placeholder(R.drawable.ic_person)
                            .into(binding.ivProfileAvatar);
                }
            }
        });

        vm.stats.observe(getViewLifecycleOwner(), stats -> {
            if (stats != null) {
                binding.tvUploadsCount.setText(String.valueOf(stats.totalUploads));
                binding.tvDownloadsCount.setText(String.valueOf(stats.totalDownloads));
                binding.tvReputationCount.setText(String.valueOf(stats.contributionScore));
            }
        });
    }

    private void showEditProfileDialog() {
        View dialogView = getLayoutInflater().inflate(R.layout.dialog_edit_profile, null);
        com.google.android.material.textfield.TextInputEditText etFirstName = dialogView.findViewById(R.id.et_first_name);
        com.google.android.material.textfield.TextInputEditText etLastName = dialogView.findViewById(R.id.et_last_name);
        com.google.android.material.textfield.TextInputEditText etEmail = dialogView.findViewById(R.id.et_email);

        if (vm.user.getValue() != null) {
            etFirstName.setText(vm.user.getValue().getFirstName());
            etLastName.setText(vm.user.getValue().getLastName());
            etEmail.setText(vm.user.getValue().getEmail());
        }

        new AlertDialog.Builder(requireContext())
                .setTitle("Edit Profile")
                .setView(dialogView)
                .setPositiveButton("Save", (dialog, which) -> {
                    String firstName = etFirstName.getText() != null ? etFirstName.getText().toString() : "";
                    String lastName = etLastName.getText() != null ? etLastName.getText().toString() : "";
                    String email = etEmail.getText() != null ? etEmail.getText().toString() : "";
                    vm.updateProfile(firstName, lastName, email);
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

