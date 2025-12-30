package com.appandflow.transformertextinput

import com.facebook.proguard.annotations.DoNotStripAny

@DoNotStripAny
data class TransformResult(
  val value: String,
  val hasSelection: Boolean,
  val selectionStart: Int,
  val selectionEnd: Int
)
