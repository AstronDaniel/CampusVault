package com.example.campusvault.ui.auth;

import android.content.Intent;
import android.os.Bundle;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.lifecycle.ViewModelProvider;
import com.example.campusvault.databinding.FragmentLoginBinding;
import com.example.campusvault.ui.base.BaseFragment;
import com.example.campusvault.ui.splash.SplashActivity;
import com.example.campusvault.utils.ViewAnimationUtils;

/**
 * Login fragment with email and password fields
 */
public class LoginFragment extends BaseFragment<FragmentLoginBinding> {

    private AuthViewModel viewModel;

    @Override
    protected FragmentLoginBinding getViewBinding(@NonNull LayoutInflater inflater, @Nullable ViewGroup container) {
        return FragmentLoginBinding.inflate(inflater, container, false);
    }

    @Override
    protected void setupUI() {
        setLoadingIndicator(binding.progressBar);
        
        // Initialize ViewModel
        AuthViewModelFactory factory = new AuthViewModelFactory(requireContext());
        viewModel = new ViewModelProvider(requireActivity(), factory).get(AuthViewModel.class);
        
        // Setup click listeners
        binding.btnLogin.setOnClickListener(v -> handleLogin());
        binding.tvForgotPassword.setOnClickListener(v -> handleForgotPassword());
        binding.tvSignUp.setOnClickListener(v -> navigateToRegister());
        
        // Setup real-time validation
        setupRealTimeValidation();
    }

    @Override
    protected void observeData() {
        // Observe loading state
        viewModel.isLoading.observe(getViewLifecycleOwner(), isLoading -> {
            if (isLoading) {
                showLoading();
                binding.btnLogin.setEnabled(false);
                binding.btnLogin.setText("");
            } else {
                hideLoading();
                binding.btnLogin.setEnabled(true);
                binding.btnLogin.setText("Login");
            }
        });

        // Observe auth result
        viewModel.authResult.observe(getViewLifecycleOwner(), result -> {
            if (result != null && result.isSuccess()) {
                showSuccess("Login successful!");
                navigateToMain();
            } else if (result != null && result.isError()) {
                showError(result.getMessage());
                ViewAnimationUtils.shake(binding.btnLogin);
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
    }

    /**
     * Handle login button click
     */
    private void handleLogin() {
        String email = binding.etEmail.getText() != null ? 
            binding.etEmail.getText().toString().trim() : "";
        String password = binding.etPassword.getText() != null ? 
            binding.etPassword.getText().toString() : "";

        // Validate inputs
        String emailError = viewModel.validateEmail(email);
        String passwordError = viewModel.validatePassword(password);

        binding.tilEmail.setError(emailError);
        binding.tilPassword.setError(passwordError);

        if (emailError != null || passwordError != null) {
            ViewAnimationUtils.shake(binding.btnLogin);
            return;
        }

        // Perform login
        viewModel.login(email, password);
    }

    /**
     * Handle forgot password click
     */
    private void handleForgotPassword() {
        if (getActivity() instanceof AuthActivity) {
            ((AuthActivity) getActivity()).navigateToForgotPassword();
        }
    }

    /**
     * Navigate to register screen
     */
    private void navigateToRegister() {
        if (getActivity() instanceof AuthActivity) {
            AuthActivity authActivity = (AuthActivity) getActivity();
            authActivity.navigateToRegister();
        }
    }

    /**
     * Navigate to main screen
     */
    private void navigateToMain() {
        Intent intent = new Intent(requireContext(), com.example.campusvault.ui.main.MainActivity.class);
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
        startActivity(intent);
        requireActivity().finish();
    }
}
