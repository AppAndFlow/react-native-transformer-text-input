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

    val input = reactEditText ?: return
    val selectionStart = input.selectionStart.coerceAtLeast(0)
    val selectionEnd = input.selectionEnd.coerceAtLeast(0)
    val result =
      TransformerTextInputJni.transform(
        transformerId,
        editValue,
        selectionStart,
        selectionEnd,
      ) ?: return
    val didTransform = result.value != editValue
    val newValue = result.value
    // Mirror iOS behavior when selection isn't explicitly provided.
    val (newSelectionStart, newSelectionEnd) =
      if (result.hasSelection) {
        Pair(result.selectionStart, result.selectionEnd)
      } else {
        computeUncontrolledSelection(editValue, newValue, selectionStart, selectionEnd)
      }
    isUpdating = true
    if (didTransform) {
      input.setText(newValue)
    }
    if (result.hasSelection || didTransform) {
      if (newSelectionStart != selectionStart || newSelectionEnd != selectionEnd) {
        input.setSelection(newSelectionStart, newSelectionEnd)
      }
    }
    isUpdating = false
  }

  private fun computeUncontrolledSelection(
    oldValue: String,
    newValue: String,
    selectionStart: Int,
    selectionEnd: Int,
  ): Pair<Int, Int> {
    val oldLength = oldValue.length
    val newLength = newValue.length
    val delta = newLength - oldLength
    val (rawStart, rawEnd) =
      if (selectionStart == selectionEnd) {
        if (selectionEnd >= oldLength) {
          Pair(newLength, newLength)
        } else {
          val next = selectionEnd + delta
          Pair(next, next)
        }
      } else {
        Pair(selectionStart + delta, selectionEnd + delta)
      }

    return if (
      rawStart < 0 ||
      rawEnd < 0 ||
      rawStart > newLength ||
      rawEnd > newLength ||
      rawStart > rawEnd
    ) {
      Pair(newLength, newLength)
    } else {
      Pair(rawStart, rawEnd)
    }
  }

  fun update(
    value: String?,
    selectionStart: Int?,
    selectionEnd: Int?,
    transform: Boolean,
  ) {
    val input = reactEditText ?: return
    val currentValue = input.text?.toString() ?: ""
    val currentSelectionStart = input.selectionStart.coerceAtLeast(0)
    val currentSelectionEnd = input.selectionEnd.coerceAtLeast(0)
    val baseValue = value ?: currentValue
    val baseSelectionStart = selectionStart ?: currentSelectionStart
    val baseSelectionEnd = selectionEnd ?: currentSelectionEnd

    var newValue = baseValue
    var newSelectionStart = baseSelectionStart
    var newSelectionEnd = baseSelectionEnd
    var hasSelection = selectionStart != null && selectionEnd != null

    if (transform) {
      val result = TransformerTextInputJni.transform(
        transformerId,
        baseValue,
        baseSelectionStart,
        baseSelectionEnd,
      )
      if (result != null) {
        newValue = result.value
        if (result.hasSelection) {
          newSelectionStart = result.selectionStart
          newSelectionEnd = result.selectionEnd
          hasSelection = true
        }
      }
    }

    val didTransform = newValue != currentValue
    isUpdating = true
    if (didTransform) {
      input.setText(newValue)
    }
    if (hasSelection || transform) {
      if (newSelectionStart != currentSelectionStart || newSelectionEnd != currentSelectionEnd) {
        input.setSelection(newSelectionStart, newSelectionEnd)
      }
    }
    isUpdating = false
  }
}
