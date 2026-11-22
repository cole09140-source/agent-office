package app.silvr.camera;

import android.util.Log;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Volume keys as the shutter, like a real camera's side button. The web app turns this on only while
 * the camera screen is up (and the setting is on); MainActivity then keeps the key from changing the
 * volume and hands one press to JS as a "volumeShutter" event. Everywhere else the keys stay volume keys.
 */
@CapacitorPlugin(name = "SilvrKeys")
public class KeysPlugin extends Plugin {

    private static volatile boolean enabled = false;
    private static KeysPlugin instance;

    @Override
    public void load() {
        instance = this;
    }

    @PluginMethod
    public void setVolumeShutter(PluginCall call) {
        enabled = Boolean.TRUE.equals(call.getBoolean("enabled", false));
        Log.d("SilvrKeys", "volume shutter " + (enabled ? "on" : "off"));
        call.resolve();
    }

    /** Whether MainActivity should take the volume keys right now. */
    static boolean active() {
        return enabled && instance != null;
    }

    /** One press (key down, not auto-repeat): tell the web app which key it was. */
    static void press(String key) {
        KeysPlugin p = instance;
        if (p == null) return;
        Log.d("SilvrKeys", "press " + key);
        JSObject data = new JSObject();
        data.put("key", key);
        p.notifyListeners("volumeShutter", data);
    }

    // No reset on pause: a backgrounded activity gets no key events anyway, and the WebView does not tell
    // the page when it comes back (e.g. from the camera permission dialog), so it could not re-enable.
}
