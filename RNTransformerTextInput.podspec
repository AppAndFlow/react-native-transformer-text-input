require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

pods_root = Pod::Config.instance.project_pods_root

react_native_node_modules_dir = File.dirname(`cd "#{Pod::Config.instance.installation_root.to_s}" && node --print "require.resolve('react-native/package.json')"`)
react_native_common_dir_absolute = File.join(react_native_node_modules_dir, 'ReactCommon')
react_native_common_dir = Pathname.new(react_native_common_dir_absolute).relative_path_from(pods_root).to_s

react_native_worklets_node_modules_dir = ENV['REACT_NATIVE_WORKLETS_NODE_MODULES_DIR'] ||
 File.dirname(`cd "#{Pod::Config.instance.installation_root.to_s}" && node --print "require.resolve('react-native-worklets/package.json')"`)
react_native_worklets_node_modules_dir_from_pods_root = Pathname.new(react_native_worklets_node_modules_dir).relative_path_from(pods_root).to_s

Pod::Spec.new do |s|
  s.name         = "RNTransformerTextInput"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]

  s.platforms    = { :ios => min_ios_version_supported }
  s.source       = { :git => "https://github.com/AppAndFlow/react-native-transformer-text-input.git", :tag => "#{s.version}" }

  s.source_files = [
    "ios/**/*.{h,m,mm,swift}",
    "cpp/**/*.{h,cpp}"
  ]
  s.private_header_files = "ios/**/*.h"

  install_modules_dependencies(s)

  s.xcconfig = {
    "HEADER_SEARCH_PATHS" => [
      "\"$(PODS_ROOT)/#{react_native_common_dir}\"",
      "\"$(PODS_ROOT)/#{react_native_worklets_node_modules_dir_from_pods_root}/apple\"",
      "\"$(PODS_ROOT)/#{react_native_worklets_node_modules_dir_from_pods_root}/Common/cpp\"",
    ].join(' '),
  }
end
