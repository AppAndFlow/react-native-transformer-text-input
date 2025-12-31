#include <fbjni/fbjni.h>
#include <jsi/jsi.h>
#include <worklets/NativeModules/WorkletsModuleProxy.h>
#include <worklets/android/WorkletsModule.h>

#include "TransformerTextInputRuntime.h"

#include <memory>

using namespace facebook;

namespace rntti {

struct JTextSelection : public jni::JavaClass<JTextSelection> {
  static auto constexpr kJavaDescriptor =
      "Lcom/appandflow/transformertextinput/TextSelection;";

  static jni::local_ref<JTextSelection> create(int start, int end) {
    return newInstance(start, end);
  }
};

struct JTextState : public jni::JavaClass<JTextState> {
  static auto constexpr kJavaDescriptor =
      "Lcom/appandflow/transformertextinput/TextState;";

  static jni::local_ref<JTextState> create(
      std::string const &value,
      jni::local_ref<JTextSelection> selection) {
    return newInstance(value, selection);
  }
};

class JTransformerTextInputJni
    : public jni::HybridClass<JTransformerTextInputJni> {
 public:
  static auto constexpr kJavaDescriptor =
      "Lcom/appandflow/transformertextinput/TransformerTextInputJni;";

  static void setWorkletsModule(
      jni::alias_ref<jni::JClass> jClazz,
      jni::alias_ref<worklets::WorkletsModule::javaobject> module) {
    if (!module) {
      return;
    }
    auto proxy = module->cthis()->getWorkletsModuleProxy();
    if (!proxy) {
      return;
    }
    auto uiRuntime = proxy->getUIWorkletRuntime();
    if (!uiRuntime) {
      return;
    }
    rntti::SetUIWorkletRuntime(uiRuntime);
  }

  static jni::local_ref<JTextState> transform(
      jni::alias_ref<jni::JClass> jClazz,
      jint transformerId,
      jni::alias_ref<jni::JString> value,
      jint selectionStart,
      jint selectionEnd) {
    auto transformer = rntti::LookupTransformer(transformerId);
    if (!transformer) {
      return nullptr;
    }
    const auto currentValue = value->toStdString();
    rntti::SelectionRange selection{
        static_cast<int>(selectionStart), static_cast<int>(selectionEnd)};
    auto result = rntti::RunTransformer(transformer, currentValue, selection);
    if (!result) {
      return nullptr;
    }

    return JTextState::create(
        result->value,
        JTextSelection::create(result->selection.start, result->selection.end));
  }

  static void registerNatives() {
    registerHybrid({
        makeNativeMethod(
            "setWorkletsModule", JTransformerTextInputJni::setWorkletsModule),
        makeNativeMethod("transform", JTransformerTextInputJni::transform),
    });
  }
};

} // namespace rntti

JNIEXPORT jint JNI_OnLoad(JavaVM *vm, void *) {
  return facebook::jni::initialize(
      vm, [] { rntti::JTransformerTextInputJni::registerNatives(); });
}
