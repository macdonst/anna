package com.simonmacdonald.anna;

import android.os.Bundle;
import android.preference.PreferenceActivity;
import com.simonmacdonald.anna.R;

public class QuickPrefsActivity extends PreferenceActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        addPreferencesFromResource(R.xml.preferences);
    }
}
