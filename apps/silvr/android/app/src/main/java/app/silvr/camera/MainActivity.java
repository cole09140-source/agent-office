package app.silvr.camera;

import android.os.Bundle;
import android.view.KeyEvent;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // App-local plugins must be registered before the bridge starts.
        registerPlugin(GalleryPlugin.class);
        registerPlugin(KeysPlugin.class);
        super.onCreate(savedInstanceState);
    }

    /** Volume up / down take a photo while the camera screen asks for it (KeysPlugin); otherwise they set the volume. */
    @Override
    public boolean dispatchKeyEvent(KeyEvent event) {
        int code = event.getKeyCode();
        if ((code == KeyEvent.KEYCODE_VOLUME_UP || code == KeyEvent.KEYCODE_VOLUME_DOWN) && KeysPlugin.active()) {
            if (event.getAction() == KeyEvent.ACTION_DOWN && event.getRepeatCount() == 0) {
                KeysPlugin.press(code == KeyEvent.KEYCODE_VOLUME_UP ? "up" : "down");
            }
            return true; // down, repeats and up: none of them reach the volume panel
        }
        return super.dispatchKeyEvent(event);
    }
}
