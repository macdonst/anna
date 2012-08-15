package com.simonmacdonald.iris;

import org.apache.cordova.DroidGap;

import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.os.Bundle;
import android.util.Log;
import android.view.Menu;
import android.view.MenuInflater;
import android.view.MenuItem;

public class IrisActivity extends DroidGap {
    private static final String COM_SIMONMACDONALD_IRIS_QUICK_PREFS_ACTIVITY = "com.simonmacdonald.iris.QuickPrefsActivity";
    private static final String LOG_TAG = "Iris";
    private static final String NO_PREFERENCE_ACTIVITY = null;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        super.init();
        if(android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.GINGERBREAD)
            this.appView.setOverScrollMode(appView.OVER_SCROLL_NEVER);
        super.loadUrl("file:///android_asset/www/index.html");
    }

    @Override
    public boolean onCreateOptionsMenu(Menu menu) {
        MenuInflater inflater = getMenuInflater();
        inflater.inflate(R.menu.iris_menu, menu);
        return true;
    }

    @Override
    public boolean onOptionsItemSelected(MenuItem item) {
        // Handle item selection
        switch (item.getItemId()) {
        case R.id.settings:
            String activityName = COM_SIMONMACDONALD_IRIS_QUICK_PREFS_ACTIVITY;
            Intent intent = new Intent(Intent.ACTION_VIEW);
            intent.setClassName(this.getContext(), activityName);
            this.startActivity(intent);
            return true;
        default:
            return super.onOptionsItemSelected(item);
        }
    }
}