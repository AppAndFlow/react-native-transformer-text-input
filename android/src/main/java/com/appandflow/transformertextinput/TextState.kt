package com.appandflow.transformertextinput

import com.facebook.proguard.annotations.DoNotStripAny

@DoNotStripAny
data class TextSelection(
  val start: Int,
  val end: Int,
)

@DoNotStripAny
data class TextState(
  val value: String,
  val selection: TextSelection,
)
