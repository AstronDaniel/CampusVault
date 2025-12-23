package com.example.campusvault.data.sync;

import android.content.Context;
import android.util.Log;
import androidx.work.BackoffPolicy;
import androidx.work.Constraints;
import androidx.work.Data;
import androidx.work.ExistingPeriodicWorkPolicy;
import androidx.work.ExistingWorkPolicy;
import androidx.work.NetworkType;
import androidx.work.OneTimeWorkRequest;
import androidx.work.PeriodicWorkRequest;
import androidx.work.WorkInfo;
import androidx.work.WorkManager;
import java.util.concurrent.TimeUnit;

/**
 * Manages background data synchronization using WorkManager.
 * Handles periodic syncs and on-demand sync requests.
 */
public class SyncManager {

    private static final String TAG = "SyncManager";
    private static final String PERIODIC_SYNC_WORK = "periodic_sync";
    private static final String ONE_TIME_SYNC_WORK = "one_time_sync";
    
    // Sync intervals
    private static final long PERIODIC_SYNC_INTERVAL_HOURS = 6;
    private static final long FLEX_INTERVAL_HOURS = 2;
    
    private static volatile SyncManager instance;
    private final WorkManager workManager;
    private final NetworkMonitor networkMonitor;

    private SyncManager(Context context) {
        this.workManager = WorkManager.getInstance(context);
        this.networkMonitor = NetworkMonitor.getInstance(context);
    }

    public static SyncManager getInstance(Context context) {
        if (instance == null) {
            synchronized (SyncManager.class) {
                if (instance == null) {
                    instance = new SyncManager(context);
                }
            }
        }
        return instance;
    }

    /**
     * Schedule periodic background sync.
     * Runs every 6 hours when device is connected to network.
     */
    public void schedulePeriodicSync() {
        Log.d(TAG, "Scheduling periodic sync");
        
        Constraints constraints = new Constraints.Builder()
            .setRequiredNetworkType(NetworkType.CONNECTED)
            .build();

        PeriodicWorkRequest syncRequest = new PeriodicWorkRequest.Builder(
                SyncWorker.class,
                PERIODIC_SYNC_INTERVAL_HOURS,
                TimeUnit.HOURS,
                FLEX_INTERVAL_HOURS,
                TimeUnit.HOURS
            )
            .setConstraints(constraints)
            .setBackoffCriteria(
                BackoffPolicy.EXPONENTIAL,
                PeriodicWorkRequest.MIN_BACKOFF_MILLIS,
                TimeUnit.MILLISECONDS
            )
            .setInputData(new Data.Builder()
                .putString(SyncWorker.SYNC_TYPE_KEY, SyncWorker.SYNC_TYPE_ALL)
                .build())
            .addTag(PERIODIC_SYNC_WORK)
            .build();

        workManager.enqueueUniquePeriodicWork(
            PERIODIC_SYNC_WORK,
            ExistingPeriodicWorkPolicy.KEEP,
            syncRequest
        );
    }

    /**
     * Request an immediate sync if online.
     */
    public void requestImmediateSync() {
        requestSync(SyncWorker.SYNC_TYPE_ALL);
    }

    /**
     * Request sync for specific data type.
     */
    public void requestSync(String syncType) {
        if (!networkMonitor.isOnline()) {
            Log.d(TAG, "Skipping sync - offline");
            return;
        }
        
        Log.d(TAG, "Requesting immediate sync: " + syncType);
        
        Constraints constraints = new Constraints.Builder()
            .setRequiredNetworkType(NetworkType.CONNECTED)
            .build();

        OneTimeWorkRequest syncRequest = new OneTimeWorkRequest.Builder(SyncWorker.class)
            .setConstraints(constraints)
            .setInputData(new Data.Builder()
                .putString(SyncWorker.SYNC_TYPE_KEY, syncType)
                .build())
            .addTag(ONE_TIME_SYNC_WORK)
            .build();

        workManager.enqueueUniqueWork(
            ONE_TIME_SYNC_WORK + "_" + syncType,
            ExistingWorkPolicy.REPLACE,
            syncRequest
        );
    }

    /**
     * Sync faculties only
     */
    public void syncFaculties() {
        requestSync(SyncWorker.SYNC_TYPE_FACULTIES);
    }

    /**
     * Sync programs only
     */
    public void syncPrograms() {
        requestSync(SyncWorker.SYNC_TYPE_PROGRAMS);
    }

    /**
     * Sync course units only
     */
    public void syncCourseUnits() {
        requestSync(SyncWorker.SYNC_TYPE_COURSE_UNITS);
    }

    /**
     * Sync resources only
     */
    public void syncResources() {
        requestSync(SyncWorker.SYNC_TYPE_RESOURCES);
    }

    /**
     * Cancel all pending sync work
     */
    public void cancelAllSync() {
        workManager.cancelAllWorkByTag(PERIODIC_SYNC_WORK);
        workManager.cancelAllWorkByTag(ONE_TIME_SYNC_WORK);
    }

    /**
     * Check if sync is currently running
     */
    public boolean isSyncing() {
        try {
            for (WorkInfo info : workManager.getWorkInfosByTag(ONE_TIME_SYNC_WORK).get()) {
                if (info.getState() == WorkInfo.State.RUNNING) {
                    return true;
                }
            }
        } catch (Exception e) {
            Log.e(TAG, "Error checking sync status", e);
        }
        return false;
    }
}
