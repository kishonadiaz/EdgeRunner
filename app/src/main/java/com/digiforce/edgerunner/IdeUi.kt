package com.digiforce.edgerunner

import android.webkit.WebView
import android.graphics.Color
import android.os.Handler
import android.os.Looper
import com.meta.spatial.core.Entity
import com.meta.spatial.core.Pose
import com.meta.spatial.core.Quaternion
import com.meta.spatial.core.Vector2
import com.meta.spatial.core.Vector3
import com.meta.spatial.isdk.IsdkCurvedPanel
import com.meta.spatial.runtime.PanelShapeLayerBlendType
import com.meta.spatial.toolkit.Named
import com.meta.spatial.toolkit.PanelDimensions
import com.meta.spatial.toolkit.PanelRegistration
import com.meta.spatial.toolkit.SpatialActivityManager
import com.meta.spatial.toolkit.Transform
import com.meta.spatial.toolkit.createPanelEntity
import kotlin.inc
import kotlin.random.Random

class IdeUi {
    var panel: Entity = Entity.nullEntity()
    var created = false;



    var isset = false;
    constructor(counter:Int) {
        if(created) return
        val activity = SpatialActivityManager.getVrActivity<ImmersiveActivity>()
        var panelId = Random.nextInt()


        panel = Entity.createPanelEntity(panelId,
            Transform(Pose(Vector3(0f,0f,0f), Quaternion(0f,-180f,0f))),
            IsdkCurvedPanel(.1f),
            PanelDimensions(Vector2(.9f,.6f)),
            Named("DevPanel${counter}")
        )

        activity.registerPanel(
            PanelRegistration(panelId){
                config {
//                    width = 0.9f
//                    height = 0.6f
                    layoutWidthInPx = 1920
                    layoutWidthInPx = 1080
                    enableTransparent = true
                    themeResourceId = R.style.PanelAppThemeTransparent
                    layerBlendType = PanelShapeLayerBlendType.ALPHA_BLEND
                }
                view {
                    ctx->
                    WebView(ctx).apply {
                        settings.apply {
                            loadWithOverviewMode = true
                            useWideViewPort = true
                            setSupportZoom(false)
                            textZoom = 100
                            javaScriptEnabled = true
                            javaScriptCanOpenWindowsAutomatically = true

                        }
                        setBackgroundColor(Color.TRANSPARENT)
                        webViewClient = LocalContentWebviewClient(activity.assetLoader)
                        loadUrl("https://myapp.local/assets/ideui/ide.html")
                    }
                }
            }
        )
        created = true;

    }

    public fun update(head: Entity){
        val activity = SpatialActivityManager.getVrActivity<ImmersiveActivity>()
        if(!created) return
        if(isset) return
        val headset = head?:return
        var headpose = headset.tryGetComponent<Transform>()?:return
        var headpos = headpose.transform
        var forward = headpos.q * Vector3(0f,0f, 1f)
        var up = headpos.q * Vector3(0f,1f,0f)
        var panelDistance =  .5f
        var paneHeightOffset =  0.2f
        var panelPosition = headpos.t+ forward * panelDistance + up * paneHeightOffset
        var panelRotation = Quaternion.lookRotationAroundY(forward)
        var panelPose = Pose(panelPosition,panelRotation)

        panel.setComponent(Transform(panelPose!!))
        Handler.createAsync(Looper.getMainLooper()).postDelayed({
            isset = true;
        },1000)



    }
}