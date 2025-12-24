package com.appandflow.transformertextinput

import android.content.Context
import android.text.Editable
import android.text.TextWatcher
import android.util.AttributeSet
import android.view.View
import android.view.ViewGroup
import android.widget.EditText
import android.widget.FrameLayout

class TransformerTextInputDecoratorView : FrameLayout {
  private var transformerId: Int = 0
  private var textInput: EditText? = null
  private var textWatcher: TextWatcher? = null
  private var isUpdating = false

  constructor(context: Context?) : super(context)
  constructor(context: Context?, attrs: AttributeSet?) : super(context, attrs)
  constructor(context: Context?, attrs: AttributeSet?, defStyleAttr: Int) : super(
    context,
    attrs,
    defStyleAttr
  )

  fun setTransformerId(newTransformerId: Int) {
    transformerId = newTransformerId
  }

  override fun onViewAdded(child: View) {
    super.onViewAdded(child)
    maybeAttachTextInput(child)
  }

  override fun onViewRemoved(child: View) {
    super.onViewRemoved(child)
    if (child == textInput) {
      detachTextInput()
    }
  }

  private fun maybeAttachTextInput(root: View) {
    if (textInput != null) {
      return
    }
    val editText = findEditText(root) ?: return
    textInput = editText
    textWatcher = object : TextWatcher {
      override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {
        // No-op.
      }

      override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {
        // No-op.
      }

      override fun afterTextChanged(s: Editable?) {
        if (isUpdating) {
          return
        }
        val editValue = s?.toString() ?: ""
        val input = textInput ?: return
        val selectionStart = input.selectionStart.coerceAtLeast(0)
        val selectionEnd = input.selectionEnd.coerceAtLeast(0)
        val result = TransformerTextInputJni.transform(
          transformerId,
          editValue,
          selectionStart,
          selectionEnd
        ) ?: return
        val newValue = result.value
        val newStart = result.selectionStart.coerceIn(0, newValue.length)
        val newEnd = result.selectionEnd.coerceIn(0, newValue.length)
        isUpdating = true
        if (newValue != editValue) {
          input.setText(newValue)
        }
        input.setSelection(newStart, newEnd)
        isUpdating = false
      }
    }
    editText.addTextChangedListener(textWatcher)
  }

  private fun detachTextInput() {
    val watcher = textWatcher
    val editText = textInput
    if (watcher != null && editText != null) {
      editText.removeTextChangedListener(watcher)
    }
    textWatcher = null
    textInput = null
  }

  private fun findEditText(view: View): EditText? {
    if (view is EditText) {
      return view
    }
    if (view is ViewGroup) {
      for (i in 0 until view.childCount) {
        val result = findEditText(view.getChildAt(i))
        if (result != null) {
          return result
        }
      }
    }
    return null
  }
}
