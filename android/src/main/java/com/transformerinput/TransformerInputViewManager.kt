package com.transformerinput

import android.graphics.Color
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewManagerDelegate
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.viewmanagers.TransformerInputViewManagerInterface
import com.facebook.react.viewmanagers.TransformerInputViewManagerDelegate

@ReactModule(name = TransformerInputViewManager.NAME)
class TransformerInputViewManager : SimpleViewManager<TransformerInputView>(),
  TransformerInputViewManagerInterface<TransformerInputView> {
  private val mDelegate: ViewManagerDelegate<TransformerInputView>

  init {
    mDelegate = TransformerInputViewManagerDelegate(this)
  }

  override fun getDelegate(): ViewManagerDelegate<TransformerInputView>? {
    return mDelegate
  }

  override fun getName(): String {
    return NAME
  }

  public override fun createViewInstance(context: ThemedReactContext): TransformerInputView {
    return TransformerInputView(context)
  }

  @ReactProp(name = "color")
  override fun setColor(view: TransformerInputView?, color: String?) {
    view?.setBackgroundColor(Color.parseColor(color))
  }

  companion object {
    const val NAME = "TransformerInputView"
  }
}
