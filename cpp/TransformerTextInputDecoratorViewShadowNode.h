#pragma once

#include <react/renderer/components/rntti/EventEmitters.h>
#include <react/renderer/components/rntti/Props.h>
#include <react/renderer/components/view/ConcreteViewShadowNode.h>
#include <react/renderer/core/LayoutContext.h>
#include <react/renderer/core/ShadowNodeFamily.h>

namespace facebook::react {

extern const char TransformerTextInputDecoratorViewComponentName[];

class TransformerTextInputDecoratorViewShadowNode final
    : public ConcreteViewShadowNode<
          TransformerTextInputDecoratorViewComponentName,
          TransformerTextInputDecoratorViewProps,
          TransformerTextInputDecoratorViewEventEmitter> {
 public:
  TransformerTextInputDecoratorViewShadowNode(
      ShadowNodeFragment const &fragment,
      ShadowNodeFamily::Shared const &family,
      ShadowNodeTraits traits)
      : ConcreteViewShadowNode(fragment, family, traits) {
    initialize();
  }

  TransformerTextInputDecoratorViewShadowNode(
      ShadowNode const &sourceShadowNode,
      ShadowNodeFragment const &fragment)
      : ConcreteViewShadowNode(sourceShadowNode, fragment) {
    initialize();
  }

  void layout(LayoutContext layoutContext) override;

 private:
  void initialize();
};

} // namespace facebook::react
