package com.example.campusvault.ui.main.upload;

import android.app.Activity;
import android.content.Intent;
import android.database.Cursor;
import android.net.Uri;
import android.os.Bundle;
import android.provider.OpenableColumns;
import android.transition.AutoTransition;
import android.transition.TransitionManager;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ArrayAdapter;
import android.widget.Toast;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import androidx.lifecycle.ViewModelProvider;
import com.example.campusvault.data.local.SharedPreferencesManager;
import com.example.campusvault.data.models.CourseUnit;
import com.example.campusvault.databinding.FragmentUploadBinding;
import java.util.ArrayList;
import java.util.List;

public class UploadFragment extends Fragment {
    private FragmentUploadBinding binding;
    private UploadViewModel vm;
    private Uri pickedFileUri;
    private Integer selectedCourseUnitId;
    private ArrayAdapter<CourseUnit> courseUnitAdapter;

    private final ActivityResultLauncher<Intent> filePickerLauncher = registerForActivityResult(
            new ActivityResultContracts.StartActivityForResult(),
            result -> {
                if (result.getResultCode() == Activity.RESULT_OK && result.getData() != null) {
                    handleFileUri(result.getData().getData());
                }
            });

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        binding = FragmentUploadBinding.inflate(inflater, container, false);
        return binding.getRoot();
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);
        SharedPreferencesManager spm = new SharedPreferencesManager(requireContext());
        vm = new ViewModelProvider(this, new UploadViewModelFactory(requireActivity().getApplication(), spm)).get(UploadViewModel.class);

        setupViews();
        setupObservers();
        vm.loadCourseUnits(spm.getUserProgramId(), 1, 1); // Load initial course units (should be dynamic in real app)
    }

    private void setupViews() {
        binding.cardFileSelection.setOnClickListener(v -> openFilePicker());
        
        binding.btnRemoveFile.setOnClickListener(v -> {
            TransitionManager.beginDelayedTransition((ViewGroup) binding.getRoot(), new AutoTransition());
            pickedFileUri = null;
            binding.cardFilePreview.setVisibility(View.GONE);
            binding.cardFileSelection.setVisibility(View.VISIBLE);
        });

        binding.btnUpload.setOnClickListener(v -> doUpload());

        courseUnitAdapter = new ArrayAdapter<>(requireContext(), android.R.layout.simple_dropdown_item_1line, new ArrayList<>());
        binding.actvCourseUnit.setAdapter(courseUnitAdapter);
        binding.actvCourseUnit.setOnItemClickListener((parent, view, position, id) -> {
            CourseUnit item = courseUnitAdapter.getItem(position);
            if (item != null) {
                selectedCourseUnitId = item.getId();
            }
        });
    }

    private void setupObservers() {
        vm.courseUnits.observe(getViewLifecycleOwner(), list -> {
            courseUnitAdapter.clear();
            if (list != null) {
                courseUnitAdapter.addAll(list);
            }
        });

        vm.uploadProgress.observe(getViewLifecycleOwner(), progress -> {
            binding.progressCard.setVisibility(View.VISIBLE);
            binding.progressBar.setProgress(progress);
            binding.tvProgressPercentage.setText(String.format("%d%%", progress));
            binding.btnUpload.setEnabled(false);
        });

        vm.uploadSpeed.observe(getViewLifecycleOwner(), speed -> 
            binding.tvUploadSpeed.setText(String.format("%.2f KB/s", speed)));

        vm.uploaded.observe(getViewLifecycleOwner(), resource -> {
            binding.btnUpload.setEnabled(true);
            if (resource != null) {
                binding.progressCard.setVisibility(View.GONE);
                binding.lottieSuccess.setVisibility(View.VISIBLE);
                binding.lottieSuccess.playAnimation();
                Toast.makeText(getContext(), "Upload successful!", Toast.LENGTH_SHORT).show();
                // Reset form after delay?
            } else {
                binding.progressCard.setVisibility(View.GONE);
                Toast.makeText(getContext(), "Upload failed.", Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void openFilePicker() {
        Intent intent = new Intent(Intent.ACTION_GET_CONTENT);
        intent.setType("*/*");
        String[] mimeTypes = {"application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation"};
        intent.putExtra(Intent.EXTRA_MIME_TYPES, mimeTypes);
        filePickerLauncher.launch(intent);
    }

    private void handleFileUri(Uri uri) {
        if (uri != null) {
            pickedFileUri = uri;
            
            // Get file metadata
            String fileName = "Unknown file";
            String fileSize = "";
            
            try (Cursor cursor = requireContext().getContentResolver().query(uri, null, null, null, null)) {
                if (cursor != null && cursor.moveToFirst()) {
                    int nameIndex = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME);
                    int sizeIndex = cursor.getColumnIndex(OpenableColumns.SIZE);
                    
                    if (nameIndex != -1) fileName = cursor.getString(nameIndex);
                    if (sizeIndex != -1) {
                        long size = cursor.getLong(sizeIndex);
                        fileSize = String.format("%.2f MB", size / (1024.0 * 1024.0));
                    }
                }
            } catch (Exception e) {
                e.printStackTrace();
            }

            binding.tvFileName.setText(fileName);
            binding.tvFileSize.setText(fileSize);

            TransitionManager.beginDelayedTransition((ViewGroup) binding.getRoot(), new AutoTransition());
            binding.cardFileSelection.setVisibility(View.GONE);
            binding.cardFilePreview.setVisibility(View.VISIBLE);
        }
    }

    private void doUpload() {
        if (pickedFileUri == null) {
            Toast.makeText(getContext(), "Please select a file.", Toast.LENGTH_SHORT).show();
            return;
        }
        if (binding.etTitle.getText() == null || binding.etTitle.getText().toString().trim().isEmpty()) {
            binding.tilTitle.setError("Title is required");
            return;
        }
        if (selectedCourseUnitId == null) {
            binding.tilCourseUnit.setError("Please select a course unit");
            return;
        }

        binding.tilTitle.setError(null);
        binding.tilCourseUnit.setError(null);

        vm.uploadFile(pickedFileUri, binding.etTitle.getText().toString(), binding.etDescription.getText().toString(), selectedCourseUnitId);
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        binding = null;
    }
}
