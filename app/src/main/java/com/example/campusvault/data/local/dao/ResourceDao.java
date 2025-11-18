package com.example.campusvault.data.local.dao;

import androidx.lifecycle.LiveData;
import androidx.room.Dao;
import androidx.room.Query;
import com.example.campusvault.data.models.Resource;
import java.util.List;

@Dao
public interface ResourceDao {
    @Query("SELECT * FROM resources WHERE id IN (SELECT resourceId FROM bookmarks)")
    LiveData<List<Resource>> getBookmarkedResources();
}
