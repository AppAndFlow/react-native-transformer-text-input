cmake_minimum_required(VERSION 3.13)

project(transformerinput)

set(CMAKE_CXX_STANDARD 17)

set(RNTTI_CPP_DIR ${CMAKE_CURRENT_LIST_DIR}/../../../../cpp)

add_library(transformerinput SHARED
  TransformerTextInputJni.cpp
  ${RNTTI_CPP_DIR}/TransformerTextInputRuntime.cpp
)

find_package(ReactAndroid REQUIRED CONFIG)
find_package(fbjni REQUIRED CONFIG)

set(WORKLETS_DIR ${CMAKE_CURRENT_LIST_DIR}/../../../../node_modules/react-native-worklets)

target_include_directories(transformerinput PRIVATE
  ${RNTTI_CPP_DIR}
  ${WORKLETS_DIR}/Common/cpp
  ${WORKLETS_DIR}/android/src/main/cpp
)

target_link_libraries(transformerinput
  ReactAndroid::jsi
  ReactAndroid::reactnativejni
  fbjni::fbjni
  log
)

find_library(WORKLETS_LIB worklets)
if (WORKLETS_LIB)
  target_link_libraries(transformerinput ${WORKLETS_LIB})
endif ()
