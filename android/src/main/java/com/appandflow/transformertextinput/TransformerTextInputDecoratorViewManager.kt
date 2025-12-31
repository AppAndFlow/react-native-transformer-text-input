package com.appandflow.transformertextinput

import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewGroupManager
import com.facebook.react.uimanager.ViewManagerDelegate
import com.facebook.react.viewmanagers.TransformerTextInputDecoratorViewManagerDelegate
import com.facebook.react.viewmanagers.TransformerTextInputDecoratorViewManagerInterface

@ReactModule(name = TransformerTextInputDecoratorViewManager.NAME)
class TransformerTextInputDecoratorViewManager :
  ViewGroupManager<TransformerTextInputDecoratorView>(),
  TransformerTextInputDecoratorViewManagerInterface<TransformerTextInputDecoratorView> {
  private val mDelegate: ViewManagerDelegate<TransformerTextInputDecoratorView> =
    TransformerTextInputDecoratorViewManagerDelegate(this)

  override fun getDelegate(): ViewManagerDelegate<TransformerTextInputDecoratorView>? = mDelegate

  override fun getName(): String = NAME

  public override fun createViewInstance(context: ThemedReactContext): TransformerTextInputDecoratorView =
    TransformerTextInputDecoratorView(context)

  override fun setTransformerId(
    view: TransformerTextInputDecoratorView?,
    transformerId: Int,
  ) {
    view?.setTransformerId(transformerId)
  }

  override fun update(
    view: TransformerTextInputDecoratorView?,
    transform: Boolean,
    value: String?,
    selectionStart: Int,
    selectionEnd: Int,
  ) {
    view?.update(transform, value, selectionStart, selectionEnd)
  }

  companion object {
    const val NAME = "TransformerTextInputDecoratorView"
  }
}
