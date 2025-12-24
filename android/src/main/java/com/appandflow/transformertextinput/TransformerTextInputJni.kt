package com.appandflow.transformertextinput

import com.facebook.soloader.SoLoader
import com.swmansion.worklets.WorkletsModule

object TransformerTextInputJni {
  init {
    SoLoader.loadLibrary("transformerinput")
  }

  @JvmStatic
  external fun setWorkletsModule(workletsModule: WorkletsModule)

  @JvmStatic
  external fun transform(
    transformerId: Int,
    value: String,
    selectionStart: Int,
    selectionEnd: Int
  ): TransformResult?
}
