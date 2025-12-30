package com.example.campusvault.ui.auth;

import android.content.Intent;
import android.os.Bundle;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.AdapterView;
import android.widget.ArrayAdapter;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.lifecycle.ViewModelProvider;
import com.example.campusvault.data.models.FacultyResponse;
import com.example.campusvault.data.models.ProgramResponse;
import com.example.campusvault.databinding.FragmentRegisterBinding;
import com.example.campusvault.ui.base.BaseFragment;
import com.example.campusvault.ui.splash.SplashActivity;
import com.example.campusvault.utils.ViewAnimationUtils;
import java.util.ArrayList;
import java.util.List;

/**
 * Register fragment with email, username, faculty, program, and password fields
 */
public class RegisterFragment extends BaseFragment<FragmentRegisterBinding> {

    private AuthViewModel viewModel;
    private List<FacultyResponse> facultyList = new ArrayList<>();
    private List<ProgramResponse> programList = new ArrayList<>();
    private Integer selectedFacultyId = null;
    private Integer selectedProgramId = null;

    @Override
    protected FragmentRegisterBinding getViewBinding(@NonNull LayoutInflater inflater, @Nullable ViewGroup container) {
        return FragmentRegisterBinding.inflate(inflater, container, false);
    }

    @Override
    protected void setupUI() {
        setLoadingIndicator(binding.progressBar);
        
        // Initialize ViewModel
        AuthViewModelFactory factory = new AuthViewModelFactory(requireContext());
        viewModel = new ViewModelProvider(requireActivity(), factory).get(AuthViewModel.class);
        
        binding.btnRegister.setOnClickListener(v -> handleRegister());
        binding.tvSignIn.setOnClickListener(v -> navigateToLogin());
        
        // Setup real-time validation
        setupRealTimeValidation();
        
        // Load faculties
        loadFaculties();

        // Program spinner disabled until a faculty is selected
        binding.spinnerProgram.setEnabled(false);
        binding.spinnerProgram.setAlpha(0.6f);
        
        // Setup faculty selection listener
        binding.spinnerFaculty.setOnItemClickListener((parent, view, position, id) -> {
            if (position < facultyList.size()) {
                selectedFacultyId = facultyList.get(position).getId();
                binding.tilFaculty.setError(null);
                // enable program selector and load programs
                binding.spinnerProgram.setEnabled(true);
                binding.spinnerProgram.setAlpha(1f);
                loadPrograms(selectedFacultyId);
            }
        });
        
        // Setup program selection listener
        binding.spinnerProgram.setOnItemClickListener((parent, view, position, id) -> {
            if (position < programList.size()) {
                selectedProgramId = programList.get(position).getId();
                binding.tilProgram.setError(null);
            }
        });
    }

    @Override
    protected void observeData() {
        // Observe loading state
        viewModel.isLoading.observe(getViewLifecycleOwner(), isLoading -> {
            if (isLoading) {
                showLoading();
                binding.btnRegister.setEnabled(false);
                binding.btnRegister.setText("");
            } else {
                hideLoading();
                binding.btnRegister.setEnabled(true);
                binding.btnRegister.setText("Register");
            }
        });

        // Observe auth result (now auto-login after register)
        viewModel.authResult.observe(getViewLifecycleOwner(), result -> {
            if (result != null && result.isSuccess()) {
                showSuccess("Registration complete! You're now signed in.");
                navigateToMain();
            } else if (result != null && result.isError()) {
                showError(result.getMessage());
                ViewAnimationUtils.shake(binding.btnRegister);
            }
        });

        // Observe errors
        viewModel.error.observe(getViewLifecycleOwner(), error -> {
            if (error != null && !error.isEmpty()) {
                showError(error);
            }
        });
    }

    /**
     * Setup real-time validation with TextWatcher
     */
    private void setupRealTimeValidation() {
        binding.etName.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {}

            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {
                String error = viewModel.validateUsername(s.toString());
                binding.tilName.setError(error);
            }

            @Override
            public void afterTextChanged(Editable s) {}
        });

        binding.etEmail.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {}

            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {
                String error = viewModel.validateEmail(s.toString());
                binding.tilEmail.setError(error);
            }

            @Override
            public void afterTextChanged(Editable s) {}
        });

        binding.etPassword.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {}

            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {
                String error = viewModel.validatePassword(s.toString());
                binding.tilPassword.setError(error);
            }

            @Override
            public void afterTextChanged(Editable s) {}
        });

        binding.etConfirmPassword.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {}

            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {
                String password = binding.etPassword.getText() != null ? 
                    binding.etPassword.getText().toString() : "";
                String error = viewModel.validatePasswordConfirmation(password, s.toString());
                binding.tilConfirmPassword.setError(error);
            }

            @Override
            public void afterTextChanged(Editable s) {}
        });
    }

    /**
     * Load faculties from API
     */
    private void loadFaculties() {
        viewModel.loadFaculties(faculties -> {
            facultyList = faculties;
            ArrayAdapter<FacultyResponse> adapter = new ArrayAdapter<>(
                requireContext(),
                android.R.layout.simple_dropdown_item_1line,
                facultyList
            );
            binding.spinnerFaculty.setAdapter(adapter);
        });
    }

    /**
     * Load programs for selected faculty
     */
    private void loadPrograms(int facultyId) {
        // Clear program selection
        selectedProgramId = null;
        binding.spinnerProgram.setText("", false);
        
        viewModel.loadPrograms(facultyId, programs -> {
            programList = programs;
            ArrayAdapter<ProgramResponse> adapter = new ArrayAdapter<>(
                requireContext(),
                android.R.layout.simple_dropdown_item_1line,
                programList
            );
            binding.spinnerProgram.setAdapter(adapter);
            // If no programs returned, keep it disabled and show hint
            if (programList == null || programList.isEmpty()) {
                binding.spinnerProgram.setEnabled(false);
                binding.spinnerProgram.setAlpha(0.6f);
                binding.spinnerProgram.setText("No programs available", false);
            } else {
                binding.spinnerProgram.setEnabled(true);
                binding.spinnerProgram.setAlpha(1f);
            }
        });
    }

    /**
     * Handle register button click
     */
    private void handleRegister() {
        String username = binding.etName.getText() != null ? 
            binding.etName.getText().toString().trim() : "";
        String email = binding.etEmail.getText() != null ? 
            binding.etEmail.getText().toString().trim() : "";
        String password = binding.etPassword.getText() != null ? 
            binding.etPassword.getText().toString() : "";
        String confirmPassword = binding.etConfirmPassword.getText() != null ? 
            binding.etConfirmPassword.getText().toString() : "";

        // Validate inputs
        String usernameError = viewModel.validateUsername(username);
        String emailError = viewModel.validateEmail(email);
        String passwordError = viewModel.validatePassword(password);
        String confirmError = viewModel.validatePasswordConfirmation(password, confirmPassword);

        binding.tilName.setError(usernameError);
        binding.tilEmail.setError(emailError);
        binding.tilPassword.setError(passwordError);
        binding.tilConfirmPassword.setError(confirmError);

        // Validate faculty and program selection
        boolean hasErrors = false;
        if (selectedFacultyId == null) {
            binding.tilFaculty.setError("Please select a faculty");
            hasErrors = true;
        }
        if (selectedProgramId == null) {
            binding.tilProgram.setError("Please select a program");
            hasErrors = true;
        }

        if (usernameError != null || emailError != null || passwordError != null || 
            confirmError != null || hasErrors) {
            ViewAnimationUtils.shake(binding.btnRegister);
            return;
        }

        // Perform registration
        viewModel.register(email, username, selectedFacultyId, selectedProgramId, password);
    }

    /**
     * Navigate to login screen
     */
    private void navigateToLogin() {
        if (getActivity() instanceof AuthActivity) {
            AuthActivity authActivity = (AuthActivity) getActivity();
            authActivity.navigateToLogin();
        }
    }

    /**
     * Navigate to main screen after auto-login
     */
    private void navigateToMain() {
        Intent intent = new Intent(requireContext(), com.example.campusvault.ui.main.MainActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        startActivity(intent);
        requireActivity().finish();
    }
}
