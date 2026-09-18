package com.digiforce.edgerunner

import android.webkit.WebResourceRequest
import android.webkit.WebResourceResponse
import android.webkit.WebView
import androidx.core.net.toUri
import androidx.webkit.WebViewAssetLoader
import androidx.webkit.WebViewClientCompat

class LocalContentWebviewClient(private  val assetLoader: WebViewAssetLoader): WebViewClientCompat() {

    override fun shouldInterceptRequest(
        view: WebView?,
        request: WebResourceRequest
    ): WebResourceResponse? {
        return assetLoader.shouldInterceptRequest(request.url)
    }

    override fun shouldInterceptRequest(view: WebView?, url: String): WebResourceResponse? {
        return assetLoader.shouldInterceptRequest(url.toUri())
    }
}