package com.example.campusvault.ui.auth;

import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;
import com.example.campusvault.data.Result;
import com.example.campusvault.data.api.ApiClient;
import com.example.campusvault.data.api.ApiService;
import com.example.campusvault.data.models.AuthResponse;
import com.example.campusvault.data.models.FacultyResponse;
import com.example.campusvault.data.models.PasswordResetRequest;
import com.example.campusvault.data.models.ProgramResponse;
import com.example.campusvault.data.repository.AuthRepository;
import com.example.campusvault.ui.base.BaseViewModel;
import io.reactivex.rxjava3.android.schedulers.AndroidSchedulers;
import io.reactivex.rxjava3.disposables.CompositeDisposable;
import io.reactivex.rxjava3.disposables.Disposable;
import io.reactivex.rxjava3.schedulers.Schedulers;
import java.util.List;

/**
 * ViewModel for authentication operations
 */
public class AuthViewModel extends BaseViewModel {

    private final AuthRepository authRepository;
    private final ApiService apiService;
    private final CompositeDisposable disposables = new CompositeDisposable();

    private final MutableLiveData<Result<AuthResponse>> _authResult = new MutableLiveData<>();
    public final LiveData<Result<AuthResponse>> authResult = _authResult;

    private final MutableLiveData<Result<Void>> _passwordResetRequestResult = new MutableLiveData<>();
    public final LiveData<Result<Void>> passwordResetRequestResult = _passwordResetRequestResult;

    public AuthViewModel(AuthRepository authRepository, ApiService apiService) {
        this.authRepository = authRepository;
        this.apiService = apiService;
    }

    /**
     * Login with email and password
     */
    public void login(String email, String password) {
        setLoading(true);
        clearError();

        Disposable disposable = authRepository.login(email, password)
            .subscribe(
                result -> {
                    setLoading(false);
                    _authResult.postValue(result);
                    
                    if (result.isError()) {
                        setError(result.getMessage());
                    }
                },
                throwable -> {
                    setLoading(false);
                    handleException(throwable);
                }
            );

        disposables.add(disposable);
    }

    /**
     * Request a password reset link to be sent to the user's email
     */
    public void requestPasswordReset(String email) {
        // Reuse validation
        String emailError = validateEmail(email);
        if (emailError != null) {
            setError(emailError);
            _passwordResetRequestResult.postValue(Result.error(emailError));
            return;
        }

        setLoading(true);
        clearError();

        Disposable disposable = apiService.requestPasswordReset(new PasswordResetRequest(email))
            .subscribeOn(Schedulers.io())
            .observeOn(AndroidSchedulers.mainThread())
            .subscribe(
                unused -> {
                    setLoading(false);
                    _passwordResetRequestResult.postValue(Result.success(null));
                },
                throwable -> {
                    setLoading(false);
                    handleException(throwable);
                    _passwordResetRequestResult.postValue(Result.error(throwable.getMessage()));
                }
            );

        disposables.add(disposable);
    }

    /**
     * Register new user
     */
    public void register(String email, String username, Integer facultyId, Integer programId, String password) {
        setLoading(true);
        clearError();

        Disposable disposable = authRepository.register(email, username, facultyId, programId, password)
            .subscribe(
                result -> {
                    setLoading(false);
                    _authResult.postValue(result);
                    
                    if (result.isError()) {
                        setError(result.getMessage());
                    }
                },
                throwable -> {
                    setLoading(false);
                    handleException(throwable);
                }
            );

        disposables.add(disposable);
    }

    /**
     * Validate email format
     */
    public String validateEmail(String email) {
        if (email == null || email.trim().isEmpty()) {
            return "Email is required";
        }
        
        if (!android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
            return "Invalid email format";
        }
        
        return null;
    }

    /**
     * Validate password
     */
    public String validatePassword(String password) {
        if (password == null || password.isEmpty()) {
            return "Password is required";
        }
        
        if (password.length() < 8) {
            return "Password must be at least 8 characters";
        }
        
        return null;
    }

    /**
     * Validate username
     */
    public String validateUsername(String username) {
        if (username == null || username.trim().isEmpty()) {
            return "Username is required";
        }
        
        if (username.trim().length() < 3) {
            return "Username must be at least 3 characters";
        }
        
        if (!username.matches("^[a-zA-Z0-9_]+$")) {
            return "Username can only contain letters, numbers, and underscores";
        }
        
        return null;
    }

    /**
     * Validate password confirmation
     */
    public String validatePasswordConfirmation(String password, String confirmPassword) {
        if (confirmPassword == null || confirmPassword.isEmpty()) {
            return "Please confirm your password";
        }
        
        if (!password.equals(confirmPassword)) {
            return "Passwords do not match";
        }
        
        return null;
    }

    /**
     * Load faculties from API
     */
    public void loadFaculties(FacultyCallback callback) {
        Disposable disposable = apiService.getFaculties()
            .subscribeOn(Schedulers.io())
            .observeOn(AndroidSchedulers.mainThread())
            .subscribe(
                callback::onSuccess,
                throwable -> setError("Failed to load faculties: " + throwable.getMessage())
            );
        disposables.add(disposable);
    }

    /**
     * Load programs for a faculty
     */
    public void loadPrograms(int facultyId, ProgramCallback callback) {
        Disposable disposable = apiService.getPrograms(facultyId)
            .subscribeOn(Schedulers.io())
            .observeOn(AndroidSchedulers.mainThread())
            .subscribe(
                callback::onSuccess,
                throwable -> setError("Failed to load programs: " + throwable.getMessage())
            );
        disposables.add(disposable);
    }

    /**
     * Callback interface for faculty loading
     */
    public interface FacultyCallback {
        void onSuccess(List<FacultyResponse> faculties);
    }

    /**
     * Callback interface for program loading
     */
    public interface ProgramCallback {
        void onSuccess(List<ProgramResponse> programs);
    }

    @Override
    protected void onCleared() {
        super.onCleared();
        disposables.clear();
    }
}
