package com.appandflow.transformertextinput

import android.graphics.Color
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewManagerDelegate
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.viewmanagers.TransformerTextInputDecoratorViewManagerInterface
import com.facebook.react.viewmanagers.TransformerTextInputDecoratorViewManagerDelegate

@ReactModule(name = TransformerTextInputDecoratorViewManager.NAME)
class TransformerTextInputDecoratorViewManager : SimpleViewManager<TransformerTextInputDecoratorView>(),
  TransformerTextInputDecoratorViewManagerInterface<TransformerTextInputDecoratorView> {
  private val mDelegate: ViewManagerDelegate<TransformerTextInputDecoratorView>

  init {
    mDelegate = TransformerTextInputDecoratorViewManagerDelegate(this)
  }

  override fun getDelegate(): ViewManagerDelegate<TransformerTextInputDecoratorView>? {
    return mDelegate
  }

  override fun getName(): String {
    return NAME
  }

  public override fun createViewInstance(context: ThemedReactContext): TransformerTextInputDecoratorView {
    return TransformerTextInputDecoratorView(context)
  }

  override fun setTransformerId(view: TransformerTextInputDecoratorView?, transformerId: Int) {
    view?.setTransformerId(transformerId)
  }

  companion object {
    const val NAME = "TransformerTextInputDecoratorView"
  }
}
