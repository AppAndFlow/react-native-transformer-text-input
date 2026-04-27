#include "TransformerTextInputDecoratorViewShadowNode.h"

#include <react/debug/react_native_assert.h>

namespace facebook::react {

const char TransformerTextInputDecoratorViewComponentName[] =
    "TransformerTextInputDecoratorView";

void TransformerTextInputDecoratorViewShadowNode::initialize() {
  // Setting display: contents style results in ForceFlattenView trait being set
  // on the shadow node. This trait causes the node not to have a host view. By
  // removing the trait, it's possible to force RN to create a host view, layout
  // of which can then be customized.
  ShadowNode::traits_.unset(ShadowNodeTraits::ForceFlattenView);
}

void TransformerTextInputDecoratorViewShadowNode::layout(
    LayoutContext layoutContext) {
  YogaLayoutableShadowNode::layout(layoutContext);

  // Nodes with display: contents are skipped during Yoga layout and end up
  // with zero-sized metrics. To get a proper host view (so input and
  // accessibility wiring works on Android), copy the child's Yoga-computed
  // metrics onto the decorator and zero out the child's origin since it is
  // now relative to the decorator.
  const auto &children = getChildren();
  react_native_assert(
      children.size() == 1 &&
      "TransformerTextInputDecoratorView didn't receive exactly one child");

  auto child =
      std::static_pointer_cast<const YogaLayoutableShadowNode>(children[0]);
  child->ensureUnsealed();
  auto mutableChild = std::const_pointer_cast<YogaLayoutableShadowNode>(child);

  auto childMetrics = child->getLayoutMetrics();
  setLayoutMetrics(childMetrics);

  childMetrics.frame.origin = Point{};
  mutableChild->setLayoutMetrics(childMetrics);
}

} // namespace facebook::react
