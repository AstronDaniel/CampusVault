package com.example.campusvault.utils;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;

import okhttp3.MediaType;
import okhttp3.RequestBody;
import okio.BufferedSink;

/**
 * RequestBody wrapper that streams a file while reporting upload progress and throughput.
 */
public class ProgressRequestBody extends RequestBody {

    public interface UploadProgressListener {
        void onProgress(int percentage, double kbPerSecond);
    }

    private static final int DEFAULT_BUFFER_SIZE = 2048;

    private final File file;
    private final String contentType;
    private final UploadProgressListener listener;

    public ProgressRequestBody(File file, String contentType, UploadProgressListener listener) {
        this.file = file;
        this.contentType = contentType;
        this.listener = listener;
    }

    @Override
    public MediaType contentType() {
        return MediaType.parse(contentType);
    }

    @Override
    public long contentLength() throws IOException {
        return file.length();
    }

    @Override
    public void writeTo(BufferedSink sink) throws IOException {
        long fileLength = contentLength();
        byte[] buffer = new byte[DEFAULT_BUFFER_SIZE];
        long uploaded = 0L;
        long start = System.nanoTime();

        try (InputStream input = new FileInputStream(file)) {
            int read;
            while ((read = input.read(buffer)) != -1) {
                uploaded += read;
                sink.write(buffer, 0, read);
                emitProgress(uploaded, fileLength, start);
            }
        }
    }

    private void emitProgress(long uploaded, long total, long startNs) {
        if (listener == null || total <= 0) {
            return;
        }
        int progress = (int) ((100 * uploaded) / total);
        double elapsedSeconds = (System.nanoTime() - startNs) / 1_000_000_000.0;
        double kbPerSecond = elapsedSeconds > 0 ? (uploaded / 1024.0) / elapsedSeconds : 0;
        listener.onProgress(progress, kbPerSecond);
    }
}
