package app.silvr.camera;

import android.Manifest;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.media.MediaScannerConnection;
import android.net.Uri;
import android.os.Build;
import android.os.Environment;
import android.provider.MediaStore;
import android.util.Base64;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;

/**
 * Saves a print straight into the gallery (Pictures/SILVR). Android's share
 * sheet has no "Save image" target, so Save must not go through it.
 * Android 10+ uses MediaStore (no permission); 7–9 needs WRITE_EXTERNAL_STORAGE.
 */
@CapacitorPlugin(
    name = "SilvrGallery",
    permissions = { @Permission(strings = { Manifest.permission.WRITE_EXTERNAL_STORAGE }, alias = "storage") }
)
public class GalleryPlugin extends Plugin {

    private static final String ALBUM = "SILVR";

    @PluginMethod
    public void saveImage(PluginCall call) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q && getPermissionState("storage") != PermissionState.GRANTED) {
            requestPermissionForAlias("storage", call, "storageResult");
            return;
        }
        save(call);
    }

    @PermissionCallback
    private void storageResult(PluginCall call) {
        if (getPermissionState("storage") == PermissionState.GRANTED) save(call);
        else call.reject("Storage permission denied", "DENIED");
    }

    private void save(PluginCall call) {
        String data = call.getString("data");
        String name = call.getString("name");
        String mime = call.getString("mime", "image/jpeg");
        if (data == null || name == null) {
            call.reject("data and name are required");
            return;
        }
        try {
            byte[] bytes = Base64.decode(data, Base64.DEFAULT);
            Uri uri = Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q ? saveToMediaStore(bytes, name, mime) : saveToPictures(bytes, name, mime);
            JSObject ret = new JSObject();
            ret.put("uri", uri.toString());
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Could not save the image", e);
        }
    }

    private Uri saveToMediaStore(byte[] bytes, String name, String mime) throws Exception {
        ContentResolver resolver = getContext().getContentResolver();
        ContentValues values = new ContentValues();
        values.put(MediaStore.Images.Media.DISPLAY_NAME, name);
        values.put(MediaStore.Images.Media.MIME_TYPE, mime);
        values.put(MediaStore.Images.Media.RELATIVE_PATH, Environment.DIRECTORY_PICTURES + "/" + ALBUM);
        values.put(MediaStore.Images.Media.IS_PENDING, 1);
        Uri uri = resolver.insert(MediaStore.Images.Media.getContentUri(MediaStore.VOLUME_EXTERNAL_PRIMARY), values);
        if (uri == null) throw new IllegalStateException("MediaStore insert failed");
        try (OutputStream out = resolver.openOutputStream(uri)) {
            if (out == null) throw new IllegalStateException("No output stream for " + uri);
            out.write(bytes);
        } catch (Exception e) {
            resolver.delete(uri, null, null); // no half-written entry in the gallery
            throw e;
        }
        values.clear();
        values.put(MediaStore.Images.Media.IS_PENDING, 0);
        resolver.update(uri, values, null, null);
        return uri;
    }

    @SuppressWarnings("deprecation")
    private Uri saveToPictures(byte[] bytes, String name, String mime) throws Exception {
        File dir = new File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_PICTURES), ALBUM);
        if (!dir.exists() && !dir.mkdirs()) throw new IllegalStateException("Cannot create " + dir);
        // MediaStore renames duplicates on 10+; here two prints taken in the same second would overwrite.
        File file = new File(dir, name);
        int dot = name.lastIndexOf('.');
        String base = dot > 0 ? name.substring(0, dot) : name;
        String ext = dot > 0 ? name.substring(dot) : "";
        for (int n = 1; file.exists(); n++) file = new File(dir, base + " (" + n + ")" + ext);
        try (FileOutputStream out = new FileOutputStream(file)) {
            out.write(bytes);
        }
        MediaScannerConnection.scanFile(getContext(), new String[] { file.getAbsolutePath() }, new String[] { mime }, null);
        return Uri.fromFile(file);
    }
}
