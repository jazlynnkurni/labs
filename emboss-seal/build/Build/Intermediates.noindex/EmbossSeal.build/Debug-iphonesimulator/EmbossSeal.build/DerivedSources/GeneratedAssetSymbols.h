#import <Foundation/Foundation.h>

#if __has_attribute(swift_private)
#define AC_SWIFT_PRIVATE __attribute__((swift_private))
#else
#define AC_SWIFT_PRIVATE
#endif

/// The "relief" asset catalog image resource.
static NSString * const ACImageNameRelief AC_SWIFT_PRIVATE = @"relief";

/// The "tile" asset catalog image resource.
static NSString * const ACImageNameTile AC_SWIFT_PRIVATE = @"tile";

#undef AC_SWIFT_PRIVATE
