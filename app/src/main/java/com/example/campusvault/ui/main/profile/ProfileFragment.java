package com.example.campusvault.ui.main.profile;

import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Bundle;
import android.provider.MediaStore;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Toast;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AlertDialog;
import androidx.core.content.ContextCompat;
import androidx.fragment.app.Fragment;
import androidx.lifecycle.ViewModelProvider;
import com.bumptech.glide.Glide;
import com.example.campusvault.R;
import com.example.campusvault.data.local.SharedPreferencesManager;
import com.example.campusvault.databinding.FragmentProfileBinding;
import com.example.campusvault.ui.auth.AuthActivity;
import com.google.android.material.dialog.MaterialAlertDialogBuilder;
import com.google.android.material.textfield.TextInputEditText;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;

public class ProfileFragment extends Fragment {
    private FragmentProfileBinding binding;
    private ProfileViewModel vm;
    
    private ActivityResultLauncher<Intent> imagePickerLauncher;
    private ActivityResultLauncher<String> permissionLauncher;

    @Override
    public void onCreate(@Nullable Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Image picker launcher
        imagePickerLauncher = registerForActivityResult(
            new ActivityResultContracts.StartActivityForResult(),
            result -> {
                if (result.getResultCode() == Activity.RESULT_OK && result.getData() != null) {
                    Uri imageUri = result.getData().getData();
                    if (imageUri != null) {
                        handleImageSelected(imageUri);
                    }
                }
            }
        );
        
        // Permission launcher
        permissionLauncher = registerForActivityResult(
            new ActivityResultContracts.RequestPermission(),
            isGranted -> {
                if (isGranted) {
                    openImagePicker();
                } else {
                    Toast.makeText(requireContext(), "Permission required to select image", Toast.LENGTH_SHORT).show();
                }
            }
        );
    }

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
        // Avatar change
        binding.btnChangeAvatar.setOnClickListener(v -> checkPermissionAndPickImage());
        
        // Menu items
        binding.menuEditProfile.setOnClickListener(v -> showEditProfileDialog());
        binding.menuChangePassword.setOnClickListener(v -> showChangePasswordDialog());
        binding.menuMyResources.setOnClickListener(v -> navigateToMyResources());
        binding.menuSettings.setOnClickListener(v -> navigateToSettings());
        binding.menuAbout.setOnClickListener(v -> showAboutDialog());
        
        // Logout
        binding.btnLogout.setOnClickListener(v -> showLogoutDialog());
    }

    private void observeData() {
        vm.user.observe(getViewLifecycleOwner(), user -> {
            if (user != null) {
                // Name
                String fullName = "";
                if (user.getFirstName() != null) fullName += user.getFirstName();
                if (user.getLastName() != null) fullName += " " + user.getLastName();
                binding.tvProfileName.setText(fullName.trim().isEmpty() ? "User" : fullName.trim());
                
                // Email
                binding.tvProfileEmail.setText(user.getEmail() != null ? user.getEmail() : "");
                
                // Username
                String username = user.getUsername();
                if (username != null && !username.isEmpty()) {
                    binding.tvUsername.setText("@" + username);
                    binding.tvUsername.setVisibility(View.VISIBLE);
                } else {
                    binding.tvUsername.setVisibility(View.GONE);
                }
                
                // Verification badge
                binding.ivVerifiedBadge.setVisibility(user.isVerified() ? View.VISIBLE : View.GONE);
                
                // Avatar
                if (user.getAvatarUrl() != null && !user.getAvatarUrl().isEmpty()) {
                    Glide.with(this)
                            .load(user.getAvatarUrl())
                            .placeholder(R.drawable.ic_person)
                            .error(R.drawable.ic_person)
                            .into(binding.ivProfileAvatar);
                }
            }
        });

        vm.stats.observe(getViewLifecycleOwner(), stats -> {
            if (stats != null) {
                binding.tvUploadsCount.setText(String.valueOf(stats.totalUploads));
                binding.tvDownloadsCount.setText(String.valueOf(stats.totalDownloads));
                binding.tvReputationCount.setText(String.valueOf(stats.contributionScore));
                binding.tvBookmarksCount.setText(String.valueOf(stats.totalBookmarks));
            }
        });
        
        vm.isLoading.observe(getViewLifecycleOwner(), isLoading -> {
            binding.loadingOverlay.setVisibility(isLoading ? View.VISIBLE : View.GONE);
        });
        
        vm.error.observe(getViewLifecycleOwner(), error -> {
            if (error != null && !error.isEmpty()) {
                Toast.makeText(requireContext(), error, Toast.LENGTH_LONG).show();
                vm.clearError();
            }
        });
        
        vm.successMessage.observe(getViewLifecycleOwner(), message -> {
            if (message != null && !message.isEmpty()) {
                Toast.makeText(requireContext(), message, Toast.LENGTH_SHORT).show();
                vm.clearSuccessMessage();
            }
        });
    }
    
    private void checkPermissionAndPickImage() {
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.TIRAMISU) {
            if (ContextCompat.checkSelfPermission(requireContext(), Manifest.permission.READ_MEDIA_IMAGES) 
                    == PackageManager.PERMISSION_GRANTED) {
                openImagePicker();
            } else {
                permissionLauncher.launch(Manifest.permission.READ_MEDIA_IMAGES);
            }
        } else {
            if (ContextCompat.checkSelfPermission(requireContext(), Manifest.permission.READ_EXTERNAL_STORAGE) 
                    == PackageManager.PERMISSION_GRANTED) {
                openImagePicker();
            } else {
                permissionLauncher.launch(Manifest.permission.READ_EXTERNAL_STORAGE);
            }
        }
    }
    
    private void openImagePicker() {
        Intent intent = new Intent(Intent.ACTION_PICK, MediaStore.Images.Media.EXTERNAL_CONTENT_URI);
        intent.setType("image/*");
        imagePickerLauncher.launch(intent);
    }
    
    private void handleImageSelected(Uri imageUri) {
        try {
            InputStream inputStream = requireContext().getContentResolver().openInputStream(imageUri);
            File tempFile = new File(requireContext().getCacheDir(), "avatar_temp.jpg");
            FileOutputStream outputStream = new FileOutputStream(tempFile);
            
            byte[] buffer = new byte[1024];
            int length;
            while ((length = inputStream.read(buffer)) > 0) {
                outputStream.write(buffer, 0, length);
            }
            
            outputStream.close();
            inputStream.close();
            
            // Upload the file
            vm.uploadAvatar(tempFile);
            
            // Show preview immediately
            Glide.with(this)
                    .load(imageUri)
                    .into(binding.ivProfileAvatar);
                    
        } catch (Exception e) {
            Toast.makeText(requireContext(), "Failed to process image", Toast.LENGTH_SHORT).show();
        }
    }

    private void showEditProfileDialog() {
        View dialogView = getLayoutInflater().inflate(R.layout.dialog_edit_profile, null);
        TextInputEditText etFirstName = dialogView.findViewById(R.id.et_first_name);
        TextInputEditText etLastName = dialogView.findViewById(R.id.et_last_name);
        TextInputEditText etUsername = dialogView.findViewById(R.id.et_username);
        TextInputEditText etEmail = dialogView.findViewById(R.id.et_email);

        if (vm.user.getValue() != null) {
            etFirstName.setText(vm.user.getValue().getFirstName());
            etLastName.setText(vm.user.getValue().getLastName());
            etUsername.setText(vm.user.getValue().getUsername());
            etEmail.setText(vm.user.getValue().getEmail());
        }

        AlertDialog dialog = new MaterialAlertDialogBuilder(requireContext(), R.style.ThemeOverlay_App_MaterialAlertDialog)
                .setView(dialogView)
                .create();
        
        dialogView.findViewById(R.id.btn_cancel).setOnClickListener(v -> dialog.dismiss());
        dialogView.findViewById(R.id.btn_save).setOnClickListener(v -> {
            String firstName = etFirstName.getText() != null ? etFirstName.getText().toString().trim() : "";
            String lastName = etLastName.getText() != null ? etLastName.getText().toString().trim() : "";
            String username = etUsername.getText() != null ? etUsername.getText().toString().trim() : "";
            String email = etEmail.getText() != null ? etEmail.getText().toString().trim() : "";
            
            if (email.isEmpty()) {
                Toast.makeText(requireContext(), "Email is required", Toast.LENGTH_SHORT).show();
                return;
            }
            
            vm.updateProfile(firstName, lastName, username, email);
            dialog.dismiss();
        });
        
        dialog.show();
    }
    
    private void showChangePasswordDialog() {
        View dialogView = getLayoutInflater().inflate(R.layout.dialog_change_password, null);
        TextInputEditText etCurrentPassword = dialogView.findViewById(R.id.et_current_password);
        TextInputEditText etNewPassword = dialogView.findViewById(R.id.et_new_password);
        TextInputEditText etConfirmPassword = dialogView.findViewById(R.id.et_confirm_password);

        AlertDialog dialog = new MaterialAlertDialogBuilder(requireContext(), R.style.ThemeOverlay_App_MaterialAlertDialog)
                .setView(dialogView)
                .create();
        
        dialogView.findViewById(R.id.btn_cancel).setOnClickListener(v -> dialog.dismiss());
        dialogView.findViewById(R.id.btn_change).setOnClickListener(v -> {
            String currentPassword = etCurrentPassword.getText() != null ? etCurrentPassword.getText().toString() : "";
            String newPassword = etNewPassword.getText() != null ? etNewPassword.getText().toString() : "";
            String confirmPassword = etConfirmPassword.getText() != null ? etConfirmPassword.getText().toString() : "";
            
            if (currentPassword.isEmpty()) {
                Toast.makeText(requireContext(), "Please enter your current password", Toast.LENGTH_SHORT).show();
                return;
            }
            
            if (newPassword.length() < 8) {
                Toast.makeText(requireContext(), "New password must be at least 8 characters", Toast.LENGTH_SHORT).show();
                return;
            }
            
            if (!newPassword.equals(confirmPassword)) {
                Toast.makeText(requireContext(), "Passwords do not match", Toast.LENGTH_SHORT).show();
                return;
            }
            
            vm.changePassword(currentPassword, newPassword);
            dialog.dismiss();
        });
        
        dialog.show();
    }
    
    private void navigateToMyResources() {
        Intent intent = new Intent(requireContext(), com.example.campusvault.ui.main.profile.resources.MyResourcesActivity.class);
        startActivity(intent);
    }
    
    private void navigateToSettings() {
        Intent intent = new Intent(requireContext(), com.example.campusvault.ui.main.settings.SettingsActivity.class);
        startActivity(intent);
    }
    
    private void showAboutDialog() {
        new MaterialAlertDialogBuilder(requireContext())
                .setTitle("About CampusVault")
                .setMessage("CampusVault v1.0.0\n\nA platform for sharing academic resources.\n\n© 2024 CampusVault")
                .setPositiveButton("OK", null)
                .show();
    }

    private void showLogoutDialog() {
        new MaterialAlertDialogBuilder(requireContext())
                .setTitle("Sign Out")
                .setMessage("Are you sure you want to sign out?")
                .setPositiveButton("Sign Out", (dialog, which) -> {
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

