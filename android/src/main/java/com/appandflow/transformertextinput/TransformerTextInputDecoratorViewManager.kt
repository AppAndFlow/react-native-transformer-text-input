package com.appandflow.transformertextinput

import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.ViewGroupManager
import com.facebook.react.uimanager.ViewManagerDelegate
import com.facebook.react.viewmanagers.TransformerTextInputDecoratorViewManagerDelegate
import com.facebook.react.viewmanagers.TransformerTextInputDecoratorViewManagerInterface

@ReactModule(name = TransformerTextInputDecoratorViewManager.NAME)
class TransformerTextInputDecoratorViewManager :
  ViewGroupManager<TransformerTextInputDecoratorView>(),
  TransformerTextInputDecoratorViewManagerInterface<TransformerTextInputDecoratorView> {
  private val mDelegate: ViewManagerDelegate<TransformerTextInputDecoratorView>

  init {
    mDelegate = TransformerTextInputDecoratorViewManagerDelegate(this)
  }

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

  override fun receiveCommand(
    view: TransformerTextInputDecoratorView,
    commandId: String,
    args: ReadableArray?,
  ) {
    if (commandId == "update" && args != null) {
      val value = if (args.isNull(0)) null else args.getString(0)
      val selectionStart = if (args.isNull(1)) null else args.getInt(1)
      val selectionEnd = if (args.isNull(2)) null else args.getInt(2)
      val transform = !args.isNull(3) && args.getBoolean(3)
      view.update(value, selectionStart, selectionEnd, transform)
      return
    }
    super.receiveCommand(view, commandId, args)
  }

  companion object {
    const val NAME = "TransformerTextInputDecoratorView"
  }
}
