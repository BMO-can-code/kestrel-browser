// This Source Code Form is subject to the terms of the Mozilla Public
// License, v. 2.0. If a copy of the MPL was not distributed with this
// file, You can obtain one at http://mozilla.org/MPL/2.0/.
//
// Waits until the given process owns at least one on-screen window (layer 0,
// non-zero alpha) and prints the elapsed milliseconds since the helper
// started. Used by startup.sh; not shipped.
//
// Build: xcrun swiftc -O window_wait.swift -o window_wait
// Usage: ./window_wait <pid> [timeout-seconds]

import Cocoa

let args = CommandLine.arguments
guard args.count >= 2, let pid = Int32(args[1]) else {
  FileHandle.standardError.write("usage: window_wait <pid> [timeout-seconds]\n".data(using: .utf8)!)
  exit(2)
}
let timeout = args.count >= 3 ? (Double(args[2]) ?? 120.0) : 120.0
let start = DispatchTime.now().uptimeNanoseconds

func elapsedMs() -> Double {
  return Double(DispatchTime.now().uptimeNanoseconds - start) / 1_000_000.0
}

while elapsedMs() < timeout * 1000.0 {
  let options: CGWindowListOption = [.optionOnScreenOnly, .excludeDesktopElements]
  if let list = CGWindowListCopyWindowInfo(options, kCGNullWindowID) as? [[String: Any]] {
    for window in list {
      guard let owner = window[kCGWindowOwnerPID as String] as? Int32, owner == pid else { continue }
      let layer = window[kCGWindowLayer as String] as? Int ?? 0
      let alpha = window[kCGWindowAlpha as String] as? Double ?? 1.0
      if layer == 0 && alpha > 0.0 {
        print(String(format: "%.1f", elapsedMs()))
        exit(0)
      }
    }
  }
  usleep(20_000)
}

FileHandle.standardError.write("timeout waiting for window\n".data(using: .utf8)!)
exit(1)
