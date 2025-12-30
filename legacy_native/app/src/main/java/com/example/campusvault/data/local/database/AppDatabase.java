package com.example.campusvault.data.local.database;

import android.content.Context;
import androidx.room.Database;
import androidx.room.Room;
import androidx.room.RoomDatabase;
import androidx.room.TypeConverters;
import com.example.campusvault.data.local.database.dao.ResourceDao;
import com.example.campusvault.data.local.database.dao.UniversityDao;
import com.example.campusvault.data.local.database.dao.UserDao;
import com.example.campusvault.data.local.database.entity.CourseUnitEntity;
import com.example.campusvault.data.local.database.entity.FacultyEntity;
import com.example.campusvault.data.local.database.entity.ProgramEntity;
import com.example.campusvault.data.local.database.entity.ResourceEntity;
import com.example.campusvault.data.local.database.entity.UserEntity;

/**
 * Room database for local caching
 */
@Database(
    entities = {
        UserEntity.class,
        ResourceEntity.class,
        FacultyEntity.class,
        ProgramEntity.class,
        CourseUnitEntity.class
    },
    version = 4,
    exportSchema = false
)
@TypeConverters({Converters.class})
public abstract class AppDatabase extends RoomDatabase {

    private static final String DATABASE_NAME = "campusvault_db";
    private static volatile AppDatabase instance;

    public abstract UserDao userDao();
    public abstract ResourceDao resourceDao();
    public abstract UniversityDao universityDao();

    public static AppDatabase getInstance(Context context) {
        if (instance == null) {
            synchronized (AppDatabase.class) {
                if (instance == null) {
                    instance = Room.databaseBuilder(
                        context.getApplicationContext(),
                        AppDatabase.class,
                        DATABASE_NAME
                    )
                    .fallbackToDestructiveMigration()
                    .build();
                }
            }
        }
        return instance;
    }
}
