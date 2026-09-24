package com.sellerflow.app;

import android.content.Intent;
import android.util.Log;
import androidx.activity.result.ActivityResult;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.gms.auth.api.signin.GoogleSignIn;
import com.google.android.gms.auth.api.signin.GoogleSignInAccount;
import com.google.android.gms.auth.api.signin.GoogleSignInClient;
import com.google.android.gms.auth.api.signin.GoogleSignInOptions;
import com.google.android.gms.common.api.ApiException;
import com.google.android.gms.tasks.Task;

@CapacitorPlugin(name = "NativeGoogleAuth")
public class NativeGoogleAuthPlugin extends Plugin {
    private static final String TAG = "NativeGoogleAuth";
    private static final String DEFAULT_SERVER_CLIENT_ID = "987175352360-1gqsf0pejqvgv9gng1pnk7n39jsgdfn1.apps.googleusercontent.com";
    private GoogleSignInClient googleSignInClient;

    @PluginMethod
    public void isAvailable(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("available", true);
        call.resolve(ret);
    }

    @PluginMethod
    public void signIn(PluginCall call) {
        try {
            String serverClientId = call.getString("serverClientId");
            if (serverClientId == null || serverClientId.trim().isEmpty()) {
                try {
                    int resId = getContext().getResources().getIdentifier("default_web_client_id", "string", getContext().getPackageName());
                    if (resId != 0) {
                        serverClientId = getContext().getString(resId);
                    }
                } catch (Exception ignored) {}
            }
            if (serverClientId == null || serverClientId.trim().isEmpty()) {
                serverClientId = DEFAULT_SERVER_CLIENT_ID;
            }

            GoogleSignInOptions gso = new GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
                    .requestIdToken(serverClientId)
                    .requestEmail()
                    .requestProfile()
                    .build();

            googleSignInClient = GoogleSignIn.getClient(getActivity(), gso);

            // Sign out of previous client session to ensure account chooser is displayed when user requests sign-in
            googleSignInClient.signOut().addOnCompleteListener(task -> {
                Intent signInIntent = googleSignInClient.getSignInIntent();
                startActivityForResult(call, signInIntent, "handleSignInResult");
            });
        } catch (Exception e) {
            Log.e(TAG, "Native Google Sign-In initialization failed", e);
            call.reject("Failed to initialize Google Sign-In: " + e.getMessage(), e);
        }
    }

    @ActivityCallback
    private void handleSignInResult(PluginCall call, ActivityResult result) {
        if (call == null) {
            Log.w(TAG, "PluginCall is null in handleSignInResult");
            return;
        }

        try {
            Intent data = result.getData();
            Task<GoogleSignInAccount> task = GoogleSignIn.getSignedInAccountFromIntent(data);
            GoogleSignInAccount account = task.getResult(ApiException.class);

            if (account != null) {
                JSObject ret = new JSObject();
                ret.put("idToken", account.getIdToken());
                ret.put("email", account.getEmail());
                ret.put("displayName", account.getDisplayName());
                ret.put("photoUrl", account.getPhotoUrl() != null ? account.getPhotoUrl().toString() : "");
                ret.put("id", account.getId());
                ret.put("serverAuthCode", account.getServerAuthCode());
                call.resolve(ret);
            } else {
                call.reject("Google Sign-In returned empty account");
            }
        } catch (ApiException e) {
            int statusCode = e.getStatusCode();
            Log.e(TAG, "Google Sign-In failed with status code: " + statusCode, e);
            if (statusCode == 12501) {
                call.reject("User cancelled Google Sign-In", "USER_CANCELLED", e);
            } else if (statusCode == 12500) {
                call.reject("Google Sign-In configuration error (12500). Debug SHA-1 must be registered in Firebase Console.", "CONFIG_ERROR", e);
            } else if (statusCode == 10) {
                String pkg = getContext().getPackageName();
                call.reject("Google Sign-In failed (status 10 - DEVELOPER_ERROR): Package " + pkg + " and its signing SHA-1 (E6:52:4A:E3:8D:62:85:A1:4D:EC:73:C0:D4:9B:A7:28:5F:6D:64:2F) must be registered in Firebase Console under project sellerflow-efaab.", "DEVELOPER_ERROR", e);
            } else {
                call.reject("Google Sign-In failed (status " + statusCode + "): " + e.getMessage(), String.valueOf(statusCode), e);
            }
        } catch (Exception ex) {
            Log.e(TAG, "Unexpected error in handleSignInResult", ex);
            call.reject("Authentication failed: " + ex.getMessage(), ex);
        }
    }

    @PluginMethod
    public void signOut(PluginCall call) {
        try {
            if (googleSignInClient == null) {
                GoogleSignInOptions gso = new GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
                        .requestIdToken(DEFAULT_SERVER_CLIENT_ID)
                        .requestEmail()
                        .build();
                googleSignInClient = GoogleSignIn.getClient(getContext(), gso);
            }
            googleSignInClient.signOut().addOnCompleteListener(task -> {
                JSObject ret = new JSObject();
                ret.put("success", true);
                call.resolve(ret);
            });
        } catch (Exception e) {
            JSObject ret = new JSObject();
            ret.put("success", true);
            call.resolve(ret);
        }
    }
}
