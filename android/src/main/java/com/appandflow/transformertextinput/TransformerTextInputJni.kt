package com.appandflow.transformertextinput

import com.facebook.proguard.annotations.DoNotStrip
import com.facebook.soloader.SoLoader
import com.swmansion.worklets.WorkletsModule

@DoNotStrip
object TransformerTextInputJni {
  init {
    SoLoader.loadLibrary("react_codegen_rntti")
  }

  @DoNotStrip
  @JvmStatic
  external fun setWorkletsModule(workletsModule: WorkletsModule)

  @DoNotStrip
  @JvmStatic
  external fun transform(
    transformerId: Int,
    value: String,
    selectionStart: Int,
    selectionEnd: Int
  ): TransformResult?
}
