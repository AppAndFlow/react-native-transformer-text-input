#pragma once

#include <jsi/jsi.h>
#include <worklets/WorkletRuntime/WorkletRuntime.h>

#include <memory>
#include <optional>
#include <string>

namespace rntti {

struct SelectionRange {
  int start{0};
  int end{0};
};

struct TransformResult {
  std::optional<std::string> value;
  std::optional<SelectionRange> selection;
};

void SetUIWorkletRuntime(std::shared_ptr<worklets::WorkletRuntime> runtime);

std::optional<jsi::WeakObject> LookupTransformer(int transformerId);

std::optional<TransformResult> RunTransformer(
    const std::optional<jsi::WeakObject> &transformer,
    const std::string &value,
    SelectionRange selection);

} // namespace rntti
