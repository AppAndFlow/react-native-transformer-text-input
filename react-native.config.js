module.exports = {
  dependency: {
    platforms: {
      android: {
        libraryName: 'rntti',
        componentDescriptors: [
          'TransformerTextInputDecoratorViewComponentDescriptor',
        ],
        cmakeListsPath: 'src/main/jni/CMakeLists.txt',
      },
    },
  },
};
