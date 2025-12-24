#import <jsi/jsi.h>
#import <ReactCodegen/TransformerTextInputDecoratorViewSpec/TransformerTextInputDecoratorViewSpec.h>

NS_ASSUME_NONNULL_BEGIN

facebook::jsi::Runtime *TransformerTextInputGetUIRuntime(void);

@interface TransformerTextInputModule : NativeTransformerTextInputModuleSpecBase <
                                         NativeTransformerTextInputModuleSpec>
@end

NS_ASSUME_NONNULL_END
