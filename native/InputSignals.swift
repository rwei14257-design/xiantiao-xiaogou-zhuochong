import AppKit
import CoreGraphics
import Darwin
// Access is requested only when the user explicitly turns this feature on.
guard CommandLine.arguments.count == 2, let parent = Int32(CommandLine.arguments[1]) else { exit(1) }
guard CGPreflightListenEventAccess() || CGRequestListenEventAccess() else { exit(2) }
var previous = ""
var sent = -1.0
func emit(_ name: String) {
 let now = ProcessInfo.processInfo.systemUptime
 guard name != previous || now - sent > 0.35 else { return }
 previous=name; sent=now; print(name); fflush(stdout)
}
guard let monitor = NSEvent.addGlobalMonitorForEvents(matching:[.scrollWheel,.keyDown], handler:{ event in
 if event.type == .scrollWheel { emit("scroll");return }
 switch event.keyCode {
 case 36,76: emit("send")
 case 51,117: emit("delete")
 case 6 where event.modifierFlags.contains(.command): emit("undo")
 default: break
 }
}) else { exit(2) }
print("ready");fflush(stdout)
Timer.scheduledTimer(withTimeInterval: 2, repeats:true) { _ in if getppid() != parent { exit(0) } }
RunLoop.main.run()
