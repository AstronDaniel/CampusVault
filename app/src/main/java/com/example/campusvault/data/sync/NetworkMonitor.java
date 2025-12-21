package com.example.campusvault.data.sync;

import android.content.Context;
import android.net.ConnectivityManager;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.net.NetworkRequest;
import androidx.annotation.NonNull;
import androidx.lifecycle.LiveData;
import androidx.lifecycle.MutableLiveData;

/**
 * Monitors network connectivity state for offline-first functionality.
 * Provides reactive network status updates.
 */
public class NetworkMonitor {

    private static volatile NetworkMonitor instance;
    private final ConnectivityManager connectivityManager;
    private final MutableLiveData<Boolean> isOnline = new MutableLiveData<>(false);
    private final MutableLiveData<NetworkState> networkState = new MutableLiveData<>(NetworkState.UNKNOWN);
    
    private ConnectivityManager.NetworkCallback networkCallback;

    public enum NetworkState {
        WIFI,
        CELLULAR,
        OFFLINE,
        UNKNOWN
    }

    private NetworkMonitor(Context context) {
        this.connectivityManager = (ConnectivityManager) 
            context.getApplicationContext().getSystemService(Context.CONNECTIVITY_SERVICE);
        
        // Check initial state
        updateNetworkState();
        
        // Register callback for changes
        registerNetworkCallback();
    }

    public static NetworkMonitor getInstance(Context context) {
        if (instance == null) {
            synchronized (NetworkMonitor.class) {
                if (instance == null) {
                    instance = new NetworkMonitor(context);
                }
            }
        }
        return instance;
    }

    /**
     * Check if device is currently online.
     * Uses direct system check for reliability.
     */
    public boolean isOnline() {
        // Direct synchronous check for reliability
        return checkNetworkDirectly();
    }
    
    /**
     * Direct synchronous network check
     */
    private boolean checkNetworkDirectly() {
        if (connectivityManager == null) {
            return false;
        }
        
        Network network = connectivityManager.getActiveNetwork();
        if (network == null) {
            return false;
        }
        
        NetworkCapabilities capabilities = connectivityManager.getNetworkCapabilities(network);
        if (capabilities == null) {
            return false;
        }
        
        return capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET) &&
               capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED);
    }

    /**
     * Get LiveData for online status (reactive)
     */
    public LiveData<Boolean> isOnlineLive() {
        return isOnline;
    }

    /**
     * Get current network state
     */
    public NetworkState getNetworkState() {
        NetworkState state = networkState.getValue();
        return state != null ? state : NetworkState.UNKNOWN;
    }

    /**
     * Get LiveData for network state (reactive)
     */
    public LiveData<NetworkState> getNetworkStateLive() {
        return networkState;
    }

    /**
     * Check if connected to unmetered network (WiFi)
     */
    public boolean isUnmetered() {
        return getNetworkState() == NetworkState.WIFI;
    }

    private void updateNetworkState() {
        if (connectivityManager == null) {
            isOnline.postValue(false);
            networkState.postValue(NetworkState.UNKNOWN);
            return;
        }

        Network network = connectivityManager.getActiveNetwork();
        if (network == null) {
            isOnline.postValue(false);
            networkState.postValue(NetworkState.OFFLINE);
            return;
        }

        NetworkCapabilities capabilities = connectivityManager.getNetworkCapabilities(network);
        if (capabilities == null) {
            isOnline.postValue(false);
            networkState.postValue(NetworkState.OFFLINE);
            return;
        }

        boolean hasInternet = capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET) &&
                              capabilities.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED);
        
        isOnline.postValue(hasInternet);

        if (!hasInternet) {
            networkState.postValue(NetworkState.OFFLINE);
        } else if (capabilities.hasTransport(NetworkCapabilities.TRANSPORT_WIFI)) {
            networkState.postValue(NetworkState.WIFI);
        } else if (capabilities.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR)) {
            networkState.postValue(NetworkState.CELLULAR);
        } else {
            networkState.postValue(NetworkState.UNKNOWN);
        }
    }

    private void registerNetworkCallback() {
        if (connectivityManager == null) return;

        NetworkRequest request = new NetworkRequest.Builder()
            .addCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
            .build();

        networkCallback = new ConnectivityManager.NetworkCallback() {
            @Override
            public void onAvailable(@NonNull Network network) {
                updateNetworkState();
            }

            @Override
            public void onLost(@NonNull Network network) {
                updateNetworkState();
            }

            @Override
            public void onCapabilitiesChanged(@NonNull Network network, 
                                              @NonNull NetworkCapabilities capabilities) {
                updateNetworkState();
            }
        };

        connectivityManager.registerNetworkCallback(request, networkCallback);
    }

    /**
     * Unregister callback when no longer needed
     */
    public void unregister() {
        if (connectivityManager != null && networkCallback != null) {
            connectivityManager.unregisterNetworkCallback(networkCallback);
        }
    }
}
