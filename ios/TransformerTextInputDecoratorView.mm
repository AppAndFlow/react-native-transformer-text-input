#import "TransformerTextInputDecoratorView.h"

#import <React/RCTBackedTextInputDelegate.h>
#import <React/RCTBackedTextInputViewProtocol.h>
#import <React/RCTConversions.h>
#import <React/RCTTextInputComponentView.h>
#import <react/renderer/components/rntti/EventEmitters.h>
#import <react/renderer/components/rntti/Props.h>
#import <react/renderer/components/rntti/RCTComponentViewHelpers.h>
#import "TransformerTextInputDecoratorViewComponentDescriptor.h"
#import "TransformerTextInputRuntime.h"

using namespace facebook::react;

struct RNTTITextState {
  NSString *value;
  NSRange selection;
};

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
    _transformer = rntti::LookupTransformer(newViewProps.transformerId);
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

- (NSString *)currentValue
{
  return _backedTextInput.attributedText.string ?: @"";
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

- (RNTTITextState)transformTextState:(RNTTITextState)state
{
  if (!_transformer) {
    return state;
  }

  rntti::SelectionRange selectionRange{
      static_cast<int>(state.selection.location), static_cast<int>(state.selection.location + state.selection.length)};
  auto transformResult = rntti::RunTransformer(_transformer, RCTStringFromNSString(state.value), selectionRange);
  if (!transformResult) {
    return state;
  }

  NSString *value = RCTNSStringFromString(transformResult->value);
  NSRange selection =
      NSMakeRange(transformResult->selection.start, transformResult->selection.end - transformResult->selection.start);

  return RNTTITextState{value, selection};
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
  NSString *currentValue = [self currentValue];
  NSRange currentSelection = [self currentSelection];
  RNTTITextState current{currentValue, currentSelection};
  RNTTITextState next = [self transformTextState:current];
  bool didTransformValue = ![next.value isEqualToString:current.value];
  if (didTransformValue) {
    [self applyValue:next.value];
  }
  if (didTransformValue || !NSEqualRanges(next.selection, current.selection)) {
    [self applySelection:next.selection];
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

- (void)handleCommand:(const NSString *)commandName args:(const NSArray *)args
{
  RCTTransformerTextInputDecoratorViewHandleCommand(self, commandName, args);
}

- (void)update:(BOOL)transform
             value:(NSString *)value
    selectionStart:(NSInteger)selectionStart
      selectionEnd:(NSInteger)selectionEnd
{
  NSString *currentValue = [self currentValue];
  NSRange currentSelection = [self currentSelection];
  NSString *providedValue = value ?: currentValue;
  NSRange providedSelection = NSMakeRange(selectionStart, selectionEnd - selectionStart);
  RNTTITextState provided{providedValue, providedSelection};
  RNTTITextState next = transform ? [self transformTextState:provided] : provided;
  bool didTransformValue = ![next.value isEqualToString:currentValue];
  if (didTransformValue) {
    [self applyValue:next.value];
  }
  if (didTransformValue || !NSEqualRanges(next.selection, currentSelection)) {
    [self applySelection:next.selection];
  }

  [_baseDelegate textInputDidChange];
}

@end
