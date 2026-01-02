cmake_minimum_required(VERSION 3.13)
set(CMAKE_VERBOSE_MAKEFILE ON)

set(LIB_LITERAL rntti)
set(LIB_TARGET_NAME react_codegen_${LIB_LITERAL})

set(LIB_ANDROID_DIR ${CMAKE_CURRENT_SOURCE_DIR}/../../..)
set(LIB_COMMON_DIR ${LIB_ANDROID_DIR}/../cpp)
set(LIB_ANDROID_GENERATED_JNI_DIR ${LIB_ANDROID_DIR}/build/generated/source/codegen/jni)
set(LIB_ANDROID_GENERATED_COMPONENTS_DIR ${LIB_ANDROID_GENERATED_JNI_DIR}/react/renderer/components/${LIB_LITERAL})

# Resolve path to react-native-worklets.
set(REACT_NATIVE_WORKLETS_DIR "" CACHE PATH "Path to react-native-worklets root directory")

if(NOT DEFINED REACT_NATIVE_WORKLETS_DIR OR "${REACT_NATIVE_WORKLETS_DIR}" STREQUAL "")
  set(NODE_BINARY "node" CACHE STRING "Path to Node.js binary")

  execute_process(
    COMMAND "${NODE_BINARY}" -p "require.resolve('react-native-worklets/package.json')"
    WORKING_DIRECTORY "${PROJECT_ROOT_DIR}/.."
    OUTPUT_VARIABLE _worklets_pkg_json
    OUTPUT_STRIP_TRAILING_WHITESPACE
    RESULT_VARIABLE _worklets_res
    ERROR_QUIET
  )

  if (NOT _worklets_res EQUAL 0)
    message(FATAL_ERROR
      "Failed to resolve 'react-native-worklets' with Node from '${PROJECT_ROOT_DIR}/..'. "
      "Set REACT_NATIVE_WORKLETS_DIR or NODE_BINARY explicitly."
    )
  endif()

  get_filename_component(REACT_NATIVE_WORKLETS_DIR "${_worklets_pkg_json}" DIRECTORY)
endif()

file(GLOB LIB_CUSTOM_SRCS CONFIGURE_DEPENDS *.cpp ${LIB_COMMON_DIR}/*.cpp)
file(GLOB LIB_CODEGEN_SRCS CONFIGURE_DEPENDS ${LIB_ANDROID_GENERATED_JNI_DIR}/*.cpp ${LIB_ANDROID_GENERATED_COMPONENTS_DIR}/*.cpp)

add_library(
  ${LIB_TARGET_NAME}
  SHARED
  ${LIB_CUSTOM_SRCS}
  ${LIB_CODEGEN_SRCS}
)

target_include_directories(
  ${LIB_TARGET_NAME}
  PUBLIC
  .
  ${LIB_COMMON_DIR}
  ${LIB_ANDROID_GENERATED_JNI_DIR}
  ${LIB_ANDROID_GENERATED_COMPONENTS_DIR}
  "${REACT_COMMON_DIR}"
  "${REACT_COMMON_DIR}/jsiexecutor"
  "${REACT_NATIVE_WORKLETS_DIR}/Common/cpp"
  "${REACT_NATIVE_WORKLETS_DIR}/android/src/main/cpp"
)

if(${CMAKE_BUILD_TYPE} MATCHES "Debug")
  set(BUILD_TYPE "debug")
else()
  set(BUILD_TYPE "release")
endif()

add_library(worklets SHARED IMPORTED)

set_target_properties(
  worklets
  PROPERTIES
    IMPORTED_LOCATION
    "${REACT_NATIVE_WORKLETS_DIR}/android/build/intermediates/cmake/${BUILD_TYPE}/obj/${ANDROID_ABI}/libworklets.so"
)

target_link_libraries(
  ${LIB_TARGET_NAME}
  fbjni
  jsi
  reactnative
  worklets
)

target_include_directories(
  ${CMAKE_PROJECT_NAME}
  PUBLIC
  ${CMAKE_CURRENT_SOURCE_DIR}
)

target_compile_reactnative_options(${LIB_TARGET_NAME} PUBLIC)
