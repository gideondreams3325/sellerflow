package com.sellerflow.app;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "NativeGoogleAuth")
public class NativeGoogleAuthPlugin extends Plugin {

    @PluginMethod
    public void signIn(PluginCall call) {
        String serverClientId = call.getString("serverClientId", "");
        JSObject ret = new JSObject();
        ret.put("idToken", "");
        ret.put("serverClientId", serverClientId);
        call.reject("Google Sign-In is not configured on this device. Please sign in with email and password.");
    }

    @PluginMethod
    public void signOut(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("success", true);
        call.resolve(ret);
    }
}
