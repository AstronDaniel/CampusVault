package com.example.campusvault.ui.main.upload;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.view.DragEvent;
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
import com.bumptech.glide.Glide;
import com.example.campusvault.data.local.SharedPreferencesManager;
import com.example.campusvault.data.models.CourseUnit;
import com.example.campusvault.databinding.FragmentUploadBinding;
import java.util.List;

public class UploadFragment extends Fragment {
    private FragmentUploadBinding binding;
    private UploadViewModel vm;
    private Uri pickedFileUri;
    private Integer selectedCourseUnitId;

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
        vm.loadCourseUnits(spm.getUserProgramId(), 1, 1); // Load initial course units
    }

    private void setupViews() {
        binding.dropZone.setOnClickListener(v -> openFilePicker());
        binding.dropZone.setOnDragListener((v, event) -> {
            if (event.getAction() == DragEvent.ACTION_DROP) {
                handleFileUri(event.getClipData().getItemAt(0).getUri());
            }
            return true;
        });

        binding.btnUpload.setOnClickListener(v -> doUpload());
    }

    private void setupObservers() {
        vm.courseUnits.observe(getViewLifecycleOwner(), this::bindCourseUnits);
        vm.uploadProgress.observe(getViewLifecycleOwner(), progress -> {
            binding.progressCard.setVisibility(View.VISIBLE);
            binding.progressBar.setProgress(progress);
            binding.tvProgressPercentage.setText(String.format("%d%%", progress));
        });
        vm.uploadSpeed.observe(getViewLifecycleOwner(), speed -> binding.tvUploadSpeed.setText(String.format("%.2f KB/s", speed)));
        vm.uploaded.observe(getViewLifecycleOwner(), resource -> {
            if (resource != null) {
                binding.progressCard.setVisibility(View.GONE);
                binding.lottieSuccess.setVisibility(View.VISIBLE);
                binding.lottieSuccess.playAnimation();
                Toast.makeText(getContext(), "Upload successful!", Toast.LENGTH_SHORT).show();
            } else {
                Toast.makeText(getContext(), "Upload failed.", Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void openFilePicker() {
        Intent intent = new Intent(Intent.ACTION_GET_CONTENT);
        intent.setType("*/*");
        filePickerLauncher.launch(intent);
    }

    private void handleFileUri(Uri uri) {
        if (uri != null) {
            pickedFileUri = uri;
            binding.ivFilePreview.setVisibility(View.VISIBLE);
            Glide.with(this).load(uri).into(binding.ivFilePreview);
        }
    }

    private void bindCourseUnits(List<CourseUnit> list) {
        ArrayAdapter<CourseUnit> adapter = new ArrayAdapter<>(requireContext(), android.R.layout.simple_spinner_item, list);
        adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        binding.spCourseUnit.setAdapter(adapter);
        binding.spCourseUnit.setOnItemSelectedListener(new android.widget.AdapterView.OnItemSelectedListener() {
            @Override
            public void onItemSelected(android.widget.AdapterView<?> parent, View view, int position, long id) {
                selectedCourseUnitId = ((CourseUnit) parent.getItemAtPosition(position)).getId();
            }

            @Override
            public void onNothingSelected(android.widget.AdapterView<?> parent) {
                selectedCourseUnitId = null;
            }
        });
    }

    private void doUpload() {
        if (pickedFileUri == null || binding.etTitle.getText() == null || selectedCourseUnitId == null) {
            Toast.makeText(getContext(), "Please select a file, enter a title, and choose a course unit.", Toast.LENGTH_SHORT).show();
            return;
        }
        vm.uploadFile(pickedFileUri, binding.etTitle.getText().toString(), binding.etDescription.getText().toString(), selectedCourseUnitId);
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        binding = null;
    }
}
