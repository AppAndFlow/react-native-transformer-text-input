#pragma once

#include <react/renderer/core/ConcreteComponentDescriptor.h>

#include "TransformerTextInputDecoratorViewShadowNode.h"

namespace facebook::react {

class TransformerTextInputDecoratorViewComponentDescriptor final
    : public ConcreteComponentDescriptor<
          TransformerTextInputDecoratorViewShadowNode> {
 public:
  using ConcreteComponentDescriptor::ConcreteComponentDescriptor;
};

} // namespace facebook::react
