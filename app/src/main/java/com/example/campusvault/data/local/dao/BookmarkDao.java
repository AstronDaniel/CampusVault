package com.example.campusvault.data.local.dao;

import androidx.lifecycle.LiveData;
import androidx.room.Dao;
import androidx.room.Insert;
import androidx.room.OnConflictStrategy;
import androidx.room.Query;
import com.example.campusvault.data.models.Bookmark;
import java.util.List;

@Dao
public interface BookmarkDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    void insert(Bookmark bookmark);

    @Query("DELETE FROM bookmarks WHERE resourceId = :resourceId")
    void delete(int resourceId);

    @Query("SELECT * FROM bookmarks")
    LiveData<List<Bookmark>> getAllBookmarks();

    @Query("SELECT EXISTS(SELECT 1 FROM bookmarks WHERE resourceId = :resourceId)")
    LiveData<Boolean> isBookmarked(int resourceId);
}
