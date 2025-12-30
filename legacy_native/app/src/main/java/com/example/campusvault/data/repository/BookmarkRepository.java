package com.example.campusvault.data.repository;

import android.app.Application;
import androidx.lifecycle.LiveData;
import com.example.campusvault.data.local.AppDatabase;
import com.example.campusvault.data.local.dao.BookmarkDao;
import com.example.campusvault.data.models.Bookmark;
import com.example.campusvault.data.models.Resource;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class BookmarkRepository {
    private final BookmarkDao bookmarkDao;
    private final ExecutorService executorService;

    public BookmarkRepository(Application application) {
        AppDatabase db = AppDatabase.getDatabase(application);
        bookmarkDao = db.bookmarkDao();
        executorService = Executors.newSingleThreadExecutor();
    }

    public LiveData<List<Bookmark>> getAllBookmarks() {
        return bookmarkDao.getAllBookmarks();
    }

    public LiveData<Boolean> isBookmarked(int resourceId) {
        return bookmarkDao.isBookmarked(resourceId);
    }

    public void insert(int resourceId) {
        executorService.execute(() -> bookmarkDao.insert(new Bookmark(resourceId)));
    }

    public void delete(int resourceId) {
        executorService.execute(() -> bookmarkDao.delete(resourceId));
    }
}
