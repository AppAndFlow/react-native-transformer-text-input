package com.appandflow.transformertextinput

import android.content.Context
import android.text.Editable
import android.text.TextWatcher
import android.view.View
import android.view.ViewGroup
import androidx.lifecycle.findViewTreeLifecycleOwner
import androidx.lifecycle.lifecycleScope
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.views.textinput.ReactEditText
import com.facebook.react.views.view.ReactViewGroup
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.MainScope
import kotlinx.coroutines.coroutineScope
import kotlinx.coroutines.launch


class TransformerTextInputDecoratorView(context: Context) : ReactViewGroup(context), TextWatcher {
  private var transformerId: Int = 0
  private var lastEventValue: String? = null
  private var resetLastEventValueJob: Job? = null
  private var reactEditText: ReactEditText? = null
  private var isUpdating = false

  fun setTransformerId(newTransformerId: Int) {
    transformerId = newTransformerId
    lastEventValue = null
  }

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()

    val child = getChildAt(0)
    if (child is ReactEditText) {
      reactEditText = child
      reactEditText?.addTextChangedListener(this)
    }
  }

  override fun onDetachedFromWindow() {
    super.onDetachedFromWindow()
      reactEditText?.removeTextChangedListener(this)
      reactEditText = null
  }

  override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {
    // noop
  }

  override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {
    // noop
  }

  override fun afterTextChanged(s: Editable?) {
    if (isUpdating) {
      return
    }

    val editValue = s?.toString() ?: ""

    // For some reason, text change events are dispatched multiple times with the same value, which
    // causes issue with how we track previous values. To avoid this and match iOS behavior we ignore
    // events in the same frame that have the same text value.
    if (lastEventValue == editValue) {
      return
    }
    lastEventValue = editValue
    resetLastEventValueJob?.cancel()
    resetLastEventValueJob = MainScope().launch(Dispatchers.Main) {
      lastEventValue = null
      resetLastEventValueJob = null
    }

    val input = reactEditText ?: return
    val selectionStart = input.selectionStart.coerceAtLeast(0)
    val selectionEnd = input.selectionEnd.coerceAtLeast(0)
    val result = TransformerTextInputJni.transform(
      transformerId,
      editValue,
      selectionStart,
      selectionEnd
    ) ?: return
    val didTransform = result.value != editValue
    isUpdating = true
    if (didTransform) {
      input.setText(result.value)
    }
    if (result.hasSelection && (didTransform || result.selectionStart != selectionStart || result.selectionEnd != selectionEnd)) {
      input.setSelection(result.selectionStart, result.selectionEnd)
    }
    isUpdating = false
  }
}
