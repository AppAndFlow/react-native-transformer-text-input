package com.appandflow.transformertextinput

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.annotations.ReactModule
import com.swmansion.worklets.WorkletsModule

@ReactModule(name = TransformerTextInputModule.NAME)
class TransformerTextInputModule(
  reactContext: ReactApplicationContext,
) : NativeTransformerTextInputModuleSpec(reactContext) {
  override fun install(): Boolean {
    val workletsModule = reactApplicationContext.getNativeModule(WorkletsModule::class.java)
    if (workletsModule != null) {
      TransformerTextInputJni.setWorkletsModule(workletsModule)
    }
    return true
  }

  companion object {
    const val NAME: String = NativeTransformerTextInputModuleSpec.NAME
  }
}
