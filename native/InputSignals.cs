using System;
using System.Diagnostics;
using System.Collections.Generic;
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
  static readonly HashSet<int> down=new HashSet<int>();
  static string Gesture(int k,bool ctrl){if(k==13)return "send";if(k==46||k==8)return "delete";if(ctrl&&k==90)return "undo";if(ctrl&&k==83)return "save";return null;}
  static Hook keyboard=(n,m,d)=>{if(n>=0){int k=Marshal.ReadInt32(d);if(m.ToInt32()==257||m.ToInt32()==261)down.Remove(k);else if(m.ToInt32()==256||m.ToInt32()==260){string gesture=Gesture(k,GetAsyncKeyState(17)<0);if(gesture!=null&&down.Add(k))Emit(gesture);}}return CallNextHookEx(IntPtr.Zero,n,m,d);};
  static Hook mouse=(n,m,d)=>{if(n>=0 && m.ToInt32()==522)Emit("scroll");return CallNextHookEx(IntPtr.Zero,n,m,d);};
  static int Main(string[] args){if(args.Length!=1)return 1;if(args[0]=="--self-test")return Gesture(83,true)=="save"&&Gesture(83,false)==null&&Gesture(65,false)==null&&Gesture(90,true)=="undo"?0:1;try{Process parent=Process.GetProcessById(int.Parse(args[0]));parent.EnableRaisingEvents=true;parent.Exited+=(s,e)=>Environment.Exit(0);if(parent.HasExited)return 0;}catch{return 1;}
    var mod=GetModuleHandle(null);var k=SetWindowsHookEx(13,keyboard,mod,0);var m=SetWindowsHookEx(14,mouse,mod,0);
    try{if(k==IntPtr.Zero||m==IntPtr.Zero)return 2;Console.WriteLine("ready");Message msg;while(GetMessage(out msg,IntPtr.Zero,0,0)>0){}return 0;}finally{UnhookWindowsHookEx(k);UnhookWindowsHookEx(m);}
  }
}
