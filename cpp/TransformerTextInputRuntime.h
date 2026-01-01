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
  std::string value;
  SelectionRange selection;
};

void SetUIWorkletRuntime(const std::shared_ptr<worklets::WorkletRuntime> &runtime);

std::optional<jsi::Function> LookupTransformer(int transformerId);

std::optional<TransformResult> RunTransformer(
    const jsi::Function &transformer,
    const std::string &value,
    SelectionRange selection);

} // namespace rntti
