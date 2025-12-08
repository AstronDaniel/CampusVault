package com.example.campusvault.data.api;

import com.example.campusvault.data.local.EncryptedPreferencesManager;
import com.example.campusvault.data.local.SharedPreferencesManager;
import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import java.util.concurrent.TimeUnit;
import okhttp3.OkHttpClient;
import okhttp3.logging.HttpLoggingInterceptor;
import retrofit2.Retrofit;
import retrofit2.adapter.rxjava3.RxJava3CallAdapterFactory;
import retrofit2.converter.gson.GsonConverterFactory;

/**
 * Singleton class for managing Retrofit API client.
 * Uses long-lived tokens (1 year) so no token refresh mechanism is needed.
 */
public class ApiClient {

    private static final String BASE_URL = "https://campus-vault-backend.vercel.app/api/v1/";
    private static final int TIMEOUT_SECONDS = 60; // For large uploads

    private static ApiClient instance;
    private final ApiService apiService;
    
    // Store managers for later use
    private static SharedPreferencesManager sharedPrefs;
    private static EncryptedPreferencesManager encryptedPrefs;

    private ApiClient(SharedPreferencesManager preferencesManager, 
                      EncryptedPreferencesManager encryptedPreferencesManager) {
        sharedPrefs = preferencesManager;
        encryptedPrefs = encryptedPreferencesManager;
        
        // Configure Gson
        Gson gson = new GsonBuilder()
            .setDateFormat("yyyy-MM-dd'T'HH:mm:ss")
            .create();

        // Configure logging interceptor (headers only, not body to avoid large uploads in logs)
        HttpLoggingInterceptor loggingInterceptor = new HttpLoggingInterceptor();
        loggingInterceptor.setLevel(HttpLoggingInterceptor.Level.HEADERS);

        // Create interceptor with both preference managers (no token refresh needed)
        AuthInterceptor authInterceptor = new AuthInterceptor(preferencesManager, encryptedPreferencesManager);
        
        // Configure OkHttp client - simple setup, no authenticator needed
        OkHttpClient okHttpClient = new OkHttpClient.Builder()
            .addInterceptor(authInterceptor)
            .addInterceptor(loggingInterceptor)
            .connectTimeout(TIMEOUT_SECONDS, TimeUnit.SECONDS)
            .readTimeout(TIMEOUT_SECONDS, TimeUnit.SECONDS)
            .writeTimeout(TIMEOUT_SECONDS, TimeUnit.SECONDS)
            .build();

        // Configure Retrofit
        Retrofit retrofit = new Retrofit.Builder()
            .baseUrl(BASE_URL)
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create(gson))
            .addCallAdapterFactory(RxJava3CallAdapterFactory.create())
            .build();

        apiService = retrofit.create(ApiService.class);
    }

    /**
     * Get singleton instance of ApiClient (backwards compatible)
     */
    public static synchronized ApiClient getInstance(SharedPreferencesManager preferencesManager) {
        if (instance == null) {
            instance = new ApiClient(preferencesManager, null);
        }
        return instance;
    }
    
    /**
     * Get singleton instance of ApiClient with encrypted preferences
     */
    public static synchronized ApiClient getInstance(SharedPreferencesManager preferencesManager,
                                                     EncryptedPreferencesManager encryptedPreferencesManager) {
        if (instance == null) {
            instance = new ApiClient(preferencesManager, encryptedPreferencesManager);
        }
        return instance;
    }

    /**
     * Get API service instance
     */
    public ApiService getApiService() {
        return apiService;
    }

    /**
     * Reset instance (useful for logout)
     */
    public static void resetInstance() {
        instance = null;
    }
}
