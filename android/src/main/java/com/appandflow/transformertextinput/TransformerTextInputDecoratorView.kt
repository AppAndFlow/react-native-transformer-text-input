package com.appandflow.transformertextinput

import android.content.Context
import android.text.Editable
import android.text.TextWatcher
import com.facebook.react.views.textinput.ReactEditText
import com.facebook.react.views.view.ReactViewGroup
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.MainScope
import kotlinx.coroutines.launch

class TransformerTextInputDecoratorView(
  context: Context,
) : ReactViewGroup(context),
  TextWatcher {
  private var transformerId: Int = 0
  private var lastEventValue: String? = null
  private var resetLastEventValueJob: Job? = null
  private var reactEditText: ReactEditText? = null
  private var isUpdating = false

  private fun currentValue(): String = reactEditText?.text?.toString() ?: ""

  private fun currentSelection(): TextSelection {
    val input = reactEditText
    return if (input == null) {
      TextSelection(0, 0)
    } else {
      TextSelection(input.selectionStart.coerceAtLeast(0), input.selectionEnd.coerceAtLeast(0))
    }
  }

  private fun applyValue(value: String) {
    reactEditText?.setText(value)
  }

  private fun applySelection(selection: TextSelection) {
    reactEditText?.setSelection(selection.start, selection.end)
  }

  private fun transformTextState(state: TextState) =
    TransformerTextInputJni.transform(
      transformerId,
      state.value,
      state.selection.start,
      state.selection.end,
    ) ?: state

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

  override fun beforeTextChanged(
    s: CharSequence?,
    start: Int,
    count: Int,
    after: Int,
  ) {
    // noop
  }

  override fun onTextChanged(
    s: CharSequence?,
    start: Int,
    before: Int,
    count: Int,
  ) {
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
    resetLastEventValueJob =
      MainScope().launch(Dispatchers.Main) {
        lastEventValue = null
        resetLastEventValueJob = null
      }

    val currentSelection = currentSelection()
    val current = TextState(editValue, currentSelection)
    val next = transformTextState(current)
    val didTransformValue = next.value != current.value
    isUpdating = true
    try {
      if (didTransformValue) {
        applyValue(next.value)
      }
      if (
        didTransformValue || next.selection != currentSelection
      ) {
        applySelection(next.selection)
      }
    } finally {
      isUpdating = false
    }
  }

  fun update(
    transform: Boolean,
    value: String?,
    selectionStart: Int,
    selectionEnd: Int,
  ) {
    if (reactEditText == null) {
      return
    }
    val currentValue = currentValue()
    val currentSelection = currentSelection()
    val providedValue = value ?: currentValue
    val providedSelection = TextSelection(selectionStart, selectionEnd)
    val provided = TextState(providedValue, providedSelection)
    val next = if (transform) transformTextState(provided) else provided

    val didTransformValue = next.value != currentValue
    isUpdating = true
    try {
      if (didTransformValue) {
        applyValue(next.value)
      }
      if (
        didTransformValue || next.selection != currentSelection
      ) {
        applySelection(next.selection)
      }
    } finally {
      isUpdating = false
    }
  }
}
