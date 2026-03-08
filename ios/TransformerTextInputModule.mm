#import "TransformerTextInputModule.h"

#import <jsi/jsi.h>
#import <worklets/apple/WorkletsModule.h>

#import "TransformerTextInputRuntime.h"

@implementation TransformerTextInputModule

RCT_EXPORT_MODULE(TransformerTextInputModule)

@synthesize moduleRegistry = _moduleRegistry;

- (NSNumber *)install
{
  WorkletsModule *workletsModule = [_moduleRegistry moduleForName:"WorkletsModule"];
  auto uiRuntime = [workletsModule getWorkletsModuleProxy]->getUIWorkletRuntime();
  rntti::SetUIWorkletRuntime(uiRuntime);
  return @YES;
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeTransformerTextInputModuleSpecJSI>(params);
}

@end
