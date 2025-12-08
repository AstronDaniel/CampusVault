package com.example.campusvault.data.api;

import com.example.campusvault.data.models.AuthResponse;
import com.example.campusvault.data.models.FacultyResponse;
import com.example.campusvault.data.models.LoginRequest;
import com.example.campusvault.data.models.PaginatedResponse;
import com.example.campusvault.data.models.ProgramResponse;
import com.example.campusvault.data.models.RegisterRequest;
import com.example.campusvault.data.models.Resource;
import com.example.campusvault.data.models.User;
import com.example.campusvault.data.models.CourseUnit;

import io.reactivex.rxjava3.core.Observable;
import io.reactivex.rxjava3.core.Single;
import okhttp3.MultipartBody;
import okhttp3.RequestBody;
import retrofit2.http.Body;
import retrofit2.http.DELETE;
import retrofit2.http.GET;
import retrofit2.http.Multipart;
import retrofit2.http.PATCH;
import retrofit2.http.POST;
import retrofit2.http.PUT;
import retrofit2.http.Part;
import retrofit2.http.Path;
import retrofit2.http.Query;

/**
 * Retrofit API service interface defining all API endpoints
 */
public interface ApiService {

    // Authentication endpoints - use /login/mobile for long-lived tokens (no refresh needed)
    @POST("auth/login/mobile")
    Single<AuthResponse> login(@Body LoginRequest request);

    // Legacy web login (short-lived tokens with refresh) - not used by mobile
    @POST("auth/login")
    Single<AuthResponse> loginWeb(@Body LoginRequest request);

    @POST("auth/register")
    Single<User> register(@Body RegisterRequest request);

    @POST("auth/logout")
    Single<Void> logout();

    // Password reset endpoints
    @POST("auth/password/reset/request")
    Single<Void> requestPasswordReset(@Body com.example.campusvault.data.models.PasswordResetRequest request);

    @POST("auth/password/reset/confirm")
    Single<Void> confirmPasswordReset(@Body com.example.campusvault.data.models.PasswordResetConfirmRequest request);

    // Faculty endpoints
    @GET("faculties")
    Single<java.util.List<FacultyResponse>> getFaculties();

    @GET("faculties/{id}")
    Single<FacultyResponse> getFacultyById(@Path("id") int facultyId);

    // Program endpoints
    @GET("programs")
    Single<java.util.List<ProgramResponse>> getPrograms(@Query("faculty_id") Integer facultyId);

    @GET("programs/{id}")
    Single<ProgramResponse> getProgramById(@Path("id") int programId);

    // Course units
    @GET("course-units")
    Single<java.util.List<CourseUnit>> getCourseUnits(
        @Query("program_id") Integer programId,
        @Query("year") Integer year,
        @Query("semester") Integer semester
    );

    // User endpoints
    @GET("auth/me")
    Single<User> getProfile();

    @GET("users/me/stats")
    Single<com.example.campusvault.data.models.UserStats> getUserStats();

    @GET("users/me/resources")
    Single<java.util.List<Resource>> getMyResources();

    @GET("users/{id}")
    Single<User> getUserById(@Path("id") int userId);

    @PATCH("auth/me")
    Single<User> updateProfile(@Body User user);

    // Resource endpoints
    @GET("resources")
    Single<PaginatedResponse<Resource>> getResources(
        @Query("page") int page,
        @Query("page_size") int pageSize,
        @Query("search") String search,
        @Query("program_id") Integer programId,
        @Query("course_unit_id") Integer courseUnitId,
        @Query("year") Integer year,
        @Query("semester") Integer semester,
        @Query("resource_type") String resourceType
    );

    @GET("resources/{id}")
    Single<Resource> getResourceById(@Path("id") int resourceId);

    @GET("resources/recent")
    Single<PaginatedResponse<Resource>> getRecentResources(
        @Query("page") int page,
        @Query("page_size") int pageSize
    );

    @GET("resources/recommended")
    Single<PaginatedResponse<Resource>> getRecommendedResources(
        @Query("page") int page,
        @Query("page_size") int pageSize
    );

    @GET("resources/trending")
    Single<PaginatedResponse<Resource>> getTrendingResources(
        @Query("page") int page,
        @Query("page_size") int pageSize
    );

    // Mobile auth ping - verify authentication works before upload
    @GET("resources/mobile/ping")
    Single<com.example.campusvault.data.models.MobilePingResponse> mobilePing();

    // Mobile-friendly upload using JSON with base64 (avoids multipart issues)
    @POST("resources/mobile/upload")
    Single<Resource> mobileUploadResource(
        @Body com.example.campusvault.data.models.MobileUploadRequest request
    );

    // Legacy multipart upload (may have issues on some cloud providers)
    @Multipart
    @POST("resources/upload")
    Single<Resource> uploadResource(
        @Part MultipartBody.Part file,
        @Part("title") RequestBody title,
        @Part("description") RequestBody description,
        @Part("course_unit_id") RequestBody courseUnitId,
        @Part("resource_type") RequestBody resourceType
    );

    // Check for duplicate before uploading (saves bandwidth)
    @Multipart
    @POST("resources/check-duplicate")
    Single<com.example.campusvault.data.models.DuplicateCheckResponse> checkDuplicate(
        @Part MultipartBody.Part file,
        @Part("course_unit_id") RequestBody courseUnitId
    );

    // Link an existing resource to a different course unit (no re-upload needed)
    @POST("resources/{id}/link")
    Single<Resource> linkResource(
        @Path("id") int existingResourceId,
        @Body com.example.campusvault.data.models.LinkResourceRequest request
    );

    @DELETE("resources/{id}")
    Single<Void> deleteResource(@Path("id") int resourceId);

    // Bookmark endpoints
    @POST("resources/{id}/bookmark")
    Single<Void> bookmarkResource(@Path("id") int resourceId);

    @DELETE("resources/{id}/bookmark")
    Single<Void> unbookmarkResource(@Path("id") int resourceId);

    @GET("bookmarks")
    Single<PaginatedResponse<Resource>> getBookmarkedResources(
        @Query("page") int page,
        @Query("page_size") int pageSize
    );

    // Download endpoint
    @POST("resources/{id}/download")
    Single<Resource> recordDownload(@Path("id") int resourceId);

    // Search autocomplete
    @GET("search/autocomplete")
    Single<java.util.List<String>> getSearchSuggestions(@Query("q") String query);
    
    // Comment endpoints
    @GET("resources/{id}/comments")
    Single<java.util.List<com.example.campusvault.data.models.ResourceComment>> getComments(
        @Path("id") int resourceId
    );
    
    @POST("resources/{id}/comments")
    Single<com.example.campusvault.data.models.ResourceComment> addComment(
        @Path("id") int resourceId,
        @Body com.example.campusvault.data.models.CommentRequest request
    );
    
    // Rating endpoint
    @POST("resources/{id}/rating")
    Single<Resource> rateResource(
        @Path("id") int resourceId,
        @Body com.example.campusvault.data.models.RatingRequest request
    );
}
