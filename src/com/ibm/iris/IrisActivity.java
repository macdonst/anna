package com.ibm.iris;

import com.phonegap.DroidGap;

import android.os.Bundle;

public class IrisActivity extends DroidGap {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        super.init();
        super.loadUrl("file:///android_asset/www/index.html");
    }
}