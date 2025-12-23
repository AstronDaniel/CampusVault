package com.example.campusvault.utils;

import android.animation.Animator;
import android.animation.AnimatorListenerAdapter;
import android.animation.ObjectAnimator;
import android.view.View;
import android.view.animation.AccelerateDecelerateInterpolator;

/**
 * Utility class for reusable animation helpers
 */
public class ViewAnimationUtils {

    private static final int DEFAULT_DURATION = 300;
    private static final int FAST_DURATION = 150;
    private static final int SLOW_DURATION = 500;

    /**
     * Fade in animation
     */
    public static void fadeIn(View view) {
        fadeIn(view, DEFAULT_DURATION, null);
    }

    public static void fadeIn(View view, int duration, Runnable onComplete) {
        view.setAlpha(0f);
        view.setVisibility(View.VISIBLE);
        view.animate()
            .alpha(1f)
            .setDuration(duration)
            .setListener(new AnimatorListenerAdapter() {
                @Override
                public void onAnimationEnd(Animator animation) {
                    if (onComplete != null) {
                        onComplete.run();
                    }
                }
            });
    }

    /**
     * Fade out animation
     */
    public static void fadeOut(View view) {
        fadeOut(view, DEFAULT_DURATION, null);
    }

    public static void fadeOut(View view, int duration, Runnable onComplete) {
        view.animate()
            .alpha(0f)
            .setDuration(duration)
            .setListener(new AnimatorListenerAdapter() {
                @Override
                public void onAnimationEnd(Animator animation) {
                    view.setVisibility(View.GONE);
                    if (onComplete != null) {
                        onComplete.run();
                    }
                }
            });
    }

    /**
     * Slide up animation
     */
    public static void slideUp(View view) {
        slideUp(view, DEFAULT_DURATION, null);
    }

    public static void slideUp(View view, int duration, Runnable onComplete) {
        view.setVisibility(View.VISIBLE);
        view.setTranslationY(view.getHeight());
        view.animate()
            .translationY(0)
            .setDuration(duration)
            .setInterpolator(new AccelerateDecelerateInterpolator())
            .setListener(new AnimatorListenerAdapter() {
                @Override
                public void onAnimationEnd(Animator animation) {
                    if (onComplete != null) {
                        onComplete.run();
                    }
                }
            });
    }

    /**
     * Slide down animation
     */
    public static void slideDown(View view) {
        slideDown(view, DEFAULT_DURATION, null);
    }

    public static void slideDown(View view, int duration, Runnable onComplete) {
        view.animate()
            .translationY(view.getHeight())
            .setDuration(duration)
            .setInterpolator(new AccelerateDecelerateInterpolator())
            .setListener(new AnimatorListenerAdapter() {
                @Override
                public void onAnimationEnd(Animator animation) {
                    view.setVisibility(View.GONE);
                    view.setTranslationY(0);
                    if (onComplete != null) {
                        onComplete.run();
                    }
                }
            });
    }

    /**
     * Scale animation (zoom in/out)
     */
    public static void scaleIn(View view) {
        view.setScaleX(0f);
        view.setScaleY(0f);
        view.setVisibility(View.VISIBLE);
        view.animate()
            .scaleX(1f)
            .scaleY(1f)
            .setDuration(DEFAULT_DURATION)
            .setInterpolator(new AccelerateDecelerateInterpolator());
    }

    public static void scaleOut(View view) {
        view.animate()
            .scaleX(0f)
            .scaleY(0f)
            .setDuration(DEFAULT_DURATION)
            .setInterpolator(new AccelerateDecelerateInterpolator())
            .setListener(new AnimatorListenerAdapter() {
                @Override
                public void onAnimationEnd(Animator animation) {
                    view.setVisibility(View.GONE);
                    view.setScaleX(1f);
                    view.setScaleY(1f);
                }
            });
    }

    /**
     * Shake animation for error states
     */
    public static void shake(View view) {
        ObjectAnimator animator = ObjectAnimator.ofFloat(view, "translationX", 
            0, 25, -25, 25, -25, 15, -15, 6, -6, 0);
        animator.setDuration(500);
        animator.start();
    }

    /**
     * Rotate animation
     */
    public static void rotate(View view, float fromDegrees, float toDegrees) {
        view.animate()
            .rotation(toDegrees)
            .setDuration(DEFAULT_DURATION)
            .setInterpolator(new AccelerateDecelerateInterpolator());
    }

    /**
     * Pulse animation (scale up and down)
     */
    public static void pulse(View view) {
        view.animate()
            .scaleX(1.1f)
            .scaleY(1.1f)
            .setDuration(FAST_DURATION)
            .setListener(new AnimatorListenerAdapter() {
                @Override
                public void onAnimationEnd(Animator animation) {
                    view.animate()
                        .scaleX(1f)
                        .scaleY(1f)
                        .setDuration(FAST_DURATION);
                }
            });
    }

    /**
     * Crossfade between two views
     */
    public static void crossfade(View viewOut, View viewIn) {
        viewIn.setAlpha(0f);
        viewIn.setVisibility(View.VISIBLE);

        viewIn.animate()
            .alpha(1f)
            .setDuration(DEFAULT_DURATION);

        viewOut.animate()
            .alpha(0f)
            .setDuration(DEFAULT_DURATION)
            .setListener(new AnimatorListenerAdapter() {
                @Override
                public void onAnimationEnd(Animator animation) {
                    viewOut.setVisibility(View.GONE);
                    viewOut.setAlpha(1f);
                }
            });
    }

    /**
     * Staggered animation for list items
     */
    public static void staggeredFadeIn(View view, int position, int delayPerItem) {
        view.setAlpha(0f);
        view.setTranslationY(50f);
        view.animate()
            .alpha(1f)
            .translationY(0f)
            .setStartDelay(position * delayPerItem)
            .setDuration(DEFAULT_DURATION)
            .setInterpolator(new AccelerateDecelerateInterpolator());
    }
}
