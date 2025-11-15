package com.example.campusvault.ui.auth;

import android.os.Bundle;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.lifecycle.ViewModelProvider;

import com.example.campusvault.databinding.FragmentForgotPasswordBinding;
import com.example.campusvault.ui.base.BaseFragment;
import com.example.campusvault.utils.ViewAnimationUtils;

/**
 * Forgot Password screen with unique dark UI design
 */
public class ForgotPasswordFragment extends BaseFragment<FragmentForgotPasswordBinding> {

    private AuthViewModel viewModel;

    @Override
    protected FragmentForgotPasswordBinding getViewBinding(@NonNull LayoutInflater inflater, @Nullable ViewGroup container) {
        return FragmentForgotPasswordBinding.inflate(inflater, container, false);
    }

    @Override
    protected void setupUI() {
        setLoadingIndicator(binding.progressBar);

        AuthViewModelFactory factory = new AuthViewModelFactory(requireContext());
        viewModel = new ViewModelProvider(requireActivity(), factory).get(AuthViewModel.class);

        binding.btnSendLink.setOnClickListener(v -> handleSendLink());
        binding.btnBackToLogin.setOnClickListener(v -> navigateToLogin());
        binding.btnBackToLogin2.setOnClickListener(v -> navigateToLogin());

        binding.etEmail.addTextChangedListener(new TextWatcher() {
            @Override public void beforeTextChanged(CharSequence s, int start, int count, int after) {}
            @Override public void onTextChanged(CharSequence s, int start, int before, int count) {
                String error = viewModel.validateEmail(s.toString());
                binding.tilEmail.setError(error);
            }
            @Override public void afterTextChanged(Editable s) {}
        });
    }

    @Override
    protected void observeData() {
        viewModel.isLoading.observe(getViewLifecycleOwner(), isLoading -> {
            if (isLoading) {
                showLoading();
                binding.btnSendLink.setEnabled(false);
                binding.btnSendLink.setText("");
            } else {
                hideLoading();
                binding.btnSendLink.setEnabled(true);
                binding.btnSendLink.setText("Send Reset Link");
            }
        });

        viewModel.passwordResetRequestResult.observe(getViewLifecycleOwner(), result -> {
            if (result == null) return;
            if (result.isSuccess()) {
                showSuccess("If an account exists, a link was sent.");
                showSuccessState();
            } else if (result.isError()) {
                showError(result.getMessage());
                ViewAnimationUtils.shake(binding.btnSendLink);
            }
        });

        viewModel.error.observe(getViewLifecycleOwner(), error -> {
            if (error != null && !error.isEmpty()) {
                binding.tilEmail.setError(error);
            }
        });
    }

    private void handleSendLink() {
        String email = binding.etEmail.getText() != null ? binding.etEmail.getText().toString().trim() : "";
        String emailError = viewModel.validateEmail(email);
        binding.tilEmail.setError(emailError);
        if (emailError != null) {
            ViewAnimationUtils.shake(binding.tilEmail);
            return;
        }
        viewModel.requestPasswordReset(email);
    }

    private void showSuccessState() {
        binding.contentForm.setVisibility(View.GONE);
        binding.contentSuccess.setVisibility(View.VISIBLE);
    }

    private void navigateToLogin() {
        if (getActivity() instanceof AuthActivity) {
            ((AuthActivity) getActivity()).navigateToLogin();
        }
    }
}
