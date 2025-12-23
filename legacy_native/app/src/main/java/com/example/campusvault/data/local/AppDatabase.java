package com.example.campusvault.data.local;

import android.content.Context;
import androidx.room.Database;
import androidx.room.Room;
import androidx.room.RoomDatabase;
import com.example.campusvault.data.local.dao.BookmarkDao;
import com.example.campusvault.data.models.Bookmark;
import com.example.campusvault.data.models.Resource;

@Database(entities = {Bookmark.class, Resource.class}, version = 1, exportSchema = false)
@androidx.room.TypeConverters({com.example.campusvault.data.local.converters.Converters.class})
public abstract class AppDatabase extends RoomDatabase {
    public abstract BookmarkDao bookmarkDao();
    public abstract com.example.campusvault.data.local.dao.ResourceDao resourceDao();

    private static volatile AppDatabase INSTANCE;

    public static AppDatabase getDatabase(final Context context) {
        if (INSTANCE == null) {
            synchronized (AppDatabase.class) {
                if (INSTANCE == null) {
                    INSTANCE = Room.databaseBuilder(context.getApplicationContext(),
                            AppDatabase.class, "campus_vault_database")
                            .build();
                }
            }
        }
        return INSTANCE;
    }
}
