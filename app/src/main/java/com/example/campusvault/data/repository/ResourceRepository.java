package com.example.campusvault.data.repository;

import android.app.Application;
import androidx.lifecycle.LiveData;
import com.example.campusvault.data.local.AppDatabase;
import com.example.campusvault.data.local.dao.ResourceDao;
import com.example.campusvault.data.models.Resource;
import java.util.List;

public class ResourceRepository {
    private final ResourceDao resourceDao;

    public ResourceRepository(Application application) {
        AppDatabase db = AppDatabase.getDatabase(application);
        resourceDao = db.resourceDao();
    }

    public LiveData<List<Resource>> getBookmarkedResources() {
        return resourceDao.getBookmarkedResources();
    }
}
