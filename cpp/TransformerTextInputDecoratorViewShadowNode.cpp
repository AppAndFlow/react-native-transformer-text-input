#include "TransformerTextInputDecoratorViewShadowNode.h"

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
    LayoutContext layoutContext)
{
  ConcreteViewShadowNode::layout(layoutContext);
}

} // namespace facebook::react
