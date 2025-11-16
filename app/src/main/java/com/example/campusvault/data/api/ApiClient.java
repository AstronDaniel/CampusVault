package com.example.campusvault.data.api;

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
 * Singleton class for managing Retrofit API client
 */
public class ApiClient {

    private static final String BASE_URL = "http://127.0.0.1:8000/api/v1/"; // Using this as we adb reverse proxy to localhost
    private static final int TIMEOUT_SECONDS = 30;

    private static ApiClient instance;
    private final ApiService apiService;

    private ApiClient(SharedPreferencesManager preferencesManager) {
        // Configure Gson
        Gson gson = new GsonBuilder()
            .setDateFormat("yyyy-MM-dd'T'HH:mm:ss")
            .create();

        // Configure logging interceptor
        HttpLoggingInterceptor loggingInterceptor = new HttpLoggingInterceptor();
        loggingInterceptor.setLevel(HttpLoggingInterceptor.Level.BODY);

        // Create EncryptedPreferencesManager for secure token storage
        // Note: We need Context here, but we only have SharedPreferencesManager
        // The AuthInterceptor will try to get token from both sources
        
        // Configure OkHttp client
        OkHttpClient okHttpClient = new OkHttpClient.Builder()
            .addInterceptor(new AuthInterceptor(preferencesManager))
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
     * Get singleton instance of ApiClient
     */
    public static synchronized ApiClient getInstance(SharedPreferencesManager preferencesManager) {
        if (instance == null) {
            instance = new ApiClient(preferencesManager);
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
     * Reset instance (useful for testing or logout)
     */
    public static void resetInstance() {
        instance = null;
    }
}
