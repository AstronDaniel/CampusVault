package com.example.campusvault.ui.main.settings;

import android.os.Bundle;
import androidx.preference.PreferenceFragmentCompat;
import com.example.campusvault.R;

public class SettingsFragment extends PreferenceFragmentCompat {

    @Override
    public void onCreatePreferences(Bundle savedInstanceState, String rootKey) {
        setPreferencesFromResource(R.xml.preferences, rootKey);
    }
}
