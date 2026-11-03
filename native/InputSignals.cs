using System;
using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Threading;
class InputSignals {
  // Forward only named gestures; never translate or retain character input.
  delegate IntPtr Hook(int code, IntPtr msg, IntPtr data);
  [DllImport("user32.dll")] static extern IntPtr SetWindowsHookEx(int kind, Hook callback, IntPtr module, uint tid);
  [DllImport("user32.dll")] static extern bool UnhookWindowsHookEx(IntPtr hook);
  [DllImport("user32.dll")] static extern IntPtr CallNextHookEx(IntPtr hook,int code,IntPtr msg,IntPtr data);
  [DllImport("kernel32.dll", CharSet=CharSet.Unicode)] static extern IntPtr GetModuleHandle(string name);
  [DllImport("user32.dll")] static extern short GetAsyncKeyState(int key);
  [DllImport("user32.dll")] static extern int GetMessage(out Message msg, IntPtr hwnd,uint min,uint max);
  [StructLayout(LayoutKind.Sequential)] struct Message { public IntPtr hwnd; public uint message; public UIntPtr wParam; public IntPtr lParam; public uint time;public int x,y;public uint priv; }
  static string last=""; static Stopwatch clock=Stopwatch.StartNew(); static long sent=-1000;
  static void Emit(string s){long t=clock.ElapsedMilliseconds;if(last!=s||t-sent>=350){last=s;sent=t;Console.WriteLine(s);}}
  static Hook keyboard=(n,m,d)=>{if(n>=0 && (m.ToInt32()==256||m.ToInt32()==260)){int k=Marshal.ReadInt32(d);if(k==13)Emit("send");else if(k==46||k==8)Emit("delete");else if(k==90 && GetAsyncKeyState(17)<0)Emit("undo");}return CallNextHookEx(IntPtr.Zero,n,m,d);};
  static Hook mouse=(n,m,d)=>{if(n>=0 && m.ToInt32()==522)Emit("scroll");return CallNextHookEx(IntPtr.Zero,n,m,d);};
  static int Main(string[] args){if(args.Length!=1)return 1;try{Process parent=Process.GetProcessById(int.Parse(args[0]));parent.EnableRaisingEvents=true;parent.Exited+=(s,e)=>Environment.Exit(0);if(parent.HasExited)return 0;}catch{return 1;}
    var mod=GetModuleHandle(null);var k=SetWindowsHookEx(13,keyboard,mod,0);var m=SetWindowsHookEx(14,mouse,mod,0);
    try{if(k==IntPtr.Zero||m==IntPtr.Zero)return 2;Console.WriteLine("ready");Message msg;while(GetMessage(out msg,IntPtr.Zero,0,0)>0){}return 0;}finally{UnhookWindowsHookEx(k);UnhookWindowsHookEx(m);}
  }
}
