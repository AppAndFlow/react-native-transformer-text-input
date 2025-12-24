#import "TransformerTextInputModule.h"

#import <ReactCodegen/TransformerTextInputDecoratorViewSpecJSI.h>
#import <jsi/jsi.h>
#import <rnworklets/worklets/apple/WorkletsModule.h>

static facebook::jsi::Runtime *s_uiRuntime = nullptr;

facebook::jsi::Runtime *TransformerTextInputGetUIRuntime(void)
{
  return s_uiRuntime;
}

@implementation TransformerTextInputModule

RCT_EXPORT_MODULE(TransformerTextInputModule)

@synthesize moduleRegistry = _moduleRegistry;

- (NSNumber *)install
{
  WorkletsModule* workletsModule = [_moduleRegistry moduleForName:"WorkletsModule"];
  auto &uiRuntime = [workletsModule getWorkletsModuleProxy]->getUIWorkletRuntime()->getJSIRuntime();
  s_uiRuntime = &uiRuntime;
  return @YES;
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeTransformerTextInputModuleSpecJSI>(params);
}

@end
