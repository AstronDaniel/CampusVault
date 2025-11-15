package com.example.campusvault.data.local.database.dao;

import androidx.room.Dao;
import androidx.room.Delete;
import androidx.room.Insert;
import androidx.room.OnConflictStrategy;
import androidx.room.Query;
import androidx.room.Update;
import com.example.campusvault.data.local.database.entity.ResourceEntity;
import io.reactivex.rxjava3.core.Completable;
import io.reactivex.rxjava3.core.Single;
import java.util.List;

/**
 * Data Access Object for Resource entity
 */
@Dao
public interface ResourceDao {

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    Completable insert(ResourceEntity resource);

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    Completable insertAll(List<ResourceEntity> resources);

    @Update
    Completable update(ResourceEntity resource);

    @Delete
    Completable delete(ResourceEntity resource);

    @Query("SELECT * FROM resources WHERE id = :resourceId")
    Single<ResourceEntity> getResourceById(int resourceId);

    @Query("SELECT * FROM resources ORDER BY uploaded_at DESC LIMIT :limit")
    Single<List<ResourceEntity>> getRecentResources(int limit);

    @Query("SELECT * FROM resources WHERE is_bookmarked = 1 ORDER BY cached_at DESC")
    Single<List<ResourceEntity>> getBookmarkedResources();

    @Query("SELECT * FROM resources WHERE title LIKE '%' || :query || '%' OR description LIKE '%' || :query || '%'")
    Single<List<ResourceEntity>> searchResources(String query);

    @Query("DELETE FROM resources")
    Completable deleteAll();

    @Query("DELETE FROM resources WHERE cached_at < :expiryDate")
    Completable deleteExpiredCache(long expiryDate);

    @Query("SELECT COUNT(*) FROM resources")
    Single<Integer> getResourceCount();

    @Query("UPDATE resources SET is_bookmarked = :isBookmarked WHERE id = :resourceId")
    Completable updateBookmarkStatus(int resourceId, boolean isBookmarked);
}
