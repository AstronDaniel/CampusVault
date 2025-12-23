package com.example.campusvault.ui.onboarding;

/**
 * Model class for onboarding page data
 */
public class OnboardingPage {
    private final String title;
    private final String description;
    private final int animationRes;

    public OnboardingPage(String title, String description, int animationRes) {
        this.title = title;
        this.description = description;
        this.animationRes = animationRes;
    }

    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
    }

    public int getAnimationRes() {
        return animationRes;
    }
}
