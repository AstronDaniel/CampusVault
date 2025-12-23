package com.example.campusvault.data.local.database.dao;

import androidx.room.Dao;
import androidx.room.Delete;
import androidx.room.Insert;
import androidx.room.OnConflictStrategy;
import androidx.room.Query;
import androidx.room.Update;
import com.example.campusvault.data.local.database.entity.ResourceEntity;
import io.reactivex.rxjava3.core.Completable;
import io.reactivex.rxjava3.core.Flowable;
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
    Flowable<ResourceEntity> getResourceById(int resourceId);

    @Query("SELECT * FROM resources ORDER BY uploaded_at DESC LIMIT :limit")
    Flowable<List<ResourceEntity>> getRecentResources(int limit);

    @Query("SELECT * FROM resources ORDER BY download_count DESC, average_rating DESC LIMIT :limit")
    Flowable<List<ResourceEntity>> getTrendingResources(int limit);

    @Query("SELECT * FROM resources WHERE course_unit_id = :courseUnitId ORDER BY uploaded_at DESC")
    Flowable<List<ResourceEntity>> getResourcesByCourseUnit(int courseUnitId);
    
    @Query("SELECT * FROM resources WHERE course_unit_id = :courseUnitId AND resource_type = :type ORDER BY uploaded_at DESC")
    Flowable<List<ResourceEntity>> getResourcesByCourseUnitAndType(int courseUnitId, String type);

    @Query("SELECT * FROM resources WHERE is_bookmarked = 1 ORDER BY cached_at DESC")
    Flowable<List<ResourceEntity>> getBookmarkedResources();

    @Query("SELECT * FROM resources WHERE title LIKE '%' || :query || '%' OR description LIKE '%' || :query || '%'")
    Flowable<List<ResourceEntity>> searchResources(String query);

    @Query("DELETE FROM resources")
    Completable deleteAll();

    @Query("DELETE FROM resources WHERE cached_at < :expiryDate AND is_bookmarked = 0")
    Completable deleteExpiredCache(long expiryDate);

    @Query("SELECT COUNT(*) FROM resources")
    Single<Integer> getResourceCount();

    @Query("UPDATE resources SET is_bookmarked = :isBookmarked WHERE id = :resourceId")
    Completable updateBookmarkStatus(int resourceId, boolean isBookmarked);
}
