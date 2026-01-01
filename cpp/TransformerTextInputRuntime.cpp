#include "TransformerTextInputRuntime.h"

namespace rntti {

namespace {
std::weak_ptr<worklets::WorkletRuntime> gUiRuntime;
} // namespace

void SetUIWorkletRuntime(
    const std::shared_ptr<worklets::WorkletRuntime> &runtime) {
  if (!runtime) {
    gUiRuntime.reset();
    return;
  }
  runtime->schedule([runtime]() { gUiRuntime = runtime; });
}

std::optional<jsi::WeakObject> LookupTransformer(int transformerId) {
  auto uiRuntime = gUiRuntime.lock();
  if (!uiRuntime) {
    return std::nullopt;
  }
  auto &runtime = uiRuntime->getJSIRuntime();
  auto transformerRegistry = runtime.global().getPropertyAsObject(
      runtime, "__rntti_registerTransformerRegistry");
  auto transformerRegistryGet =
      transformerRegistry.getPropertyAsFunction(runtime, "get");
  auto transformerValue =
      transformerRegistryGet.call(runtime, jsi::Value(transformerId));

  if (transformerValue.isNull() || transformerValue.isUndefined() ||
      !transformerValue.isObject()) {
    return std::nullopt;
  }

  return jsi::WeakObject(runtime, transformerValue.asObject(runtime));
}

std::optional<TransformResult> RunTransformer(
    const std::optional<jsi::WeakObject> &transformer,
    const std::string &value,
    SelectionRange selection) {
  if (!transformer) {
    return std::nullopt;
  }

  auto uiRuntime = gUiRuntime.lock();
  if (!uiRuntime) {
    return std::nullopt;
  }

  auto &jsiRuntime = uiRuntime->getJSIRuntime();

  auto transformerValue = transformer->lock(jsiRuntime);
  if (transformerValue.isUndefined()) {
    return std::nullopt;
  }

  auto transformerFunction =
      transformerValue.asObject(jsiRuntime).asFunction(jsiRuntime);
  auto resultValue = uiRuntime->runSync(
      transformerFunction,
      jsi::String::createFromUtf8(jsiRuntime, value),
      jsi::Value(selection.start),
      jsi::Value(selection.end));

  TransformResult result;
  auto resultObject = resultValue.asObject(jsiRuntime);
  auto valueProp = resultObject.getProperty(jsiRuntime, "value");
  if (valueProp.isString()) {
    result.value = valueProp.asString(jsiRuntime).utf8(jsiRuntime);
  }

  auto selectionProp = resultObject.getProperty(jsiRuntime, "selection");
  if (selectionProp.isObject()) {
    auto selectionObject = selectionProp.asObject(jsiRuntime);
    auto startProp = selectionObject.getProperty(jsiRuntime, "start");
    auto endProp = selectionObject.getProperty(jsiRuntime, "end");
    result.selection = SelectionRange{
        static_cast<int>(startProp.asNumber()),
        static_cast<int>(endProp.asNumber())};
  }

  return result;
}

} // namespace rntti
