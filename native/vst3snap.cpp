// vst3snap: loads one VST3 plug-in on its own, opens its editor in a window nobody can see,
// photographs it and quits. No DAW involved, so a whole library can be captured in minutes.
//   vst3snap <bundle.vst3> --list                 print the plug-in names inside the bundle
//   vst3snap <bundle.vst3> <out.png> [name]       capture the editor (first effect/instrument, or the one named)
// Exit codes: 0 ok, 2 load failed, 3 no editor, 4 capture failed.
// The VST3 interfaces are declared by hand (they are plain COM-style vtables), so no SDK is needed.
#define WIN32_LEAN_AND_MEAN
#define NOMINMAX
#include <windows.h>
#include <objidl.h>
#include <gdiplus.h>
#include <cstdio>
#include <cstring>
#include <string>
#include <map>
#include <algorithm>
#pragma comment(lib, "gdiplus.lib")
#pragma comment(lib, "user32.lib")
#pragma comment(lib, "gdi32.lib")
#pragma comment(lib, "ole32.lib")

typedef char TUID[16];
typedef int tresult;
enum { kOk = 0, kNoInterface = 0x80004002, kNotImpl = 0x80004001 };
#define UIDB(l1, l2, l3, l4) { (char)((l1) & 0xFF), (char)(((l1) >> 8) & 0xFF), (char)(((l1) >> 16) & 0xFF), (char)(((l1) >> 24) & 0xFF), \
  (char)(((l2) >> 16) & 0xFF), (char)(((l2) >> 24) & 0xFF), (char)((l2) & 0xFF), (char)(((l2) >> 8) & 0xFF), \
  (char)(((l3) >> 24) & 0xFF), (char)(((l3) >> 16) & 0xFF), (char)(((l3) >> 8) & 0xFF), (char)((l3) & 0xFF), \
  (char)(((l4) >> 24) & 0xFF), (char)(((l4) >> 16) & 0xFF), (char)(((l4) >> 8) & 0xFF), (char)((l4) & 0xFF) }
static const TUID IID_FUnknown = UIDB(0x00000000u, 0x00000000u, 0xC0000000u, 0x00000046u);
static const TUID IID_IComponent = UIDB(0xE831FF31u, 0xF2D54301u, 0x928EBBEEu, 0x25697802u);
static const TUID IID_IEditController = UIDB(0xDCD7BBE3u, 0x7742448Du, 0xA874AACCu, 0x979C759Eu);
static const TUID IID_IPlugFrame = UIDB(0x367FAF01u, 0xAFA94693u, 0x8D4DA2A0u, 0xED0882A3u);
static const TUID IID_IHostApplication = UIDB(0x58E595CCu, 0xDB2D4969u, 0x8B6AAF8Cu, 0x36A664E5u);
static const TUID IID_IComponentHandler = UIDB(0x93A0BEA3u, 0x0BD045DBu, 0x8E890B0Cu, 0xC1E46AC6u);
static const TUID IID_IConnectionPoint = UIDB(0x70A4156Fu, 0x6E6E4026u, 0x989148BFu, 0xAA60D8D1u);

struct FUnknown { virtual tresult __stdcall queryInterface(const TUID, void**) = 0; virtual unsigned __stdcall addRef() = 0; virtual unsigned __stdcall release() = 0; };
struct PFactoryInfo { char vendor[64], url[256], email[128]; int flags; };
struct PClassInfo { TUID cid; int cardinality; char category[32]; char name[64]; };
struct IPluginFactory : FUnknown {
  virtual tresult __stdcall getFactoryInfo(PFactoryInfo*) = 0; virtual int __stdcall countClasses() = 0;
  virtual tresult __stdcall getClassInfo(int, PClassInfo*) = 0; virtual tresult __stdcall createInstance(const char*, const char*, void**) = 0; };
// factory v3 lets the host introduce itself before anything is created (Arturia and others need it)
static const TUID IID_IPluginFactory3 = UIDB(0x4555A2ABu, 0xC1234E57u, 0x9B122910u, 0x36878931u);
struct IPluginFactory3 : IPluginFactory { virtual tresult __stdcall getClassInfo2(int, void*) = 0; virtual tresult __stdcall getClassInfoUnicode(int, void*) = 0; virtual tresult __stdcall setHostContext(FUnknown*) = 0; };
struct IPluginBase : FUnknown { virtual tresult __stdcall initialize(FUnknown*) = 0; virtual tresult __stdcall terminate() = 0; };
struct IComponent : IPluginBase {
  virtual tresult __stdcall getControllerClassId(TUID) = 0; virtual tresult __stdcall setIoMode(int) = 0; virtual int __stdcall getBusCount(int, int) = 0;
  virtual tresult __stdcall getBusInfo(int, int, int, void*) = 0; virtual tresult __stdcall getRoutingInfo(void*, void*) = 0;
  virtual tresult __stdcall activateBus(int, int, int, unsigned char) = 0; virtual tresult __stdcall setActive(unsigned char) = 0;
  virtual tresult __stdcall setState(void*) = 0; virtual tresult __stdcall getState(void*) = 0; };
struct ViewRect { int left, top, right, bottom; };
struct IPlugFrame;
struct IPlugView : FUnknown {
  virtual tresult __stdcall isPlatformTypeSupported(const char*) = 0; virtual tresult __stdcall attached(void*, const char*) = 0;
  virtual tresult __stdcall removed() = 0; virtual tresult __stdcall onWheel(float) = 0; virtual tresult __stdcall onKeyDown(wchar_t, short, short) = 0;
  virtual tresult __stdcall onKeyUp(wchar_t, short, short) = 0; virtual tresult __stdcall getSize(ViewRect*) = 0; virtual tresult __stdcall onSize(ViewRect*) = 0;
  virtual tresult __stdcall onFocus(unsigned char) = 0; virtual tresult __stdcall setFrame(IPlugFrame*) = 0; virtual tresult __stdcall canResize() = 0;
  virtual tresult __stdcall checkSizeConstraint(ViewRect*) = 0; };
struct IPlugFrame : FUnknown { virtual tresult __stdcall resizeView(IPlugView*, ViewRect*) = 0; };
struct IEditController : IPluginBase {
  virtual tresult __stdcall setComponentState(void*) = 0; virtual tresult __stdcall setState(void*) = 0; virtual tresult __stdcall getState(void*) = 0;
  virtual int __stdcall getParameterCount() = 0; virtual tresult __stdcall getParameterInfo(int, void*) = 0;
  virtual tresult __stdcall getParamStringByValue(unsigned, double, void*) = 0; virtual tresult __stdcall getParamValueByString(unsigned, void*, double*) = 0;
  virtual double __stdcall normalizedParamToPlain(unsigned, double) = 0; virtual double __stdcall plainParamToNormalized(unsigned, double) = 0;
  virtual double __stdcall getParamNormalized(unsigned) = 0; virtual tresult __stdcall setParamNormalized(unsigned, double) = 0;
  virtual tresult __stdcall setComponentHandler(FUnknown*) = 0; virtual IPlugView* __stdcall createView(const char*) = 0; };
struct IConnectionPoint : FUnknown { virtual tresult __stdcall connect(IConnectionPoint*) = 0; virtual tresult __stdcall disconnect(IConnectionPoint*) = 0; virtual tresult __stdcall notify(void*) = 0; };

static const TUID IID_IMessage = UIDB(0x936F033Bu, 0xC6C047DBu, 0xBB0882F8u, 0x13C1E613u);
static const TUID IID_IAttributeList = UIDB(0x1E5F0AEBu, 0xCC7F4533u, 0xA2544011u, 0x38AD5EE4u);

// processor and editor of many plug-ins talk through messages the host must create
struct Attrs : FUnknown {
  std::map<std::string, std::string> v; unsigned rc = 1;
  tresult __stdcall queryInterface(const TUID iid, void** o) override { if (!memcmp(iid, IID_IAttributeList, 16) || !memcmp(iid, IID_FUnknown, 16)) { addRef(); *o = this; return kOk; } *o = nullptr; return kNoInterface; }
  unsigned __stdcall addRef() override { return ++rc; } unsigned __stdcall release() override { unsigned r = --rc; if (!r) delete this; return r; }
  tresult put(const char* k, const void* p, size_t n) { v[k].assign((const char*)p, n); return kOk; }
  bool got(const char* k, std::string*& s) { auto i = v.find(k); if (i == v.end()) return false; s = &i->second; return true; }
  virtual tresult __stdcall setInt(const char* k, long long x) { return put(k, &x, 8); }
  virtual tresult __stdcall getInt(const char* k, long long& x) { std::string* s; if (!got(k, s) || s->size() != 8) return 1; memcpy(&x, s->data(), 8); return kOk; }
  virtual tresult __stdcall setFloat(const char* k, double x) { return put(k, &x, 8); }
  virtual tresult __stdcall getFloat(const char* k, double& x) { std::string* s; if (!got(k, s) || s->size() != 8) return 1; memcpy(&x, s->data(), 8); return kOk; }
  virtual tresult __stdcall setString(const char* k, const wchar_t* x) { return put(k, x, (wcslen(x) + 1) * 2); }
  virtual tresult __stdcall getString(const char* k, wchar_t* x, unsigned bytes) { std::string* s; if (!got(k, s) || !bytes) return 1; size_t n = std::min<size_t>(bytes, s->size()); memcpy(x, s->data(), n); x[n / 2 - (n / 2 ? 1 : 0)] = 0; if (n < bytes) x[n / 2] = 0; return kOk; }
  virtual tresult __stdcall setBinary(const char* k, const void* p, unsigned n) { return put(k, p, n); }
  virtual tresult __stdcall getBinary(const char* k, const void*& p, unsigned& n) { std::string* s; if (!got(k, s)) return 1; p = s->data(); n = (unsigned)s->size(); return kOk; }
};
struct Msg : FUnknown {
  std::string id; Attrs* a = new Attrs; unsigned rc = 1;
  ~Msg() { a->release(); }
  tresult __stdcall queryInterface(const TUID iid, void** o) override { if (!memcmp(iid, IID_IMessage, 16) || !memcmp(iid, IID_FUnknown, 16)) { addRef(); *o = this; return kOk; } *o = nullptr; return kNoInterface; }
  unsigned __stdcall addRef() override { return ++rc; } unsigned __stdcall release() override { unsigned r = --rc; if (!r) delete this; return r; }
  virtual const char* __stdcall getMessageID() { return id.c_str(); }
  virtual void __stdcall setMessageID(const char* s) { id = s ? s : ""; }
  virtual FUnknown* __stdcall getAttributes() { return a; }
};

static HWND g_wnd;
// one static object answers every host interface a plug-in may ask for
struct Host : FUnknown {
  struct App : FUnknown {
    tresult __stdcall queryInterface(const TUID iid, void** o) override { return host->queryInterface(iid, o); }
    unsigned __stdcall addRef() override { return 1; } unsigned __stdcall release() override { return 1; }
    virtual tresult __stdcall getName(wchar_t* s) { wcscpy_s(s, 128, L"Rummage"); return kOk; }
    virtual tresult __stdcall createInstance(TUID cid, TUID iid, void** o) {
      if (!memcmp(cid, IID_IMessage, 16) && !memcmp(iid, IID_IMessage, 16)) { *o = new Msg; return kOk; }
      if (!memcmp(cid, IID_IAttributeList, 16) && !memcmp(iid, IID_IAttributeList, 16)) { *o = new Attrs; return kOk; }
      *o = nullptr; return kNotImpl; }
    Host* host;
  } app;
  struct Handler : FUnknown {
    tresult __stdcall queryInterface(const TUID iid, void** o) override { return host->queryInterface(iid, o); }
    unsigned __stdcall addRef() override { return 1; } unsigned __stdcall release() override { return 1; }
    virtual tresult __stdcall beginEdit(unsigned) { return kOk; } virtual tresult __stdcall performEdit(unsigned, double) { return kOk; }
    virtual tresult __stdcall endEdit(unsigned) { return kOk; } virtual tresult __stdcall restartComponent(int) { return kOk; }
    Host* host;
  } handler;
  struct Frame : IPlugFrame {
    tresult __stdcall queryInterface(const TUID iid, void** o) override { return host->queryInterface(iid, o); }
    unsigned __stdcall addRef() override { return 1; } unsigned __stdcall release() override { return 1; }
    tresult __stdcall resizeView(IPlugView* v, ViewRect* r) override {
      SetWindowPos(g_wnd, nullptr, 0, 0, r->right - r->left, r->bottom - r->top, SWP_NOMOVE | SWP_NOZORDER | SWP_NOACTIVATE);
      v->onSize(r); return kOk; }
    Host* host;
  } frame;
  Host() { app.host = handler.host = frame.host = this; }
  tresult __stdcall queryInterface(const TUID iid, void** o) override {
    if (!memcmp(iid, IID_IHostApplication, 16) || !memcmp(iid, IID_FUnknown, 16)) { *o = &app; return kOk; }
    if (!memcmp(iid, IID_IComponentHandler, 16)) { *o = &handler; return kOk; }
    if (!memcmp(iid, IID_IPlugFrame, 16)) { *o = &frame; return kOk; }
    *o = nullptr; return kNoInterface; }
  unsigned __stdcall addRef() override { return 1; } unsigned __stdcall release() override { return 1; }
} g_host;

static std::wstring widen(const char* s) { int n = MultiByteToWideChar(CP_UTF8, 0, s, -1, nullptr, 0); std::wstring w(n, 0); MultiByteToWideChar(CP_UTF8, 0, s, -1, &w[0], n); w.resize(n - 1); return w; }
static std::wstring dllOf(std::wstring p) {
  DWORD a = GetFileAttributesW(p.c_str());
  if (a != INVALID_FILE_ATTRIBUTES && (a & FILE_ATTRIBUTE_DIRECTORY)) {
    while (!p.empty() && (p.back() == L'\\' || p.back() == L'/')) p.pop_back();
    size_t s = p.find_last_of(L"\\/"); p += L"\\Contents\\x86_64-win\\" + p.substr(s + 1); }
  return p; }
static void pump(int ms) {
  DWORD end = GetTickCount() + ms; MSG m;
  while ((int)(end - GetTickCount()) > 0) { while (PeekMessageW(&m, nullptr, 0, 0, PM_REMOVE)) { TranslateMessage(&m); DispatchMessageW(&m); } Sleep(10); } }

static int encoderClsid(const wchar_t* mime, CLSID* c) {
  UINT n = 0, sz = 0; Gdiplus::GetImageEncodersSize(&n, &sz); if (!sz) return -1;
  auto* e = (Gdiplus::ImageCodecInfo*)malloc(sz); Gdiplus::GetImageEncoders(n, sz, e);
  for (UINT i = 0; i < n; i++) if (!wcscmp(e[i].MimeType, mime)) { *c = e[i].Clsid; free(e); return 0; }
  free(e); return -1; }
// returns 1 saved, 0 picture looked empty (editor not drawn yet), -1 error
static int capture(const wchar_t* out, int w, int h) {
  HDC wdc = GetDC(g_wnd), mdc = CreateCompatibleDC(wdc); HBITMAP bmp = CreateCompatibleBitmap(wdc, w, h); HGDIOBJ old = SelectObject(mdc, bmp);
  BOOL ok = PrintWindow(g_wnd, mdc, 2 /*PW_RENDERFULLCONTENT: includes GPU-drawn editors*/);
  SelectObject(mdc, old);
  int r = -1;
  if (ok) {
    BITMAPINFO bi = {}; bi.bmiHeader = { sizeof(BITMAPINFOHEADER), w, -h, 1, 32, BI_RGB };
    std::string px((size_t)w * h * 4, 0); GetDIBits(mdc, bmp, 0, h, &px[0], &bi, DIB_RGB_COLORS);
    // an editor that has not painted yet comes back as one flat colour
    const unsigned* p = (const unsigned*)px.data(); size_t n = (size_t)w * h, diff = 0;
    for (size_t i = 0; i < n; i += 97) if ((p[i] & 0xFFFFFF) != (p[0] & 0xFFFFFF)) diff++;
    if (diff * 97 < n / 50) r = 0;
    else { Gdiplus::Bitmap b(bmp, nullptr); CLSID png; r = (!encoderClsid(L"image/png", &png) && b.Save(out, &png) == Gdiplus::Ok) ? 1 : -1; }
  }
  DeleteObject(bmp); DeleteDC(mdc); ReleaseDC(g_wnd, wdc); return r; }

// prefer a secondary monitor, so any licence pop-up a plug-in opens lands away from the user's work
static POINT g_at = { 0, 0 };
static BOOL CALLBACK pickMon(HMONITOR m, HDC, LPRECT r, LPARAM) { MONITORINFO mi = { sizeof(mi) }; GetMonitorInfoW(m, &mi); if (!(mi.dwFlags & MONITORINFOF_PRIMARY)) { g_at = { r->left, r->top }; return FALSE; } return TRUE; }
int wmain(int argc, wchar_t** argv) {
  if (argc < 3) { fprintf(stderr, "usage: vst3snap <bundle.vst3> --list | <out.png> [name]\n"); return 1; }
  SetErrorMode(SEM_FAILCRITICALERRORS | SEM_NOGPFAULTERRORBOX | SEM_NOOPENFILEERRORBOX); // a crashing plug-in must not pop a dialog
  SetProcessDpiAwarenessContext(DPI_AWARENESS_CONTEXT_PER_MONITOR_AWARE_V2);
  OleInitialize(nullptr);
  bool list = !wcscmp(argv[2], L"--list");
  wchar_t full[MAX_PATH * 4]; GetFullPathNameW(argv[1], MAX_PATH * 4, full, nullptr);
  std::wstring dll = dllOf(full);
  SetDllDirectoryW(dll.substr(0, dll.find_last_of(L"\\/")).c_str());
  HMODULE mod = LoadLibraryExW(dll.c_str(), nullptr, LOAD_WITH_ALTERED_SEARCH_PATH);
  if (!mod) { fprintf(stderr, "LOAD_FAILED %lu\n", GetLastError()); return 2; }
  typedef bool (*InitDll)(); typedef IPluginFactory* (*GetFactory)();
  if (auto init = (InitDll)GetProcAddress(mod, "InitDll")) init();
  auto gf = (GetFactory)GetProcAddress(mod, "GetPluginFactory");
  IPluginFactory* f = gf ? gf() : nullptr;
  if (!f) { fprintf(stderr, "NO_FACTORY\n"); return 2; }
  IPluginFactory3* f3 = nullptr;
  if (f->queryInterface(IID_IPluginFactory3, (void**)&f3) == kOk && f3) f3->setHostContext(&g_host.app);
  PClassInfo ci, pick = {}; bool found = false;
  std::wstring want = argc > 3 ? argv[3] : L"";
  for (int i = 0; i < f->countClasses(); i++) {
    if (f->getClassInfo(i, &ci) != kOk || strcmp(ci.category, "Audio Module Class")) continue;
    if (list) { printf("%s\n", ci.name); continue; }
    if (!found && (want.empty() || !_wcsicmp(widen(ci.name).c_str(), want.c_str()))) { pick = ci; found = true; } }
  if (list) { fflush(stdout); TerminateProcess(GetCurrentProcess(), 0); }
  if (!found) { fprintf(stderr, "NO_SUCH_PLUGIN\n"); return 2; }

  IComponent* comp = nullptr; IEditController* ctl = nullptr;
  if (f->createInstance(pick.cid, IID_IComponent, (void**)&comp) != kOk || !comp) {
    // some factories only hand out a plain object and answer the specific interface afterwards
    FUnknown* u = nullptr; comp = nullptr;
    if (f->createInstance(pick.cid, IID_FUnknown, (void**)&u) == kOk && u) u->queryInterface(IID_IComponent, (void**)&comp);
    if (!comp) { fprintf(stderr, "CREATE_FAILED %s\n", pick.name); return 2; } }
  comp->initialize(&g_host.app);
  if (comp->queryInterface(IID_IEditController, (void**)&ctl) != kOk || !ctl) {
    TUID cc; ctl = nullptr;
    if (comp->getControllerClassId(cc) == kOk && f->createInstance(cc, IID_IEditController, (void**)&ctl) == kOk && ctl) ctl->initialize(&g_host.app);
    else ctl = nullptr; }
  if (!ctl) { fprintf(stderr, "NO_EDITOR\n"); return 3; }
  ctl->setComponentHandler(&g_host.handler);
  IConnectionPoint *a = nullptr, *b = nullptr; // some editors stay blank until they can talk to their processor
  if (comp->queryInterface(IID_IConnectionPoint, (void**)&a) == kOk && ctl->queryInterface(IID_IConnectionPoint, (void**)&b) == kOk && a && b && (void*)a != (void*)b) { a->connect(b); b->connect(a); }
  IPlugView* view = ctl->createView("editor");
  if (!view || view->isPlatformTypeSupported("HWND") != kOk) { fprintf(stderr, "NO_EDITOR\n"); return 3; }

  WNDCLASSW wc = {}; wc.lpfnWndProc = DefWindowProcW; wc.hInstance = GetModuleHandleW(nullptr); wc.lpszClassName = L"vst3snap"; wc.hbrBackground = (HBRUSH)GetStockObject(BLACK_BRUSH);
  RegisterClassW(&wc);
  EnumDisplayMonitors(nullptr, nullptr, pickMon, 0);
  ViewRect vr = { 0, 0, 800, 500 }; view->getSize(&vr);
  int w = std::max(64, vr.right - vr.left), h = std::max(64, vr.bottom - vr.top);
  // on screen so the compositor renders it, but fully see-through, click-through and never focused
  g_wnd = CreateWindowExW(WS_EX_LAYERED | WS_EX_TRANSPARENT | WS_EX_TOOLWINDOW | WS_EX_NOACTIVATE, L"vst3snap", L"", WS_POPUP, g_at.x, g_at.y, w, h, nullptr, nullptr, wc.hInstance, nullptr);
  SetLayeredWindowAttributes(g_wnd, 0, 1, LWA_ALPHA);
  ShowWindow(g_wnd, SW_SHOWNOACTIVATE);
  view->setFrame(&g_host.frame);
  if (view->attached(g_wnd, "HWND") != kOk) { fprintf(stderr, "ATTACH_FAILED\n"); return 3; }
  view->getSize(&vr); w = std::max(64, vr.right - vr.left); h = std::max(64, vr.bottom - vr.top);
  SetWindowPos(g_wnd, nullptr, 0, 0, w, h, SWP_NOMOVE | SWP_NOZORDER | SWP_NOACTIVATE);

  Gdiplus::GdiplusStartupInput gi; ULONG_PTR gt; Gdiplus::GdiplusStartup(&gt, &gi, nullptr);
  int settle = 1200, r = 0;
  for (int t = 0; t < 6 && r == 0; t++) { pump(t ? 700 : settle); RECT cr; GetClientRect(g_wnd, &cr); r = capture(argv[2], cr.right, cr.bottom); }
  if (r == 1) printf("captured %dx%d\n", w, h); else fprintf(stderr, r == 0 ? "BLANK\n" : "CAPTURE_FAILED\n");
  fflush(stdout); fflush(stderr);
  // skip teardown: many plug-ins crash or hang on unload, and the process is done anyway
  TerminateProcess(GetCurrentProcess(), r == 1 ? 0 : 4);
}
