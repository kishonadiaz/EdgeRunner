package com.digiforce.edgerunner

import com.meta.spatial.core.Entity
import com.meta.spatial.core.Pose
import com.meta.spatial.core.Quaternion
import com.meta.spatial.core.SystemBase
import com.meta.spatial.core.Vector3
import com.meta.spatial.isdk.IsdkCurvedPanel
import com.meta.spatial.toolkit.Named
import com.meta.spatial.toolkit.PlayerBodyAttachmentSystem
import com.meta.spatial.toolkit.SpatialActivityManager
import com.meta.spatial.toolkit.Transform
import com.meta.spatial.toolkit.createPanelEntity
import kotlin.random.Random

class IdeUiSystemBase() : SystemBase() {


    companion object{
        var counter:Int = 0;
    }
    var devpanels: MutableList<IdeUi> = mutableListOf()
    fun create(){

        devpanels.add(IdeUi(counter))
        counter++

    }

    fun updates(){
        for (i in devpanels){
            var headset = getHmd()?:continue
            i.update(headset)
        }
    }

    override fun execute() {
        val activity = SpatialActivityManager.getVrActivity<ImmersiveActivity>()
        if(!activity.glfxloaded) return
        updates()
    }

    private fun getHmd(): Entity? {
        return systemManager
            .tryFindSystem<PlayerBodyAttachmentSystem>()
            ?.tryGetLocalPlayerAvatarBody()
            ?.head
    }
}