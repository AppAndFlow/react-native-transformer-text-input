#include <fbjni/fbjni.h>
#include <jsi/jsi.h>
#include <worklets/NativeModules/WorkletsModuleProxy.h>
#include <worklets/android/WorkletsModule.h>

#include <memory>

using namespace facebook;

namespace transformerinput {

static jsi::Runtime *s_uiRuntime = nullptr;

class JTransformerTextInputJni
    : public jni::HybridClass<JTransformerTextInputJni> {
 public:
  static auto constexpr kJavaDescriptor =
      "Lcom/appandflow/transformertextinput/TransformerTextInputJni;";

  static void setWorkletsModule(jni::alias_ref<jni::JObject> module) {
    if (!module) {
      return;
    }
    auto workletsModule = worklets::WorkletsModule::fromJava(module);
    if (!workletsModule) {
      return;
    }
    auto proxy = workletsModule->getWorkletsModuleProxy();
    if (!proxy) {
      return;
    }
    auto uiRuntime = proxy->getUIWorkletRuntime();
    if (!uiRuntime) {
      return;
    }
    s_uiRuntime = &uiRuntime->getJSIRuntime();
  }

  static jni::local_ref<jni::JObject> transform(
      jint transformerId,
      jni::alias_ref<jni::JString> value,
      jint selectionStart,
      jint selectionEnd) {
    if (!s_uiRuntime) {
      return nullptr;
    }
    auto &rt = *s_uiRuntime;
    auto registry =
        rt.global().getPropertyAsObject(rt, "__rnti_registerTransformerRegistry");
    auto getFn = registry.getPropertyAsFunction(rt, "get");
    auto transformerValue = getFn.call(rt, jsi::Value(transformerId));
    if (!transformerValue.isObject()) {
      return nullptr;
    }
    auto transformer = transformerValue.asObject(rt).asFunction(rt);
    auto result = transformer.call(
        rt,
        jsi::String::createFromUtf8(rt, value->toStdString()),
        jsi::Value(static_cast<int>(selectionStart)),
        jsi::Value(static_cast<int>(selectionEnd)));

    if (!result.isObject()) {
      return nullptr;
    }

    auto resultObject = result.asObject(rt);
    auto valueProp = resultObject.getProperty(rt, "value");
    auto selectionProp = resultObject.getProperty(rt, "selection");
    if (!valueProp.isString() || !selectionProp.isObject()) {
      return nullptr;
    }

    auto selectionObject = selectionProp.asObject(rt);
    auto startProp = selectionObject.getProperty(rt, "start");
    auto endProp = selectionObject.getProperty(rt, "end");
    if (!startProp.isNumber() || !endProp.isNumber()) {
      return nullptr;
    }

    auto javaValue = jni::make_jstring(valueProp.asString(rt).utf8(rt));
    jint start = static_cast<jint>(startProp.asNumber());
    jint end = static_cast<jint>(endProp.asNumber());

    auto resultClass = jni::findClassStatic(
        "com/appandflow/transformertextinput/TransformResult");
    auto ctor =
        resultClass->getConstructor<jni::JString, jint, jint>();
    return resultClass->newObject(ctor, javaValue, start, end);
  }

  static void registerNatives() {
    registerHybrid({
        makeNativeMethod("setWorkletsModule", JTransformerTextInputJni::setWorkletsModule),
        makeNativeMethod("transform", JTransformerTextInputJni::transform),
    });
  }
};

} // namespace transformerinput

JNIEXPORT jint JNI_OnLoad(JavaVM *vm, void *) {
  return facebook::jni::initialize(vm, [] {
    transformerinput::JTransformerTextInputJni::registerNatives();
  });
}
