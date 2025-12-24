#import "TransformerTextInputDecoratorView.h"

#import <React/RCTBackedTextInputDelegate.h>
#import <React/RCTBackedTextInputViewProtocol.h>
#import <React/RCTTextInputComponentView.h>
#import <react/renderer/components/TransformerTextInputDecoratorViewSpec/EventEmitters.h>
#import <react/renderer/components/TransformerTextInputDecoratorViewSpec/Props.h>
#import <react/renderer/components/TransformerTextInputDecoratorViewSpec/RCTComponentViewHelpers.h>
#import <rnworklets/worklets/apple/WorkletsModule.h>

#import "TransformerTextInputDecoratorViewComponentDescriptor.h"
#import "TransformerTextInputModule.h"

using namespace facebook::react;

@interface TransformerTextInputDecoratorView () <
    RCTTransformerTextInputDecoratorViewViewProtocol,
    RCTBackedTextInputDelegate>

@end

@implementation TransformerTextInputDecoratorView {
  std::optional<jsi::WeakObject> _transformer;
  bool _observersAdded;
  __weak id<RCTBackedTextInputDelegate> _baseDelegate;
  __weak UIView<RCTBackedTextInputViewProtocol> *_backedTextInput;
}

+ (ComponentDescriptorProvider)componentDescriptorProvider
{
  return concreteComponentDescriptorProvider<TransformerTextInputDecoratorViewComponentDescriptor>();
}

- (instancetype)initWithFrame:(CGRect)frame
{
  if (self = [super initWithFrame:frame]) {
    _props = TransformerTextInputDecoratorViewShadowNode::defaultSharedProps();
    _observersAdded = false;
  }

  return self;
}

- (void)updateProps:(Props::Shared const &)props oldProps:(Props::Shared const &)oldProps
{
  const auto &oldViewProps = *std::static_pointer_cast<TransformerTextInputDecoratorViewProps const>(_props);
  const auto &newViewProps = *std::static_pointer_cast<TransformerTextInputDecoratorViewProps const>(props);

  if (oldViewProps.transformerId != newViewProps.transformerId) {
    auto &uiRuntime = *TransformerTextInputGetUIRuntime();
    auto transformerRegistry = uiRuntime.global().getPropertyAsObject(uiRuntime, "__rnti_registerTransformerRegistry");
    auto transformerRegistryGet = transformerRegistry.getPropertyAsFunction(uiRuntime, "get");
    auto transformer =
        transformerRegistryGet.call(uiRuntime, jsi::Value(newViewProps.transformerId)).asObject(uiRuntime);
    _transformer = jsi::WeakObject(uiRuntime, transformer);
  }

  [super updateProps:props oldProps:oldProps];
}

- (void)applyValue:(NSString *)newValue
{
  NSMutableAttributedString *newAttributedText =
      [[NSMutableAttributedString alloc] initWithAttributedString:_backedTextInput.attributedText];

  [newAttributedText replaceCharactersInRange:NSMakeRange(0, newAttributedText.length) withString:newValue];
  _backedTextInput.attributedText = newAttributedText;
}

- (NSRange)currentSelection
{
  UITextRange *selectedTextRange = _backedTextInput.selectedTextRange;
  if (!selectedTextRange) {
    return NSMakeRange(0, 0);
  }
  NSInteger start = [_backedTextInput offsetFromPosition:_backedTextInput.beginningOfDocument
                                              toPosition:selectedTextRange.start];
  NSInteger end = [_backedTextInput offsetFromPosition:_backedTextInput.beginningOfDocument
                                            toPosition:selectedTextRange.end];
  return NSMakeRange(start, end - start);
}

- (void)applySelection:(NSRange)selection
{
  UITextPosition *startPosition = [_backedTextInput positionFromPosition:_backedTextInput.beginningOfDocument
                                                                  offset:selection.location];
  UITextPosition *endPosition = [_backedTextInput positionFromPosition:_backedTextInput.beginningOfDocument
                                                                offset:selection.location + selection.length];
  if (!startPosition || !endPosition) {
    return;
  }
  UITextRange *range = [_backedTextInput textRangeFromPosition:startPosition toPosition:endPosition];
  if (range) {
    [_backedTextInput setSelectedTextRange:range notifyDelegate:NO];
  }
}

- (std::optional<jsi::Function>)transformerFunction
{
  // Make sure transformer is valid.
  if (!_transformer) {
    return std::nullopt;
  }
  auto &uiRuntime = *TransformerTextInputGetUIRuntime();
  auto transformer = _transformer->lock(uiRuntime);
  if (transformer.isUndefined()) {
    // Transformer got GC'd.
    _transformer = std::nullopt;
    return std::nullopt;
  }

  return transformer.asObject(uiRuntime).asFunction(uiRuntime);
}

- (void)didAddSubview:(UIView *)subview
{
  [super didAddSubview:subview];

  [self addTextInputObservers];
}

- (void)willRemoveSubview:(UIView *)subview
{
  [super willRemoveSubview:subview];

  [self removeTextInputObservers];
}

- (void)addTextInputObservers
{
  react_native_assert(
      !_observersAdded &&
      "MarkdownTextInputDecoratorComponentView tried to add TextInput observers while they were attached");
  react_native_assert(
      self.subviews.count > 0 && "MarkdownTextInputDecoratorComponentView is mounted without any children");
  UIView *childView = self.subviews[0];
  react_native_assert(
      [childView isKindOfClass:[RCTTextInputComponentView class]] &&
      "Child component of MarkdownTextInputDecoratorComponentView is not an instance of RCTTextInputComponentView.");
  RCTTextInputComponentView *textInputComponentView = (RCTTextInputComponentView *)childView;
  UIView<RCTBackedTextInputViewProtocol> *backedTextInputView =
      [textInputComponentView valueForKey:@"_backedTextInputView"];

  _backedTextInput = backedTextInputView;
  _baseDelegate = backedTextInputView.textInputDelegate;
  backedTextInputView.textInputDelegate = self;

  _observersAdded = true;
}

- (void)removeTextInputObservers
{
  _backedTextInput = nil;
  _baseDelegate = nil;
  _observersAdded = false;
  _transformer = std::nullopt;
}

- (void)textInputDidBeginEditing
{
  [_baseDelegate textInputDidBeginEditing];
}

- (void)textInputDidChange
{
  // Current values
  NSString *currentValue = _backedTextInput.attributedText.string;
  NSRange currentSelection = [self currentSelection];

  auto transformerFunction = [self transformerFunction];
  if (transformerFunction) {
    auto &uiRuntime = *TransformerTextInputGetUIRuntime();
    auto result = transformerFunction
                      ->call(
                          uiRuntime,
                          jsi::String::createFromUtf8(uiRuntime, currentValue.UTF8String),
                          jsi::Value(static_cast<int>(currentSelection.location)),
                          jsi::Value(static_cast<int>(currentSelection.location + currentSelection.length)))
                      .asObject(uiRuntime);

    NSString *newValue =
        [NSString stringWithCString:result.getProperty(uiRuntime, "value").asString(uiRuntime).utf8(uiRuntime).c_str()
                           encoding:NSUTF8StringEncoding];
    auto selectionObject = result.getProperty(uiRuntime, "selection").asObject(uiRuntime);
    NSInteger newStart = (NSInteger)selectionObject.getProperty(uiRuntime, "start").asNumber();
    NSInteger newEnd = (NSInteger)selectionObject.getProperty(uiRuntime, "end").asNumber();
    NSRange newSelection = NSMakeRange(newStart, newEnd - newStart);

    bool didTransform = ![newValue isEqualToString:currentValue];
    if (didTransform) {
      [self applyValue:newValue];
    }
    if (didTransform || !NSEqualRanges(newSelection, currentSelection)) {
      [self applySelection:newSelection];
    }
  }

  [_baseDelegate textInputDidChange];
}

- (void)textInputDidChangeSelection
{
  [_baseDelegate textInputDidChangeSelection];
}

- (void)textInputDidEndEditing
{
  [_baseDelegate textInputDidEndEditing];
}

- (void)textInputDidReturn
{
  [_baseDelegate textInputDidReturn];
}

- (BOOL)textInputShouldBeginEditing
{
  return [_baseDelegate textInputShouldBeginEditing];
}

- (nonnull NSString *)textInputShouldChangeText:(nonnull NSString *)text inRange:(NSRange)range
{
  return [_baseDelegate textInputShouldChangeText:text inRange:range];
}

- (BOOL)textInputShouldEndEditing
{
  return [_baseDelegate textInputShouldEndEditing];
}

- (BOOL)textInputShouldReturn
{
  return [_baseDelegate textInputShouldReturn];
}

- (BOOL)textInputShouldSubmitOnReturn
{
  return [_baseDelegate textInputShouldSubmitOnReturn];
}

@end
