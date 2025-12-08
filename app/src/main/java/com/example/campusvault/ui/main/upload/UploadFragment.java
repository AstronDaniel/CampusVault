package com.example.campusvault.ui.main.upload;

import android.app.Activity;
import android.content.Intent;
import android.database.Cursor;
import android.net.Uri;
import android.os.Bundle;
import android.provider.OpenableColumns;
import android.text.Editable;
import android.text.TextWatcher;
import android.transition.AutoTransition;
import android.transition.TransitionManager;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ArrayAdapter;
import android.widget.Filter;
import android.widget.Filterable;
import android.widget.Toast;
import androidx.activity.result.ActivityResultLauncher;
import androidx.activity.result.contract.ActivityResultContracts;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.appcompat.app.AlertDialog;
import androidx.fragment.app.Fragment;
import androidx.lifecycle.ViewModelProvider;
import com.example.campusvault.R;
import com.example.campusvault.data.local.SharedPreferencesManager;
import com.example.campusvault.data.models.CourseUnit;
import com.example.campusvault.data.models.DuplicateResourceInfo;
import com.example.campusvault.databinding.FragmentUploadBinding;
import com.google.android.material.dialog.MaterialAlertDialogBuilder;
import java.util.ArrayList;
import java.util.List;

public class UploadFragment extends Fragment {
    private FragmentUploadBinding binding;
    private UploadViewModel vm;
    private Uri pickedFileUri;
    private long pickedFileSize;
    private Integer selectedCourseUnitId;
    private String selectedResourceType = "notes"; // Default
    private CourseUnitFilterAdapter courseUnitAdapter;
    private ArrayAdapter<String> resourceTypeAdapter;
    private List<CourseUnit> allCourseUnits = new ArrayList<>();

    // Resource types matching backend
    private static final String[] RESOURCE_TYPES = {"notes", "past_paper", "assignment", "slides", "book", "other"};
    private static final String[] RESOURCE_TYPE_LABELS = {"Notes", "Past Paper", "Assignment", "Slides", "Book", "Other"};

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
        // Load all course units (null params to get all)
        vm.loadCourseUnits(spm.getUserProgramId(), null, null);
    }

    private void setupViews() {
        // File selection
        binding.cardFileSelection.setOnClickListener(v -> openFilePicker());
        
        binding.btnRemoveFile.setOnClickListener(v -> {
            TransitionManager.beginDelayedTransition((ViewGroup) binding.getRoot(), new AutoTransition());
            pickedFileUri = null;
            pickedFileSize = 0;
            binding.cardFilePreview.setVisibility(View.GONE);
            binding.cardFileSelection.setVisibility(View.VISIBLE);
        });

        binding.btnUpload.setOnClickListener(v -> doUpload());
        
        // Cancel upload button
        binding.btnCancelUpload.setOnClickListener(v -> {
            vm.cancelUpload();
        });

        // Resource type dropdown
        resourceTypeAdapter = new ArrayAdapter<>(requireContext(), android.R.layout.simple_dropdown_item_1line, RESOURCE_TYPE_LABELS);
        binding.actvResourceType.setAdapter(resourceTypeAdapter);
        binding.actvResourceType.setText(RESOURCE_TYPE_LABELS[0], false); // Default to "Notes"
        binding.actvResourceType.setOnItemClickListener((parent, view, position, id) -> {
            selectedResourceType = RESOURCE_TYPES[position];
        });

        // Course unit with search/filter
        courseUnitAdapter = new CourseUnitFilterAdapter(requireContext(), new ArrayList<>());
        binding.actvCourseUnit.setAdapter(courseUnitAdapter);
        binding.actvCourseUnit.setThreshold(1); // Start filtering after 1 char
        binding.actvCourseUnit.setOnItemClickListener((parent, view, position, id) -> {
            CourseUnit item = courseUnitAdapter.getItem(position);
            if (item != null) {
                selectedCourseUnitId = item.getId();
                binding.actvCourseUnit.setText(item.toString(), false);
            }
        });
        
        // Clear selection when text changes (user is searching)
        binding.actvCourseUnit.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {}
            
            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {
                // If user is typing (not selecting from dropdown), clear selection
                if (before != count) {
                    // Check if the text matches a selected course unit
                    boolean matchesSelection = false;
                    for (CourseUnit cu : allCourseUnits) {
                        if (cu.toString().equals(s.toString())) {
                            matchesSelection = true;
                            break;
                        }
                    }
                    if (!matchesSelection) {
                        selectedCourseUnitId = null;
                    }
                }
            }
            
            @Override
            public void afterTextChanged(Editable s) {}
        });
    }

    private void setupObservers() {
        vm.courseUnits.observe(getViewLifecycleOwner(), list -> {
            if (list != null) {
                allCourseUnits = new ArrayList<>(list);
                courseUnitAdapter.updateData(list);
            }
        });

        vm.uploadProgress.observe(getViewLifecycleOwner(), progress -> {
            if (progress != null) {
                binding.progressBar.setProgress(progress);
                binding.tvProgressPercentage.setText(String.format("%d%%", progress));
            }
        });

        vm.uploadSpeed.observe(getViewLifecycleOwner(), speed -> {
            if (speed != null) {
                if (speed > 1024) {
                    binding.tvUploadSpeed.setText(String.format("%.1f MB/s", speed / 1024));
                } else {
                    binding.tvUploadSpeed.setText(String.format("%.1f KB/s", speed));
                }
            }
        });

        vm.etaSeconds.observe(getViewLifecycleOwner(), eta -> {
            if (eta != null && eta > 0) {
                binding.tvEta.setText(UploadViewModel.formatEta(eta));
            } else {
                binding.tvEta.setText("");
            }
        });

        vm.uploadState.observe(getViewLifecycleOwner(), state -> {
            if (state == null) return;
            
            switch (state) {
                case IDLE:
                    binding.progressCard.setVisibility(View.GONE);
                    binding.lottieSuccess.setVisibility(View.GONE);
                    binding.btnUpload.setEnabled(true);
                    break;
                    
                case UPLOADING:
                    binding.progressCard.setVisibility(View.VISIBLE);
                    binding.tvUploadStatus.setText("Uploading...");
                    binding.lottieSuccess.setVisibility(View.GONE);
                    binding.btnUpload.setEnabled(false);
                    break;
                    
                case SUCCESS:
                    binding.progressCard.setVisibility(View.GONE);
                    binding.lottieSuccess.setVisibility(View.VISIBLE);
                    binding.lottieSuccess.playAnimation();
                    binding.btnUpload.setEnabled(true);
                    Toast.makeText(getContext(), "Upload successful!", Toast.LENGTH_SHORT).show();
                    // Reset form after a delay
                    binding.getRoot().postDelayed(this::resetForm, 2000);
                    break;
                    
                case ERROR:
                    binding.progressCard.setVisibility(View.GONE);
                    binding.btnUpload.setEnabled(true);
                    String errorMsg = vm.errorMessage.getValue();
                    Toast.makeText(getContext(), errorMsg != null ? errorMsg : "Upload failed", Toast.LENGTH_LONG).show();
                    break;
                    
                case CANCELLED:
                    binding.progressCard.setVisibility(View.GONE);
                    binding.btnUpload.setEnabled(true);
                    Toast.makeText(getContext(), "Upload cancelled", Toast.LENGTH_SHORT).show();
                    break;
                    
                case DUPLICATE_FOUND:
                    binding.progressCard.setVisibility(View.GONE);
                    binding.btnUpload.setEnabled(true);
                    showDuplicateDialog();
                    break;
            }
        });

        vm.fileValidationError.observe(getViewLifecycleOwner(), error -> {
            if (error != null && !error.isEmpty()) {
                new MaterialAlertDialogBuilder(requireContext())
                    .setTitle("File Too Large")
                    .setMessage(error)
                    .setIcon(R.drawable.ic_warning)
                    .setPositiveButton("OK", null)
                    .show();
                // Clear the picked file
                pickedFileUri = null;
                pickedFileSize = 0;
                binding.cardFilePreview.setVisibility(View.GONE);
                binding.cardFileSelection.setVisibility(View.VISIBLE);
            }
        });
    }

    private void showDuplicateDialog() {
        DuplicateResourceInfo existing = vm.duplicateFound.getValue();
        
        String message = "This file already exists in the system.";
        if (existing != null) {
            message = String.format(
                "This file already exists:\n\n" +
                "Title: %s\n" +
                "Uploaded: %s\n\n" +
                "Would you like to link it to your selected course unit instead?",
                existing.getTitle() != null ? existing.getTitle() : existing.getFilename(),
                existing.getCreatedAt() != null ? existing.getCreatedAt().substring(0, 10) : "Unknown"
            );
        }

        new MaterialAlertDialogBuilder(requireContext())
            .setTitle("Duplicate File Detected")
            .setMessage(message)
            .setIcon(R.drawable.ic_file_document)
            .setPositiveButton("Link Existing", (dialog, which) -> {
                if (existing != null && selectedCourseUnitId != null) {
                    String title = binding.etTitle.getText() != null ? binding.etTitle.getText().toString() : null;
                    String desc = binding.etDescription.getText() != null ? binding.etDescription.getText().toString() : null;
                    vm.linkExistingResource(existing.getId(), selectedCourseUnitId, title, desc);
                }
            })
            .setNegativeButton("Cancel", (dialog, which) -> {
                vm.resetUploadState();
            })
            .show();
    }

    private void resetForm() {
        pickedFileUri = null;
        pickedFileSize = 0;
        selectedCourseUnitId = null;
        selectedResourceType = "notes";
        
        TransitionManager.beginDelayedTransition((ViewGroup) binding.getRoot(), new AutoTransition());
        binding.cardFilePreview.setVisibility(View.GONE);
        binding.cardFileSelection.setVisibility(View.VISIBLE);
        binding.lottieSuccess.setVisibility(View.GONE);
        
        binding.etTitle.setText("");
        binding.etDescription.setText("");
        binding.actvCourseUnit.setText("");
        binding.actvResourceType.setText(RESOURCE_TYPE_LABELS[0], false);
        
        vm.resetUploadState();
    }

    private void openFilePicker() {
        Intent intent = new Intent(Intent.ACTION_GET_CONTENT);
        intent.setType("*/*");
        String[] mimeTypes = {
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            "application/vnd.ms-powerpoint",
            "application/vnd.openxmlformats-officedocument.presentationml.presentation",
            "application/vnd.ms-excel",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "image/*"
        };
        intent.putExtra(Intent.EXTRA_MIME_TYPES, mimeTypes);
        filePickerLauncher.launch(intent);
    }

    private void handleFileUri(Uri uri) {
        if (uri != null) {
            String fileName = "Unknown file";
            long size = 0;
            
            try (Cursor cursor = requireContext().getContentResolver().query(uri, null, null, null, null)) {
                if (cursor != null && cursor.moveToFirst()) {
                    int nameIndex = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME);
                    int sizeIndex = cursor.getColumnIndex(OpenableColumns.SIZE);
                    
                    if (nameIndex != -1) fileName = cursor.getString(nameIndex);
                    if (sizeIndex != -1) size = cursor.getLong(sizeIndex);
                }
            } catch (Exception e) {
                e.printStackTrace();
            }

            // Validate file size before accepting
            if (!vm.validateFile(size)) {
                return; // Error will be shown via observer
            }

            pickedFileUri = uri;
            pickedFileSize = size;

            binding.tvFileName.setText(fileName);
            binding.tvFileSize.setText(formatFileSize(size));
            
            // Auto-fill title from filename (without extension)
            if (binding.etTitle.getText() == null || binding.etTitle.getText().toString().trim().isEmpty()) {
                String titleFromFile = fileName;
                int dotIndex = fileName.lastIndexOf('.');
                if (dotIndex > 0) {
                    titleFromFile = fileName.substring(0, dotIndex);
                }
                binding.etTitle.setText(titleFromFile);
            }

            TransitionManager.beginDelayedTransition((ViewGroup) binding.getRoot(), new AutoTransition());
            binding.cardFileSelection.setVisibility(View.GONE);
            binding.cardFilePreview.setVisibility(View.VISIBLE);
        }
    }

    private String formatFileSize(long bytes) {
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return String.format("%.1f KB", bytes / 1024.0);
        return String.format("%.2f MB", bytes / (1024.0 * 1024.0));
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

        String title = binding.etTitle.getText().toString().trim();
        String description = binding.etDescription.getText() != null ? binding.etDescription.getText().toString().trim() : "";

        vm.uploadFile(pickedFileUri, title, description, selectedCourseUnitId, selectedResourceType);
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        binding = null;
    }

    /**
     * Custom adapter that filters CourseUnits by code or name
     */
    private static class CourseUnitFilterAdapter extends ArrayAdapter<CourseUnit> implements Filterable {
        private List<CourseUnit> allItems;
        private List<CourseUnit> filteredItems;

        public CourseUnitFilterAdapter(@NonNull android.content.Context context, @NonNull List<CourseUnit> items) {
            super(context, android.R.layout.simple_dropdown_item_1line, items);
            this.allItems = new ArrayList<>(items);
            this.filteredItems = new ArrayList<>(items);
        }

        public void updateData(List<CourseUnit> newItems) {
            this.allItems = new ArrayList<>(newItems);
            this.filteredItems = new ArrayList<>(newItems);
            notifyDataSetChanged();
        }

        @Override
        public int getCount() {
            return filteredItems.size();
        }

        @Nullable
        @Override
        public CourseUnit getItem(int position) {
            return filteredItems.get(position);
        }

        @NonNull
        @Override
        public Filter getFilter() {
            return new Filter() {
                @Override
                protected FilterResults performFiltering(CharSequence constraint) {
                    FilterResults results = new FilterResults();
                    
                    if (constraint == null || constraint.length() == 0) {
                        results.values = new ArrayList<>(allItems);
                        results.count = allItems.size();
                    } else {
                        String filterPattern = constraint.toString().toLowerCase().trim();
                        List<CourseUnit> filtered = new ArrayList<>();
                        
                        for (CourseUnit item : allItems) {
                            // Match by code or name
                            String code = item.getCode() != null ? item.getCode().toLowerCase() : "";
                            String name = item.getName() != null ? item.getName().toLowerCase() : "";
                            
                            if (code.contains(filterPattern) || name.contains(filterPattern)) {
                                filtered.add(item);
                            }
                        }
                        
                        results.values = filtered;
                        results.count = filtered.size();
                    }
                    
                    return results;
                }

                @SuppressWarnings("unchecked")
                @Override
                protected void publishResults(CharSequence constraint, FilterResults results) {
                    filteredItems = (List<CourseUnit>) results.values;
                    notifyDataSetChanged();
                }
                
                @Override
                public CharSequence convertResultToString(Object resultValue) {
                    return ((CourseUnit) resultValue).toString();
                }
            };
        }
    }
}
