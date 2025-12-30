package com.example.campusvault.data.sync;

import android.content.Context;
import android.content.SharedPreferences;
import android.util.Log;
import androidx.annotation.NonNull;
import androidx.work.Worker;
import androidx.work.WorkerParameters;
import com.example.campusvault.data.api.ApiClient;
import com.example.campusvault.data.api.ApiService;
import com.example.campusvault.data.local.SharedPreferencesManager;
import com.example.campusvault.data.local.database.AppDatabase;
import com.example.campusvault.data.local.database.dao.UniversityDao;
import com.example.campusvault.data.local.database.dao.ResourceDao;
import com.example.campusvault.data.local.database.entity.CourseUnitEntity;
import com.example.campusvault.data.local.database.entity.FacultyEntity;
import com.example.campusvault.data.local.database.entity.ProgramEntity;
import com.example.campusvault.data.local.database.entity.ResourceEntity;
import com.example.campusvault.data.models.CourseUnit;
import com.example.campusvault.data.models.FacultyResponse;
import com.example.campusvault.data.models.ProgramResponse;
import com.example.campusvault.data.models.Resource;
import java.util.ArrayList;
import java.util.Date;
import java.util.List;

/**
 * Background worker that syncs data from the API to local database.
 * Uses smart incremental sync - only syncs if data is stale.
 * 
 * Sync intervals:
 * - Faculties/Programs: Every 24 hours (rarely change)
 * - Course Units: Every 12 hours (rarely change)
 * - Resources: Every 1 hour (frequently updated)
 */
public class SyncWorker extends Worker {

    private static final String TAG = "SyncWorker";
    private static final String SYNC_PREFS = "sync_preferences";
    
    // Sync interval thresholds (in milliseconds)
    private static final long FACULTY_SYNC_INTERVAL = 24 * 60 * 60 * 1000L; // 24 hours
    private static final long PROGRAM_SYNC_INTERVAL = 24 * 60 * 60 * 1000L; // 24 hours  
    private static final long COURSE_UNIT_SYNC_INTERVAL = 12 * 60 * 60 * 1000L; // 12 hours
    private static final long RESOURCE_SYNC_INTERVAL = 1 * 60 * 60 * 1000L; // 1 hour
    
    // Preference keys for last sync timestamps
    private static final String KEY_LAST_FACULTY_SYNC = "last_faculty_sync";
    private static final String KEY_LAST_PROGRAM_SYNC = "last_program_sync";
    private static final String KEY_LAST_COURSE_UNIT_SYNC = "last_course_unit_sync";
    private static final String KEY_LAST_RESOURCE_SYNC = "last_resource_sync";
    
    public static final String WORK_NAME = "data_sync_work";
    public static final String SYNC_TYPE_KEY = "sync_type";
    public static final String FORCE_SYNC_KEY = "force_sync";
    
    public static final String SYNC_TYPE_ALL = "all";
    public static final String SYNC_TYPE_FACULTIES = "faculties";
    public static final String SYNC_TYPE_PROGRAMS = "programs";
    public static final String SYNC_TYPE_COURSE_UNITS = "course_units";
    public static final String SYNC_TYPE_RESOURCES = "resources";

    private final ApiService api;
    private final UniversityDao universityDao;
    private final ResourceDao resourceDao;
    private final SharedPreferences syncPrefs;

    public SyncWorker(@NonNull Context context, @NonNull WorkerParameters params) {
        super(context, params);
        
        SharedPreferencesManager spm = new SharedPreferencesManager(context);
        this.api = ApiClient.getInstance(spm).getApiService();
        
        AppDatabase db = AppDatabase.getInstance(context);
        this.universityDao = db.universityDao();
        this.resourceDao = db.resourceDao();
        this.syncPrefs = context.getSharedPreferences(SYNC_PREFS, Context.MODE_PRIVATE);
    }

    @NonNull
    @Override
    public Result doWork() {
        String syncType = getInputData().getString(SYNC_TYPE_KEY);
        boolean forceSync = getInputData().getBoolean(FORCE_SYNC_KEY, false);
        
        if (syncType == null) {
            syncType = SYNC_TYPE_ALL;
        }
        
        Log.d(TAG, "Starting sync: " + syncType + " (force=" + forceSync + ")");
        
        try {
            switch (syncType) {
                case SYNC_TYPE_FACULTIES:
                    syncFaculties(forceSync);
                    break;
                case SYNC_TYPE_PROGRAMS:
                    syncAllPrograms(forceSync);
                    break;
                case SYNC_TYPE_COURSE_UNITS:
                    syncAllCourseUnits(forceSync);
                    break;
                case SYNC_TYPE_RESOURCES:
                    syncRecentResources(forceSync);
                    break;
                case SYNC_TYPE_ALL:
                default:
                    syncAll(forceSync);
                    break;
            }
            
            Log.d(TAG, "Sync completed successfully");
            return Result.success();
            
        } catch (Exception e) {
            Log.e(TAG, "Sync failed", e);
            // Retry on failure
            if (getRunAttemptCount() < 3) {
                return Result.retry();
            }
            return Result.failure();
        }
    }
    
    /**
     * Check if a sync is needed based on last sync timestamp
     */
    private boolean needsSync(String key, long interval) {
        long lastSync = syncPrefs.getLong(key, 0);
        long now = System.currentTimeMillis();
        return (now - lastSync) > interval;
    }
    
    /**
     * Mark a sync as completed
     */
    private void markSynced(String key) {
        syncPrefs.edit().putLong(key, System.currentTimeMillis()).apply();
    }

    private void syncAll(boolean force) throws Exception {
        syncFaculties(force);
        syncAllPrograms(force);
        syncAllCourseUnits(force);
        syncRecentResources(force);
    }

    private void syncFaculties(boolean force) throws Exception {
        if (!force && !needsSync(KEY_LAST_FACULTY_SYNC, FACULTY_SYNC_INTERVAL)) {
            Log.d(TAG, "Skipping faculties sync - data is fresh");
            return;
        }
        
        Log.d(TAG, "Syncing faculties...");
        List<FacultyResponse> faculties = api.getFaculties().blockingGet();
        
        List<FacultyEntity> entities = new ArrayList<>();
        for (FacultyResponse f : faculties) {
            FacultyEntity entity = new FacultyEntity();
            entity.setId(f.getId());
            entity.setName(f.getName());
            entity.setCode(f.getCode());
            entities.add(entity);
        }
        
        universityDao.updateFaculties(entities);
        markSynced(KEY_LAST_FACULTY_SYNC);
        Log.d(TAG, "Synced " + entities.size() + " faculties");
    }

    private void syncAllPrograms(boolean force) throws Exception {
        if (!force && !needsSync(KEY_LAST_PROGRAM_SYNC, PROGRAM_SYNC_INTERVAL)) {
            Log.d(TAG, "Skipping programs sync - data is fresh");
            return;
        }
        
        Log.d(TAG, "Syncing programs...");
        
        // First get all faculties to know which programs to fetch
        List<FacultyResponse> faculties = api.getFaculties().blockingGet();
        
        List<ProgramEntity> allPrograms = new ArrayList<>();
        for (FacultyResponse faculty : faculties) {
            try {
                List<ProgramResponse> programs = api.getPrograms(faculty.getId()).blockingGet();
                for (ProgramResponse p : programs) {
                    ProgramEntity entity = new ProgramEntity();
                    entity.setId(p.getId());
                    entity.setName(p.getName());
                    entity.setCode(p.getCode());
                    entity.setFacultyId(p.getFacultyId());
                    entity.setDurationYears(p.getDurationYears());
                    allPrograms.add(entity);
                }
            } catch (Exception e) {
                Log.w(TAG, "Failed to sync programs for faculty " + faculty.getId(), e);
            }
        }
        
        if (!allPrograms.isEmpty()) {
            universityDao.updatePrograms(allPrograms);
        }
        markSynced(KEY_LAST_PROGRAM_SYNC);
        Log.d(TAG, "Synced " + allPrograms.size() + " programs");
    }

    private void syncAllCourseUnits(boolean force) throws Exception {
        if (!force && !needsSync(KEY_LAST_COURSE_UNIT_SYNC, COURSE_UNIT_SYNC_INTERVAL)) {
            Log.d(TAG, "Skipping course units sync - data is fresh");
            return;
        }
        Log.d(TAG, "Syncing course units...");
        
        // Fetch all course units (no filters)
        List<CourseUnit> courseUnits = api.getCourseUnits(null, null, null).blockingGet();
        
        List<CourseUnitEntity> entities = new ArrayList<>();
        for (CourseUnit cu : courseUnits) {
            CourseUnitEntity entity = new CourseUnitEntity();
            entity.setId(cu.getId());
            entity.setName(cu.getName());
            entity.setCode(cu.getCode());
            entity.setProgramId(cu.getProgramId());
            entity.setYear(cu.getYear());
            entity.setSemester(cu.getSemester());
            entities.add(entity);
        }
        
        universityDao.updateCourseUnits(entities);
        markSynced(KEY_LAST_COURSE_UNIT_SYNC);
        Log.d(TAG, "Synced " + entities.size() + " course units");
    }

    private void syncRecentResources(boolean force) throws Exception {
        if (!force && !needsSync(KEY_LAST_RESOURCE_SYNC, RESOURCE_SYNC_INTERVAL)) {
            Log.d(TAG, "Skipping resources sync - data is fresh");
            return;
        }
        
        Log.d(TAG, "Syncing recent resources...");
        
        // Fetch recent and trending resources (paginated)
        List<Resource> recentResources = api.getRecentResources(1, 50).blockingGet().getItems();
        List<Resource> trendingResources = api.getTrendingResources(1, 50).blockingGet().getItems();
        
        // Merge without duplicates
        List<Resource> allResources = new ArrayList<>(recentResources);
        for (Resource r : trendingResources) {
            boolean exists = false;
            for (Resource existing : allResources) {
                if (existing.getId() == r.getId()) {
                    exists = true;
                    break;
                }
            }
            if (!exists) {
                allResources.add(r);
            }
        }
        
        for (Resource r : allResources) {
            ResourceEntity entity = mapResourceToEntity(r);
            resourceDao.insert(entity).blockingAwait();
        }
        
        markSynced(KEY_LAST_RESOURCE_SYNC);
        Log.d(TAG, "Synced " + allResources.size() + " resources");
    }

    private ResourceEntity mapResourceToEntity(Resource r) {
        ResourceEntity entity = new ResourceEntity();
        entity.setId(r.getId());
        entity.setTitle(r.getTitle());
        entity.setDescription(r.getDescription());
        entity.setFileUrl(r.getFileUrl());
        entity.setThumbnailUrl(r.getThumbnailUrl());
        entity.setFileType(r.getFileType());
        entity.setFileSize(r.getFileSize());
        
        // Handle author
        if (r.getAuthor() != null) {
            entity.setAuthorId(r.getAuthor().getId());
            entity.setAuthorName(r.getAuthor().getName());
        }
        
        // Handle course unit
        if (r.getCourseUnit() != null) {
            entity.setCourseUnitId(r.getCourseUnit().getId());
            entity.setCourseUnitName(r.getCourseUnit().getName());
        } else if (r.getCourseUnitId() != null) {
            entity.setCourseUnitId(r.getCourseUnitId());
        }
        
        entity.setTags(r.getTags());
        entity.setDownloadCount(r.getDownloadCount());
        entity.setAverageRating(r.getAverageRating());
        entity.setUploadedAt(r.getUploadedAt());
        entity.setResourceType(r.getResourceType());
        entity.setCachedAt(new Date());
        return entity;
    }
}
