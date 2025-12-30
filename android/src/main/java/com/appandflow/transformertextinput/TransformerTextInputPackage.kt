package com.appandflow.transformertextinput

import com.facebook.react.BaseReactPackage
import com.facebook.react.ReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.module.annotations.ReactModuleList
import com.facebook.react.module.model.ReactModuleInfo
import com.facebook.react.module.model.ReactModuleInfoProvider
import com.facebook.react.uimanager.ViewManager
import java.util.ArrayList
import java.util.HashMap

@ReactModuleList(nativeModules = [TransformerTextInputModule::class])
class TransformerTextInputPackage : BaseReactPackage(), ReactPackage {
  override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? {
    return if (name == TransformerTextInputModule.NAME) {
      TransformerTextInputModule(reactContext)
    } else {
      null
    }
  }

  override fun getReactModuleInfoProvider(): ReactModuleInfoProvider {
    val moduleList = arrayOf(TransformerTextInputModule::class.java)
    val reactModuleInfoMap: MutableMap<String, ReactModuleInfo> = HashMap()
    for (moduleClass in moduleList) {
      val reactModule = moduleClass.getAnnotation(ReactModule::class.java) ?: continue
      reactModuleInfoMap[reactModule.name] =
          ReactModuleInfo(
              reactModule.name,
              moduleClass.name,
              reactModule.canOverrideExistingModule,
              reactModule.needsEagerInit,
              reactModule.isCxxModule,
              true
          )
    }

    return ReactModuleInfoProvider { reactModuleInfoMap }
  }

  override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> {
    val viewManagers: MutableList<ViewManager<*, *>> = ArrayList()
    viewManagers.add(TransformerTextInputDecoratorViewManager())
    return viewManagers
  }
}
