package com.example.campusvault.ui.main.upload;

import android.content.ContentResolver;
import android.content.Intent;
import android.database.Cursor;
import android.net.Uri;
import android.os.Bundle;
import android.provider.OpenableColumns;
import android.text.TextUtils;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.MimeTypeMap;
import android.widget.ArrayAdapter;
import android.widget.Spinner;
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

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.List;

import okhttp3.MediaType;
import okhttp3.MultipartBody;
import okhttp3.RequestBody;

public class UploadFragment extends Fragment {
    private FragmentUploadBinding binding;
    private UploadViewModel vm;
    private Uri pickedFileUri;
    private Integer selectedCourseUnitId;

    private final ActivityResultLauncher<String> filePicker = registerForActivityResult(
            new ActivityResultContracts.GetContent(),
            uri -> {
                if (uri != null) {
                    pickedFileUri = uri;
                    binding.tvFileName.setText(getFileName(uri));
                }
            }
    );

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
        vm = new ViewModelProvider(this, new UploadViewModelFactory(spm)).get(UploadViewModel.class);

        // Load course units for default year/semester
        binding.chipYears.setOnCheckedStateChangeListener((group, checkedIds) -> reloadCourseUnits(spm));
        binding.chipSemesters.setOnCheckedStateChangeListener((group, checkedIds) -> reloadCourseUnits(spm));
        reloadCourseUnits(spm);

        binding.btnPickFile.setOnClickListener(v -> filePicker.launch("application/*"));
        binding.btnUpload.setOnClickListener(v -> doUpload());

        vm.courseUnits.observe(getViewLifecycleOwner(), this::bindCourseUnits);
        vm.uploaded.observe(getViewLifecycleOwner(), res -> {
            binding.progress.setVisibility(View.GONE);
            if (res != null) {
                Toast.makeText(requireContext(), "Uploaded!", Toast.LENGTH_SHORT).show();
                clearForm();
            } else {
                Toast.makeText(requireContext(), "Upload failed", Toast.LENGTH_SHORT).show();
            }
        });
    }

    private void bindCourseUnits(List<CourseUnit> list) {
        ArrayAdapter<CourseUnit> adapter = new ArrayAdapter<>(requireContext(), android.R.layout.simple_spinner_item, list) {
            @NonNull
            @Override
            public View getView(int position, @Nullable View convertView, @NonNull ViewGroup parent) {
                View v = super.getView(position, convertView, parent);
                return v;
            }
        };
        adapter.setDropDownViewResource(android.R.layout.simple_spinner_dropdown_item);
        binding.spCourseUnit.setAdapter(adapter);
        binding.spCourseUnit.setOnItemSelectedListener(new android.widget.AdapterView.OnItemSelectedListener() {
            @Override
            public void onItemSelected(android.widget.AdapterView<?> parent, View view, int position, long id) {
                CourseUnit cu = (CourseUnit) parent.getItemAtPosition(position);
                selectedCourseUnitId = cu.getId();
            }

            @Override
            public void onNothingSelected(android.widget.AdapterView<?> parent) {
                selectedCourseUnitId = null;
            }
        });
    }

    private void reloadCourseUnits(SharedPreferencesManager spm) {
        int programId = spm.getUserProgramId();
        int year = getSelectedYear();
        int sem = getSelectedSemester();
        vm.loadCourseUnits(programId, year, sem);
    }

    private int getSelectedYear() {
        for (int i = 0; i < binding.chipYears.getChildCount(); i++) {
            View v = binding.chipYears.getChildAt(i);
            if (v instanceof com.google.android.material.chip.Chip && ((com.google.android.material.chip.Chip) v).isChecked()) {
                String t = ((com.google.android.material.chip.Chip) v).getText().toString();
                try { return Integer.parseInt(t.replace("Y","")); } catch (Exception ignored) {}
            }
        }
        return 1;
    }

    private int getSelectedSemester() {
        for (int i = 0; i < binding.chipSemesters.getChildCount(); i++) {
            View v = binding.chipSemesters.getChildAt(i);
            if (v instanceof com.google.android.material.chip.Chip && ((com.google.android.material.chip.Chip) v).isChecked()) {
                String t = ((com.google.android.material.chip.Chip) v).getText().toString();
                try { return Integer.parseInt(t.replace("S","")); } catch (Exception ignored) {}
            }
        }
        return 1;
    }

    private void doUpload() {
        if (pickedFileUri == null) {
            Toast.makeText(requireContext(), "Pick a file first", Toast.LENGTH_SHORT).show();
            return;
        }
        String title = binding.etTitle.getText() != null ? binding.etTitle.getText().toString().trim() : null;
        String desc = binding.etDescription.getText() != null ? binding.etDescription.getText().toString().trim() : null;
        if (TextUtils.isEmpty(title) || selectedCourseUnitId == null) {
            Toast.makeText(requireContext(), "Title and course unit required", Toast.LENGTH_SHORT).show();
            return;
        }
        binding.progress.setVisibility(View.VISIBLE);
        MultipartBody.Part filePart = buildFilePart(pickedFileUri);
        RequestBody titleRb = RequestBody.create(MediaType.parse("text/plain"), title);
        RequestBody descRb = RequestBody.create(MediaType.parse("text/plain"), desc == null ? "" : desc);
        RequestBody cuRb = RequestBody.create(MediaType.parse("text/plain"), String.valueOf(selectedCourseUnitId));
        RequestBody tagsRb = RequestBody.create(MediaType.parse("text/plain"), "");
        vm.upload(filePart, titleRb, descRb, cuRb, tagsRb);
    }

    private MultipartBody.Part buildFilePart(Uri uri) {
        try {
            ContentResolver cr = requireContext().getContentResolver();
            String mime = cr.getType(uri);
            if (mime == null) mime = "application/octet-stream";
            InputStream is = cr.openInputStream(uri);
            if (is == null) throw new IOException("Cannot open input stream");
            byte[] bytes = readAll(is);
            RequestBody rb = RequestBody.create(MediaType.parse(mime), bytes);
            String filename = getFileName(uri);
            return MultipartBody.Part.createFormData("file", filename, rb);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    private static byte[] readAll(InputStream input) throws IOException {
        ByteArrayOutputStream buffer = new ByteArrayOutputStream();
        int nRead;
        byte[] data = new byte[8192];
        while ((nRead = input.read(data, 0, data.length)) != -1) {
            buffer.write(data, 0, nRead);
        }
        return buffer.toByteArray();
    }

    private String getFileName(Uri uri) {
        String result = null;
        if ("content".equals(uri.getScheme())) {
            try (Cursor cursor = requireContext().getContentResolver().query(uri, null, null, null, null)) {
                if (cursor != null && cursor.moveToFirst()) {
                    int idx = cursor.getColumnIndex(OpenableColumns.DISPLAY_NAME);
                    if (idx >= 0) result = cursor.getString(idx);
                }
            }
        }
        if (result == null) {
            result = uri.getLastPathSegment();
        }
        return result == null ? "upload.bin" : result;
    }

    private void clearForm() {
        binding.etTitle.setText("");
        binding.etDescription.setText("");
        pickedFileUri = null;
        binding.tvFileName.setText("No file selected");
    }

    @Override
    public void onDestroyView() {
        super.onDestroyView();
        binding = null;
    }
}
